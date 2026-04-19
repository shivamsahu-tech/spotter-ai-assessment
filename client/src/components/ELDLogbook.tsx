'use client';

import React, { useState, useMemo } from 'react';

// --- UTILITY FUNCTIONS ---

// Converts 8.5 to "08:30 AM"
const formatTime = (decimalHours: number) => {
  if (decimalHours === 0 || decimalHours === 24) return 'Midnight';
  if (decimalHours === 12) return 'Noon';
  
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

const STATUS_Y_MAP: Record<string, number> = {
  "Off Duty": 50,
  "Sleeper Berth": 150,
  "Driving": 250,
  "On Duty (Not Driving)": 350,
};

// --- TYPES ---
type RawLogEvent = {
  status: string;
  duration_hours: number;
  reason?: string;
  coordinate?: [number, number];
};

type ProcessedLogEvent = RawLogEvent & {
  start_time: number;
  end_time: number;
};

// --- COMPONENT ---
export default function ELDLogbook({ 
  flatLogs, 
  speedMph = 60,
  initialStartDate = new Date().toISOString().split('T')[0],
  initialStartHour = 0
}: { 
  flatLogs: RawLogEvent[]; 
  speedMph?: number;
  initialStartDate?: string;
  initialStartHour?: number;
}) {
  const [startHour, setStartHour] = useState<number>(initialStartHour);
  const [startDate, setStartDate] = useState<string>(initialStartDate);

  // Helper to get correct date string for each day page
  const getFormattedDate = (baseDateStr: string, offsetDays: number) => {
    try {
      const d = new Date(baseDateStr + 'T12:00:00Z');
      d.setDate(d.getDate() + offsetDays);
      return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return baseDateStr;
    }
  };

  // 1. DYNAMIC MIDNIGHT SPLITTER
  // Reactively chunks the flat array into 24-hour days whenever startHour changes
  const dailyPages = useMemo(() => {
    if (!flatLogs || flatLogs.length === 0) return [];

    const days: ProcessedLogEvent[][] = [];
    let currentDay: ProcessedLogEvent[] = [];
    let currentTime = startHour;

    flatLogs.forEach((event) => {
      let duration = event.duration_hours;
      const status = event.status;
      const reason = event.reason || '';
      const coord = event.coordinate;

      while (duration > 0.001) {
        const hoursLeftInDay = 24.0 - currentTime;

        if (duration <= hoursLeftInDay) {
          // Fits entirely in today
          currentDay.push({
            status,
            duration_hours: duration,
            start_time: currentTime,
            end_time: currentTime + duration,
            reason,
            coordinate: coord,
          });
          currentTime += duration;
          duration = 0;
        } else {
          // Hits midnight, split it
          currentDay.push({
            status,
            duration_hours: hoursLeftInDay,
            start_time: currentTime,
            end_time: 24.0,
            reason: reason ? `${reason} (Split at Midnight)` : 'Split at Midnight',
            coordinate: coord,
          });
          days.push(currentDay);
          currentDay = [];
          currentTime = 0.0;
          duration -= hoursLeftInDay;
        }
      }
    });

    if (currentDay.length > 0) days.push(currentDay);
    return days;
  }, [flatLogs, startHour]);


  // 2. SVG POLYLINE GENERATOR
  const generatePolyline = (dayLogs: ProcessedLogEvent[]) => {
    const points: string[] = [];
    
    dayLogs.forEach((event, index) => {
      const startX = event.start_time * 100;
      const endX = event.end_time * 100;
      const currentY = STATUS_Y_MAP[event.status] || 50;

      if (index > 0) {
        const prevY = STATUS_Y_MAP[dayLogs[index - 1].status] || 50;
        points.push(`${startX},${prevY}`); // Vertical drop/climb
      }

      points.push(`${startX},${currentY}`); // Horizontal start
      points.push(`${endX},${currentY}`);   // Horizontal end
    });

    return points.join(" ");
  };


  return (
    <div className="max-w-6xl mx-auto p-4 space-y-12">
      
      {/* USER CONTROL PANEL */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Trip Log Generator</h2>
          <p className="text-slate-500 text-sm">Review logs and export as PDF.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">Date:</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="border-2 border-slate-300 rounded-md p-2 bg-slate-50 focus:border-teal-500 focus:ring-0 font-mono outline-none" 
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">Time:</label>
            <select 
              value={startHour} 
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="border-2 border-slate-300 rounded-md p-2 bg-slate-50 focus:border-teal-500 focus:ring-0 font-mono outline-none"
            >
              {[...Array(24)].map((_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? 'Midnight (00:00)' : i === 12 ? 'Noon (12:00)' : `${i.toString().padStart(2, '0')}:00`}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => window.print()} 
            className="bg-slate-800 text-white px-4 py-2 rounded-md font-bold hover:bg-slate-900 transition-colors shadow-sm ml-auto md:ml-0"
          >
            Export as PDF
          </button>
        </div>
      </div>

      {/* RENDER EACH 24-HOUR DAY AS A SEPARATE PAGE */}
      {dailyPages.map((dayLogs, dayIndex) => {
        
        // Calculate daily totals for the right column
        const totals = dayLogs.reduce((acc, log) => {
          acc[log.status] = (acc[log.status] || 0) + log.duration_hours;
          return acc;
        }, {} as Record<string, number>);

        const totalDrivingMiles = (totals['Driving'] || 0) * speedMph;

        return (
          <div key={dayIndex} className="bg-white p-8 rounded-sm shadow-xl border border-slate-300 mb-12 print:shadow-none print:border-none">
            
            {/* FMCSA HEADER */}
            <div className="flex justify-between border-b-2 border-black pb-4 mb-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tighter">Driver's Daily Log</h1>
                <p className="text-lg font-bold text-slate-700 mt-1">{getFormattedDate(startDate, dayIndex)}</p>
              </div>
              <div className="text-right font-mono font-semibold">
                <p>Day {dayIndex + 1} of Trip</p>
                <p>Total Miles Driven Today: {Math.round(totalDrivingMiles)}</p>
              </div>
            </div>

            {/* THE SVG GRAPH GRID */}
            <div className="relative w-full overflow-x-auto">
              {/* Status Labels */}
              <div className="absolute left-0 top-0 bottom-0 w-24 flex flex-col justify-between py-[12px] text-xs font-bold bg-white z-10 border-r-2 border-black">
                <div className="h-[25%] flex items-center px-1">1. Off Duty</div>
                <div className="h-[25%] flex items-center px-1">2. Sleeper</div>
                <div className="h-[25%] flex items-center px-1">3. Driving</div>
                <div className="h-[25%] flex items-center px-1">4. On Duty</div>
              </div>

              {/* The SVG Canvas */}
              <div className="ml-24">
                <svg viewBox="0 0 2400 400" className="w-full h-auto border-y-2 border-r-2 border-black bg-white" preserveAspectRatio="none">
                  
                  {/* Draw 24 hour lines */}
                  {[...Array(25)].map((_, i) => (
                    <g key={i}>
                      <line x1={i * 100} y1={0} x2={i * 100} y2={400} stroke="#cbd5e1" strokeWidth={i % 6 === 0 ? "3" : "1"} />
                      {/* Half-hour tick marks */}
                      {i < 24 && <line x1={(i * 100) + 50} y1={0} x2={(i * 100) + 50} y2={400} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />}
                      {/* Hour Labels at top */}
                      <text x={i * 100} y={20} fontSize="16" textAnchor="middle" fill="#64748b" className="font-mono">
                        {i === 0 || i === 24 ? 'M' : i === 12 ? 'N' : i % 12}
                      </text>
                    </g>
                  ))}

                  {/* Horizontal row dividers */}
                  <line x1="0" y1="100" x2="2400" y2="100" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="0" y1="200" x2="2400" y2="200" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="0" y1="300" x2="2400" y2="300" stroke="#94a3b8" strokeWidth="1" />

                  {/* THE ACTUAL LOG LINE */}
                  <polyline 
                    points={generatePolyline(dayLogs)} 
                    fill="none" 
                    stroke="#ef4444" // Bright Red
                    strokeWidth="6" 
                    strokeLinejoin="round" 
                  />
                </svg>
              </div>

              {/* Totals Column (Right) */}
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-white border-l-2 border-black flex flex-col justify-between py-[12px] text-sm font-mono font-bold text-center z-10">
                <div className="h-[25%] flex items-center justify-center border-b border-slate-300">{(totals['Off Duty'] || 0).toFixed(1)}</div>
                <div className="h-[25%] flex items-center justify-center border-b border-slate-300">{(totals['Sleeper Berth'] || 0).toFixed(1)}</div>
                <div className="h-[25%] flex items-center justify-center border-b border-slate-300">{(totals['Driving'] || 0).toFixed(1)}</div>
                <div className="h-[25%] flex items-center justify-center">{(totals['On Duty (Not Driving)'] || 0).toFixed(1)}</div>
              </div>
            </div>

            {/* REMARKS SECTION */}
            <div className="mt-8 border-t-4 border-black pt-4">
              <h3 className="font-extrabold text-xl mb-4">Remarks & Duty Status Changes</h3>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded text-sm font-mono">
                {dayLogs.map((log, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 py-2 border-b border-slate-200 last:border-0">
                    <div className="col-span-2 font-bold">{formatTime(log.start_time)}</div>
                    <div className="col-span-3 text-slate-600">{log.status}</div>
                    <div className="col-span-4 text-slate-800">{log.reason || '-'}</div>
                    <div className="col-span-3 text-right text-teal-600">
                      {log.coordinate ? `[${log.coordinate[1]}, ${log.coordinate[0]}]` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}