/**
 * @file Filters.jsx
 * @description Filter bar: multi-select FILE#, Warna, Size, mode (cum/sel), with search.
 *              Hover opens the panel and hover-selects options for speed.
 */

import { useState, useMemo, useRef, useCallback } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

function MultiSelect({ label, options, selected, onChange, searchable = true }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const openTimer = useRef(null)
  const closeTimer = useRef(null)
  const hoverTimer = useRef(null)

  const filtered = useMemo(() => {
    if (!q) return options
    const ql = q.toLowerCase()
    return options.filter((o) => String(o).toLowerCase().includes(ql))
  }, [options, q])

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current)
    if (closeTimer.current) clearTimeout(closeTimer.current)
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
  }, [])

  const scheduleOpen = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    openTimer.current = setTimeout(() => setOpen(true), 120)
  }, [])

  const scheduleClose = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 220)
  }, [])

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  const toggle = useCallback((v) => {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v))
    else onChange([...selected, v])
  }, [selected, onChange])

  const hoverToggle = useCallback((v) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => toggle(v), 130)
  }, [toggle])

  const cancelHoverToggle = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
  }, [])

  return (
    <div
      className="relative"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
      >
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="rounded-full bg-brand-50 dark:bg-slate-700 text-brand-700 dark:text-brand-300 px-2 text-xs">
          {selected.length || 'all'}
        </span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div
          className="absolute z-30 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {searchable && (
            <div className="p-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-700 px-2">
                <Search size={14} className="text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari..."
                  className="w-full bg-transparent py-1 text-sm outline-none"
                />
              </div>
            </div>
          )}
          <div className="flex gap-2 p-2 border-b border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onChange([...options])}
              className="text-xs text-brand-600 hover:underline"
            >
              Pilih semua
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs text-slate-500 hover:underline"
            >
              Kosongkan
            </button>
          </div>
          <div className="max-h-60 overflow-auto p-1">
            {filtered.map((o) => (
              <div
                key={o}
                onMouseEnter={() => hoverToggle(o)}
                onMouseLeave={cancelHoverToggle}
                onClick={() => toggle(o)}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o)}
                  readOnly
                  className="pointer-events-none"
                />
                <span className="truncate">{o}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-2 py-3 text-xs text-slate-400">Tidak ada hasil.</div>
            )}
          </div>
          <div className="p-2 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-slate-500"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Filters({ files, colors, sizes, selectedFiles, setSelectedFiles, selectedColors, setSelectedColors, selectedSizes, setSelectedSizes, mode, setMode }) {
  const fileOpts = files.map((f) => f.file)
  const colorOpts = [...new Set(colors.map((c) => c.color))].sort()
  const sizeOpts = [...new Set(sizes.map((s) => s.size))].sort()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelect label="FILE#" options={fileOpts} selected={selectedFiles} onChange={setSelectedFiles} />
      <MultiSelect label="Warna" options={colorOpts} selected={selectedColors} onChange={setSelectedColors} />
      <MultiSelect label="Size" options={sizeOpts} selected={selectedSizes} onChange={setSelectedSizes} />
      <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button
          type="button"
          onClick={() => setMode('cum')}
          className={`px-3 py-2 text-sm ${mode === 'cum' ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800'}`}
        >
          Kumulatif
        </button>
        <button
          type="button"
          onClick={() => setMode('sel')}
          className={`px-3 py-2 text-sm ${mode === 'sel' ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800'}`}
        >
          Minggu Ini
        </button>
      </div>
    </div>
  )
}
