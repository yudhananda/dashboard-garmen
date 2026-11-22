/**
 * @file RejectPanel.jsx
 * @description Top-5 reject parts + Rising defects vs previous week.
 */

import { useMemo } from 'react'
import { risingDefects, fmt } from '../lib/calc.js'

export default function RejectPanel({ snapshot, snapshots }) {
  const currentParts = snapshot?.rejectParts || []
  const top5 = currentParts.slice(0, 5)
  const total = currentParts.reduce((a, p) => a + p.pcs, 0)

  // Previous snapshot (by reportDate) for rising detection.
  const prev = useMemo(() => {
    if (!snapshot) return null
    const idx = snapshots.findIndex((s) => s.reportDate === snapshot.reportDate)
    if (idx <= 0) return null
    return snapshots[idx - 1]
  }, [snapshot, snapshots])

  const rising = useMemo(() => risingDefects(currentParts, prev?.rejectParts), [currentParts, prev])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Reject */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Top Reject (pcs)</h3>
          <span className="text-xs text-slate-500">Total {fmt(total)}</span>
        </div>
        <div className="space-y-2">
          {top5.map((p, i) => {
            const pct = total ? (p.pcs / total) * 100 : 0
            return (
              <div key={p.part}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="truncate">{i + 1}. {p.part}</span>
                  <span className="tabular font-medium">{fmt(p.pcs)} ({pct.toFixed(1)}%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          {top5.length === 0 && <div className="text-xs text-slate-400">Tidak ada data reject.</div>}
        </div>
      </div>

      {/* Rising */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Rising Defect (vs minggu lalu)</h3>
          {!prev && <span className="text-xs text-amber-600">Butuh ≥2 minggu data</span>}
        </div>
        <div className="space-y-2">
          {rising.slice(0, 5).map((p) => (
            <div key={p.part} className="flex items-center justify-between text-xs">
              <span className="truncate">{p.part}</span>
              <span className="tabular">
                {fmt(p.prev)} → {fmt(p.pcs)}
                <span className="ml-2 text-rose-600 font-medium">+{fmt(p.delta)}</span>
              </span>
            </div>
          ))}
          {rising.length === 0 && (
            <div className="text-xs text-slate-400">
              {prev ? 'Tidak ada defect yang naik dibanding minggu lalu.' : 'Upload minggu berikutnya untuk mendeteksi rising.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
