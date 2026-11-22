/**
 * @file KpiCards.jsx
 * @description Top KPI cards grouped by category for quick reading.
 */

import { aggregateFiles, fmt, fmtPct } from '../lib/calc.js'

const CARDS = {
  order: { label: 'Order', color: 'text-slate-700 dark:text-slate-200' },
  cut: { label: 'Cut', color: 'text-blue-600' },
  cutAfterReject: { label: 'Cut After Reject', color: 'text-indigo-600' },
  sewIn: { label: 'Sew In', color: 'text-violet-600' },
  qc1: { label: 'QC-1', color: 'text-fuchsia-600' },
  qc2: { label: 'QC-2', color: 'text-pink-600' },
  metal: { label: 'Metal', color: 'text-amber-600' },
  pack: { label: 'Pack', color: 'text-emerald-600' },
  selisihOrder: { label: 'Selisih Order', color: 'text-rose-600' },
  yieldPct: { label: 'Yield', color: 'text-teal-600', pct: true },
}

const GROUPS = [
  { title: 'Volume & Tahap Awal', keys: ['order', 'cut', 'cutAfterReject'] },
  { title: 'Proses Produksi', keys: ['sewIn', 'qc1', 'qc2', 'metal', 'pack'] },
  { title: 'Kinerja', keys: ['selisihOrder', 'yieldPct'] },
]

const STAGE_KEYS = new Set(['cut', 'cutAfterReject', 'sewIn', 'qc1', 'qc2', 'metal', 'pack'])

export default function KpiCards({ files }) {
  const agg = aggregateFiles(files)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {GROUPS.map((g) => (
        <div
          key={g.title}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {g.title}
            </h3>
            <span className="text-[10px] text-slate-400">{files.length} File#</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {g.keys.map((k) => {
              const c = CARDS[k]
              const raw = agg[k]
              const display = c.pct ? fmtPct(raw) : fmt(raw)
              const negative = !c.pct && k === 'selisihOrder' && raw < 0
              const pct = STAGE_KEYS.has(k) && agg.order
                ? Math.min(100, ((k === 'order' ? agg.order : raw) / agg.order) * 100)
                : null
              return (
                <div key={k} className="min-w-0">
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.label}</div>
                  <div className={`mt-1 text-lg font-semibold tabular ${c.color} ${negative ? 'text-rose-600' : ''}`}>
                    {display}
                  </div>
                  {pct !== null && k !== 'order' && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] tabular text-slate-400 w-8 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}