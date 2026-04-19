const STATUS_COLORS = {
  'Driving': { bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-500/20', dot: 'bg-blue-600', icon: '🚛' },
  'On Duty (Not Driving)': { bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-500/20', dot: 'bg-amber-600', icon: '📦' },
  'Off Duty': { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/20', dot: 'bg-slate-600', icon: '☕' },
  'Sleeper Berth': { bg: 'bg-violet-500/10', text: 'text-violet-700', border: 'border-violet-500/20', dot: 'bg-violet-600', icon: '🛌' },
}

export default function LogTimeline({ logs }) {
  const totalHrs = logs.reduce((s, e) => s + e.duration_hours, 0)

  return (
    <div className="p-4">
      <div className="mb-5">
        <h2 className="text-sm font-bold text-slate-900">Trip Timeline</h2>
        <p className="text-xs text-slate-600 mt-0.5 font-medium">{logs.length} events · {totalHrs.toFixed(1)} total hours</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(STATUS_COLORS).map(([status, s]) => (
          <span key={status} className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md border font-bold ${s.bg} ${s.text} ${s.border}`}>
            <span>{s.icon}</span>
            <span>{status.replace('On Duty (Not Driving)', 'On Duty')}</span>
          </span>
        ))}
      </div>

      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />

        <div className="space-y-2">
          {logs.map((log, i) => {
            const s = STATUS_COLORS[log.status] || STATUS_COLORS['Off Duty']
            return (
              <div key={i} className="relative">
                {/* Dot */}
                <div className={`absolute -left-4 top-3.5 w-2 h-2 rounded-full ${s.dot} ring-2 ring-white`} />

                <div className={`rounded-xl border px-3 py-3 ${s.bg} ${s.border} transition-all shadow-sm`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{s.icon}</span>
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {log.reason || log.status}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                      {log.duration_hours.toFixed(2)}h
                    </span>
                  </div>
                  {log.reason && (
                    <span className={`text-[10px] font-bold ${s.text} ml-7 mt-1 block uppercase tracking-wider`}>
                      {log.status}
                    </span>
                  )}
                  {log.coordinate ? (
                    <p className="text-[10px] font-mono text-slate-500 mt-1 ml-7">
                      {log.coordinate[1].toFixed(4)}, {log.coordinate[0].toFixed(4)}
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
