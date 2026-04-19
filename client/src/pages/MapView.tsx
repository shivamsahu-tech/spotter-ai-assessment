import { useLocation, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet'
import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import LogTimeline from '../components/LogTimeline'
import { ArrowLeft, Route, Truck, MapPin, Moon, Coffee, Package, Navigation, Loader2 } from 'lucide-react'

// Leaflet icon fix for Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Status metadata
const STATUS_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  'Driving':                { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', label: 'Driving' },
  'On Duty (Not Driving)':  { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'On Duty' },
  'Off Duty':               { color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', label: 'Off Duty' },
  'Sleeper Berth':          { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: 'Sleeper' },
  'current':                { color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', label: 'Your Location' },
}

// Build an SVG pin that has a precise anchor at the sharp tip bottom
function buildIcon(
  status: string,
  isFirst = false,
  isLast = false,
  isCurrentLoc = false
): L.DivIcon {
  const meta = STATUS_META[isCurrentLoc ? 'current' : status] ?? STATUS_META['Off Duty']
  const color = meta.color

  // Icon emoji/letter
  const innerSvg = isCurrentLoc
    ? `<circle cx="12" cy="12" r="6" fill="white" opacity="0.9"/>`
    : isLast
    ? `<path d="M12 7 L15 13 H9 Z" fill="white"/>`  // flag / destination triangle
    : isFirst
    ? `<rect x="8" y="8" width="8" height="8" rx="2" fill="white"/>`
    : ''

  // Ring pulse for current location
  const ring = isCurrentLoc
    ? `<circle cx="20" cy="20" r="18" fill="${color}" opacity=".15"/>
       <circle cx="20" cy="20" r="24" fill="${color}" opacity=".07"/>`
    : ''

  // Pin shape: circle head + triangle tip
  const pinSize = isFirst || isLast ? 44 : 38
  const cx = pinSize / 2
  const r = isFirst || isLast ? 14 : 11
  const tipY = cx + r + 6
  // The total SVG height needs to accommodate pin head + tip
  const svgH = tipY + 2

  const svgStr = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${pinSize}" height="${svgH}" viewBox="0 0 ${pinSize} ${svgH}">
      ${ring}
      <!-- Drop shadow filter -->
      <defs>
        <filter id="sh" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${color}" flood-opacity="0.35"/>
        </filter>
      </defs>
      <!-- Circle head -->
      <circle cx="${cx}" cy="${r + 4}" r="${r}" fill="${color}" filter="url(#sh)" />
      <!-- Tip triangle -->
      <polygon points="${cx},${tipY} ${cx - 5},${cx - 2} ${cx + 5},${cx - 2}" fill="${color}" />
      <!-- Border ring -->
      <circle cx="${cx}" cy="${r + 4}" r="${r - 3}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
      <!-- Inner icon placeholder -->
      <g transform="translate(${cx - 12}, ${r - 8})" fill="white">${innerSvg}</g>
    </svg>
  `

  return L.divIcon({
    html: svgStr,
    className: '',
    iconSize: [pinSize, svgH],
    iconAnchor: [pinSize / 2, svgH],   // anchor at the very tip
    tooltipAnchor: [pinSize / 2, -(svgH)],
  })
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [60, 60] })
    }
  }, [map, positions])
  return null
}

function fmtHrs(hrs: number) {
  const h = Math.floor(hrs)
  const m = Math.round((hrs - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function MapView() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result

  if (!result) { navigate('/'); return null }

  const { trip_logs, route_geometry, distances } = result

  // ELD Modal state
  const [showEldModal, setShowEldModal] = useState(false)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [startHour, setStartHour] = useState(0)

  // New ELD Form State
  const [truckNumber, setTruckNumber] = useState('TRK-902')
  const [carrierName, setCarrierName] = useState('Dummy Carrier Inc')
  const [officeAddress, setOfficeAddress] = useState('1234 Dummy St, Seattle')
  const [homeTerminal, setHomeTerminal] = useState('Terminal A, Seattle')
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [loaderText, setLoaderText] = useState('Initializing...')

  const polylinePositions = useMemo<[number, number][]>(
    () => route_geometry.map(([lng, lat]: [number, number]) => [lat, lng]),
    [route_geometry]
  )

  const stops = useMemo(() => trip_logs.filter((e: any) => e.coordinate), [trip_logs])

  const totalDrivingHrs  = trip_logs.filter((e: any) => e.status === 'Driving').reduce((s: number, e: any) => s + e.duration_hours, 0)
  const totalRestHrs     = trip_logs.filter((e: any) => e.status !== 'Driving').reduce((s: number, e: any) => s + e.duration_hours, 0)
  const totalMiles       = distances.onloading_distance + distances.offloading_distance

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ background: 'linear-gradient(140deg,#dff2f0 0%,#f4f7f9 50%,#edf2f7 100%)' }}
    >
      {/* ── Top bar ── */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-slate-200/70 bg-white/80 backdrop-blur-md z-50 flex-shrink-0">
        <button
          onClick={() => navigate('/trip')}
          className="flex items-center gap-2 text-slate-500 hover:text-teal-700 transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          New Trip
        </button>

        <div className="flex-1 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shadow-sm">
            <Route className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-slate-800 font-bold text-base">Trip Route &amp; HOS Logs</h1>
        </div>

        {/* Summary chips */}
        <div className="hidden sm:flex items-center gap-2">
          <Chip label="Distance"  value={`${totalMiles.toFixed(0)} mi`}          color="teal" />
          <Chip label="Drive"     value={fmtHrs(totalDrivingHrs)}                color="emerald" />
          <Chip label="Rest"      value={fmtHrs(totalRestHrs)}                   color="violet" />
          <Chip label="Events"    value={`${trip_logs.length}`}                  color="amber" />
        </div>
        
        <button
          onClick={() => setShowEldModal(true)}
          className="ml-auto sm:ml-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
        >
          Download ELD Book
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 overflow-y-auto border-r border-slate-200/80 bg-white/70 backdrop-blur-sm">
          <LogTimeline logs={trip_logs} />
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer center={[39.5, -98.35]} zoom={5} style={{ width: '100%', height: '100%' }}>
            {/* Street tile layer */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <FitBounds positions={polylinePositions} />

            {/* Route polyline - teal glow */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{ color: '#14b8a6', weight: 5, opacity: 0.85 }}
            />
            {/* Route outline for depth */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.3 }}
            />

            {/* Stop markers */}
            {stops.map((stop: any, i: number) => {
              const isFirst = i === 0
              const isLast  = i === stops.length - 1
              const meta    = STATUS_META[stop.status] ?? STATUS_META['Off Duty']
              const pos: [number, number] = [stop.coordinate[1], stop.coordinate[0]]

              return (
                <Marker
                  key={i}
                  position={pos}
                  icon={buildIcon(stop.status, isFirst, isLast)}
                >
                  <Tooltip
                    permanent={isFirst || isLast}
                    direction="top"
                    offset={[0, -4]}
                    opacity={1}
                    className=""
                  >
                    <div
                      style={{
                        fontFamily: 'inherit',
                        minWidth: 170,
                        background: 'white',
                        border: `1.5px solid ${meta.border}`,
                        borderRadius: 12,
                        padding: '10px 13px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <div style={{
                          width: 9, height: 9, borderRadius: '50%',
                          background: meta.color, flexShrink: 0,
                        }} />
                        <span style={{ fontWeight: 700, fontSize: 12, color: '#0f172a' }}>
                          {isFirst ? '🚛 Current Location' : isLast ? '📍 Destination' : meta.label}
                        </span>
                      </div>
                      {stop.reason && (
                        <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 5px' }}>{stop.reason}</p>
                      )}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <StatBit label="Duration" value={fmtHrs(stop.duration_hours)} />
                        {stop.start_time_of_day !== undefined && (
                          <StatBit label="Start" value={`Hour ${stop.start_time_of_day?.toFixed(1) ?? '—'}`} />
                        )}
                        {stop.distance_miles !== undefined && (
                          <StatBit label="Distance" value={`${stop.distance_miles?.toFixed(0)} mi`} />
                        )}
                      </div>
                    </div>
                  </Tooltip>
                </Marker>
              )
            })}
          </MapContainer>

          {/* Map legend overlay */}
          <div
            className="absolute bottom-5 left-5 z-[500] rounded-2xl p-4 text-xs font-semibold space-y-1.5"
            style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          >
            <p className="text-slate-400 uppercase tracking-[0.13em] text-[9px] mb-2 font-bold">Legend</p>
            {Object.entries(STATUS_META).filter(([k]) => k !== 'current').map(([status, m]) => (
              <div key={status} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                <span className="text-slate-600">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showEldModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-xl shadow-2xl relative overflow-hidden">
            
            {/* Loader Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-[1100] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Generating ELD Logbook</h3>
                <p className="text-teal-600 font-medium animate-pulse">{loaderText}</p>
                <p className="text-slate-400 text-xs mt-4">This takes a moment to process geographic data and render PDF pages.</p>
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
                <Truck className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">ELD Logbook Data</h2>
                <p className="text-slate-500 text-sm">Fill in the details for the PDF report.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Trip Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    className="w-full border-2 border-slate-100 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all outline-none font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Start Hour</label>
                  <select 
                    value={startHour} 
                    onChange={(e) => setStartHour(Number(e.target.value))} 
                    className="w-full border-2 border-slate-100 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all outline-none font-medium"
                  >
                    {[...Array(24)].map((_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? '00:00 (Midnight)' : i === 12 ? '12:00 (Noon)' : `${i.toString().padStart(2, '0')}:00`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Truck Number</label>
                  <input 
                    type="text" 
                    value={truckNumber} 
                    onChange={(e) => setTruckNumber(e.target.value)} 
                    placeholder="TRK-000"
                    className="w-full border-2 border-slate-100 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all outline-none font-medium" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Carrier Name</label>
                  <input 
                    type="text" 
                    value={carrierName} 
                    onChange={(e) => setCarrierName(e.target.value)} 
                    className="w-full border-2 border-slate-100 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all outline-none font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Office Address</label>
                  <textarea 
                    value={officeAddress} 
                    onChange={(e) => setOfficeAddress(e.target.value)} 
                    rows={1}
                    className="w-full border-2 border-slate-100 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all outline-none font-medium resize-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Home Terminal</label>
                  <input 
                    type="text" 
                    value={homeTerminal} 
                    onChange={(e) => setHomeTerminal(e.target.value)} 
                    className="w-full border-2 border-slate-100 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all outline-none font-medium" 
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowEldModal(false)} 
                className="flex-1 py-4 rounded-2xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    setIsGenerating(true)
                    setLoaderText('Connecting to HOS engine...')
                    
                    // Small delay to show initial text
                    await new Promise(r => setTimeout(r, 600))
                    setLoaderText('Resolving geographic coordinates (Reverse Geo)...')
                    
                    const payload = {
                      trip_logs: trip_logs,
                      speed: 60, // Default or taken from settings
                      truck: truckNumber,
                      carrier: carrierName,
                      office: officeAddress,
                      home: homeTerminal,
                      from_coord: trip_logs[0]?.coordinate || [0,0],
                      to_coord: trip_logs[trip_logs.length - 1]?.coordinate || [0,0],
                      start_time: new Date(`${startDate}T${startHour.toString().padStart(2, '0')}:00:00Z`).toISOString()
                    };

                    const timeoutId = setTimeout(() => {
                      setLoaderText('Still working... Mapping large trip datasets...')
                    }, 5000)

                    const res = await fetch('http://localhost:8000/api/generate-logbook/', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });

                    clearTimeout(timeoutId)
                    setLoaderText('Formatting PDF pages and headers...')
                    await new Promise(r => setTimeout(r, 800))

                    if (!res.ok) {
                      throw new Error(`Server error: ${res.status}`);
                    }

                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const downloadLink = document.createElement('a');
                    downloadLink.href = url;
                    downloadLink.download = 'logbook.pdf';
                    downloadLink.style.display = 'none';
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    setTimeout(() => {
                      downloadLink.remove();
                      window.URL.revokeObjectURL(url);
                    }, 1000);
                    
                    setShowEldModal(false)
                  } catch (err) {
                    console.error(err)
                    alert('PDF Generation failed. Is the server running?')
                  } finally {
                    setIsGenerating(false)
                  }
                }} 
                className="flex-[2] py-4 rounded-2xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98]"
              >
                Download the ELD book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatBit({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 1 }}>{label}</p>
      <p style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>{value}</p>
    </div>
  )
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    teal:    'bg-teal-50 text-teal-700 border-teal-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    violet:  'bg-violet-50 text-violet-700 border-violet-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
  }
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${colors[color] ?? ''}`}>
      <span className="text-slate-400 font-medium">{label}:</span>
      <span>{value}</span>
    </div>
  )
}
