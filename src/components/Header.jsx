/**
 * @file Header.jsx
 * @description Top header: title, upload button, theme toggle, last-updated.
 */

import { useRef } from 'react'
import { Upload, Sun, Moon, Monitor, FileSpreadsheet } from 'lucide-react'
import { useStore } from '../store.js'

export default function Header({ onUpload, uploading }) {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const snapshot = useStore((s) => s.snapshot)
  const inputRef = useRef(null)

  const cycleTheme = () => {
    const order = ['system', 'light', 'dark']
    const i = order.indexOf(theme)
    setTheme(order[(i + 1) % order.length])
  }

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">Dashboard Produksi Garmen</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {snapshot ? `Data per ${snapshot.reportDate} · ${snapshot.files.length} File#` : 'Belum ada data — upload file rekap mingguan'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onUpload(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 text-sm disabled:opacity-60"
          >
            <Upload size={16} />
            {uploading ? 'Memproses...' : 'Upload Rekap'}
          </button>
          <button
            type="button"
            onClick={cycleTheme}
            className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Toggle theme"
          >
            <ThemeIcon size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
