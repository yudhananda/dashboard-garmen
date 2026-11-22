/**
 * @file SizeRanking.jsx
 * @description Ranking table: every size/style row grouped with subtotal + all balances.
 *              Sortable, scrollable, shows full detail (no truncation).
 */

import { useState, useMemo, Fragment } from 'react'
import { ArrowUpDown, ChevronRight, ChevronDown } from 'lucide-react'
import { fmt } from '../lib/calc.js'

const COLS = [
  { key: 'file', label: 'File#' },
  { key: 'color', label: 'Warna' },
  { key: 'style', label: 'Style' },
  { key: 'size', label: 'Size' },
  { key: 'order', label: 'Order' },
  { key: 'reject', label: 'Reject (pcs)' },
  { key: 'cutAfterReject', label: 'Cut AR' },
  { key: 'sewIn', label: 'Sew In' },
  { key: 'qc1', label: 'QC-1' },
  { key: 'qc2', label: 'QC-2' },
  { key: 'metal', label: 'Metal' },
  { key: 'pack', label: 'Pack' },
  { key: 'balSewIn', label: 'Bal SewIn' },
  { key: 'balQc1', label: 'Bal QC1' },
  { key: 'balQc2', label: 'Bal QC2' },
  { key: 'balMetal', label: 'Bal Metal' },
  { key: 'balPack', label: 'Bal Pack' },
]

export default function SizeRanking({ sizes, selectedFiles, selectedColors, selectedSizes }) {
  const [sortKey, setSortKey] = useState('balPack')
  const [sortDir, setSortDir] = useState('asc') // asc = worst first
  const [expanded, setExpanded] = useState(() => new Set())

  const filtered = useMemo(() => {
    return sizes.filter((s) => {
      if (selectedFiles.length && !selectedFiles.includes(s.file)) return false
      if (selectedColors.length && !selectedColors.includes(s.color)) return false
      if (selectedSizes.length && !selectedSizes.includes(s.size)) return false
      return true
    })
  }, [sizes, selectedFiles, selectedColors, selectedSizes])

  const numericCols = useMemo(() => COLS.filter((c) => !['file', 'color', 'style', 'size'].includes(c.key)), [])

  const totals = useMemo(() => {
    const t = {}
    numericCols.forEach((c) => { t[c.key] = 0 })
    filtered.forEach((s) => {
      numericCols.forEach((c) => { t[c.key] += s[c.key] ?? 0 })
    })
    return t
  }, [filtered, numericCols])

  const sortRows = (arr) => {
    const out = [...arr]
    out.sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey]
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortDir === 'asc' ? va - vb : vb - va
    })
    return out
  }

  const groups = useMemo(() => {
    const map = new Map()
    filtered.forEach((s) => {
      const key = `${s.file}||${s.color}||${s.style}`
      if (!map.has(key)) map.set(key, { key, file: s.file, color: s.color, style: s.style, rows: [] })
      map.get(key).rows.push(s)
    })
    const gArr = [...map.values()].map((g) => {
      const subtotal = { file: g.file, color: g.color, style: g.style, size: `TOTAL (${g.rows.length})` }
      numericCols.forEach((c) => {
        subtotal[c.key] = g.rows.reduce((a, r) => a + (r[c.key] ?? 0), 0)
      })
      return { ...g, subtotal, rows: sortRows(g.rows) }
    })
    gArr.sort((a, b) => {
      const stringField = ['file', 'color', 'style'].includes(sortKey)
      const va = stringField ? a[sortKey] : a.subtotal[sortKey]
      const vb = stringField ? b[sortKey] : b.subtotal[sortKey]
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortDir === 'asc' ? va - vb : vb - va
    })
    return gArr
  }, [filtered, sortKey, sortDir, numericCols])

  const toggleSort = (k) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir('asc') }
  }

  const toggleGroup = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  const expandAll = () => setExpanded(new Set(groups.map((g) => g.key)))
  const collapseAll = () => setExpanded(new Set())

  const renderCells = (row, indent = false) => {
    return COLS.map((c) => {
      const v = row[c.key]
      const isBal = c.key.startsWith('bal')
      const neg = isBal && typeof v === 'number' && v < 0
      if (c.key === 'file') {
        return (
          <td key={c.key} className={`px-2 py-1.5 tabular whitespace-nowrap ${indent ? 'pl-6 text-slate-500' : ''}`}>
            {v}
          </td>
        )
      }
      return (
        <td key={c.key} className={`px-2 py-1.5 tabular whitespace-nowrap ${neg ? 'text-rose-600 font-medium' : ''}`}>
          {typeof v === 'number' ? fmt(v) : v}
        </td>
      )
    })
  }

  const renderProgress = (row) => {
    const pct = row.order ? Math.min(100, (row.pack / row.order) * 100) : 0
    return (
      <td className="px-2 py-1.5 w-40">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] tabular w-10 text-right">{pct.toFixed(0)}%</span>
        </div>
      </td>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-semibold text-sm">Ranking Size / Style — semua balance</h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">{groups.length} grup · {filtered.length} baris</span>
          <button type="button" onClick={expandAll} className="text-brand-600 hover:underline">Expand all</button>
          <button type="button" onClick={collapseAll} className="text-slate-500 hover:underline">Collapse all</button>
        </div>
      </div>
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-700 z-10">
            <tr>
              {COLS.map((c) => (
                <th key={c.key} className="px-2 py-2 text-left whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort(c.key)}
                    className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-200 hover:text-brand-600"
                  >
                    {c.label} <ArrowUpDown size={10} />
                  </button>
                </th>
              ))}
              <th className="px-2 py-2 text-left">Progress Pack vs Order</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const isExp = expanded.has(g.key)
              return (
                <Fragment key={g.key}>
                  <tr
                    onClick={() => toggleGroup(g.key)}
                    className="border-t border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer font-medium"
                  >
                    {COLS.map((c) => {
                      if (c.key === 'file') {
                        return (
                          <td key={c.key} className="px-2 py-1.5 tabular whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              {isExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                              {g.subtotal.file}
                            </span>
                          </td>
                        )
                      }
                      const v = g.subtotal[c.key]
                      const isBal = c.key.startsWith('bal')
                      const neg = isBal && typeof v === 'number' && v < 0
                      return (
                        <td key={c.key} className={`px-2 py-1.5 tabular whitespace-nowrap ${neg ? 'text-rose-600' : ''}`}>
                          {typeof v === 'number' ? fmt(v) : v}
                        </td>
                      )
                    })}
                    {renderProgress(g.subtotal)}
                  </tr>
                  {isExp && g.rows.map((s, i) => (
                    <tr key={`${g.key}-${i}`} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      {renderCells(s, true)}
                      {renderProgress(s)}
                    </tr>
                  ))}
                </Fragment>
              )
            })}
            {groups.length === 0 && (
              <tr><td colSpan={COLS.length + 1} className="px-4 py-6 text-center text-slate-400">Tidak ada data untuk filter ini.</td></tr>
            )}
          </tbody>
          <tfoot className="sticky bottom-0 bg-slate-100 dark:bg-slate-700 z-10">
            <tr className="border-t-2 border-slate-300 dark:border-slate-500 font-semibold">
              <td colSpan={4} className="px-2 py-1.5 whitespace-nowrap">
                TOTAL — {filtered.length} baris
              </td>
              {numericCols.map((c) => {
                const v = totals[c.key]
                const isBal = c.key.startsWith('bal')
                const neg = isBal && v < 0
                return (
                  <td key={c.key} className={`px-2 py-1.5 tabular whitespace-nowrap ${neg ? 'text-rose-600' : ''}`}>
                    {fmt(v)}
                  </td>
                )
              })}
              <td className="px-2 py-1.5 w-40">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${totals.order ? Math.min(100, (totals.pack / totals.order) * 100) : 0}%` }} />
                  </div>
                  <span className="text-[10px] tabular w-10 text-right">
                    {totals.order ? ((totals.pack / totals.order) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
