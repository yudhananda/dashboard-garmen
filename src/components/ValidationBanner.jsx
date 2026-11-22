/**
 * @file ValidationBanner.jsx
 * @description Shows cross-check warnings between computed and pre-computed sheets.
 */

import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function ValidationBanner({ warnings }) {
  if (!warnings || warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 size={14} /> Cross-check total: OK (rekap vs computed cocok).
      </div>
    )
  }
  return (
    <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
      <div className="flex items-center gap-2 font-medium mb-1">
        <AlertTriangle size={14} /> {warnings.length} peringatan validasi
      </div>
      <ul className="list-disc pl-5 space-y-0.5">
        {warnings.slice(0, 8).map((w, i) => <li key={i}>{w}</li>)}
        {warnings.length > 8 && <li>...dan {warnings.length - 8} lainnya.</li>}
      </ul>
    </div>
  )
}
