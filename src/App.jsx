/**
 * @file App.jsx
 * @description Root component: orchestrates upload, storage, filters, and dashboard sections.
 */

import { useEffect, useMemo } from 'react'
import { useStore } from './store.js'
import { useTheme } from './hooks/useTheme.js'
import { parseWorkbook } from './lib/parseExcel.js'
import { saveSnapshot, listSnapshots } from './lib/storage.js'
import Header from './components/Header.jsx'
import Filters from './components/Filters.jsx'
import KpiCards from './components/KpiCards.jsx'
import TrendChart from './components/TrendChart.jsx'
import StageBarChart from './components/StageBarChart.jsx'
import SizeRanking from './components/SizeRanking.jsx'
import RejectPanel from './components/RejectPanel.jsx'
import ValidationBanner from './components/ValidationBanner.jsx'

export default function App() {
  useTheme()
  const snapshot = useStore((s) => s.snapshot)
  const snapshots = useStore((s) => s.snapshots)
  const setSnapshot = useStore((s) => s.setSnapshot)
  const setSnapshots = useStore((s) => s.setSnapshots)
  const selectedFiles = useStore((s) => s.selectedFiles)
  const setSelectedFiles = useStore((s) => s.setSelectedFiles)
  const selectedColors = useStore((s) => s.selectedColors)
  const setSelectedColors = useStore((s) => s.setSelectedColors)
  const selectedSizes = useStore((s) => s.selectedSizes)
  const setSelectedSizes = useStore((s) => s.setSelectedSizes)
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const uploading = useStore((s) => s.uploading)
  const setUploading = useStore((s) => s.setUploading)
  const setUploadError = useStore((s) => s.setUploadError)
  const setWarnings = useStore((s) => s.setWarnings)
  const warnings = useStore((s) => s.warnings)

  // Load history on mount and auto-open the latest snapshot.
  useEffect(() => {
    listSnapshots()
      .then((list) => {
        setSnapshots(list)
        if (list.length > 0) {
          const latest = list[list.length - 1]
          setSnapshot(latest)
          setWarnings(latest.validation.warnings)
          setSelectedFiles(latest.files.map((f) => f.file))
        }
      })
      .catch((e) => setUploadError(String(e)))
  }, [setSnapshots, setSnapshot, setWarnings, setSelectedFiles, setUploadError])

  // When snapshot changes, default-select all files if none selected.
  useEffect(() => {
    if (snapshot && selectedFiles.length === 0) {
      setSelectedFiles(snapshot.files.map((f) => f.file))
    }
  }, [snapshot, selectedFiles.length, setSelectedFiles])

  const handleUpload = async (file) => {
    setUploading(true)
    setUploadError(null)
    try {
      const buf = await file.arrayBuffer()
      const snap = await parseWorkbook(buf, file.name)
      await saveSnapshot(snap)
      const list = await listSnapshots()
      setSnapshots(list)
      setSnapshot(snap)
      setWarnings(snap.validation.warnings)
      setSelectedFiles(snap.files.map((f) => f.file))
      setSelectedColors([])
      setSelectedSizes([])
    } catch (e) {
      console.error(e)
      setUploadError(e?.message || String(e))
    } finally {
      setUploading(false)
    }
  }

  // Filtered files for KPI / bar chart.
  const activeFiles = useMemo(() => {
    if (!snapshot) return []
    return snapshot.files.filter((f) => selectedFiles.length === 0 || selectedFiles.includes(f.file))
  }, [snapshot, selectedFiles])

  const activeColors = useMemo(() => {
    if (!snapshot) return []
    return snapshot.colors.filter((c) => {
      if (selectedFiles.length && !selectedFiles.includes(c.file)) return false
      if (selectedColors.length && !selectedColors.includes(c.color)) return false
      return true
    })
  }, [snapshot, selectedFiles, selectedColors])

  const activeSizes = useMemo(() => {
    if (!snapshot) return []
    return snapshot.sizes.filter((s) => {
      if (selectedFiles.length && !selectedFiles.includes(s.file)) return false
      if (selectedColors.length && !selectedColors.includes(s.color)) return false
      if (selectedSizes.length && !selectedSizes.includes(s.size)) return false
      return true
    })
  }, [snapshot, selectedFiles, selectedColors, selectedSizes])

  // Load a previous snapshot from history (click on trend point not needed; use dropdown).
  const loadHistory = (date) => {
    const s = snapshots.find((x) => x.reportDate === date)
    if (s) {
      setSnapshot(s)
      setWarnings(s.validation.warnings)
      setSelectedFiles(s.files.map((f) => f.file))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Header onUpload={handleUpload} uploading={uploading} />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* History selector */}
        {snapshots.length > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Riwayat minggu:</span>
            <select
              value={snapshot?.reportDate || ''}
              onChange={(e) => loadHistory(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1"
            >
              {snapshots.map((s) => (
                <option key={s.reportDate} value={s.reportDate}>
                  {s.reportDate} ({s.files.length} File#)
                </option>
              ))}
            </select>
          </div>
        )}

        {!snapshot && (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-12 text-center">
            <p className="text-lg font-medium">Upload file rekap mingguan untuk mulai</p>
            <p className="text-sm text-slate-500 mt-2">Format: REKAP_MINGGUAN_YYYYMMDD.xlsx</p>
          </div>
        )}

        {snapshot && (
          <>
            <ValidationBanner warnings={warnings} />

            <Filters
              files={snapshot.files}
              colors={snapshot.colors}
              sizes={snapshot.sizes}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              selectedColors={selectedColors}
              setSelectedColors={setSelectedColors}
              selectedSizes={selectedSizes}
              setSelectedSizes={setSelectedSizes}
              mode={mode}
              setMode={setMode}
            />

            <KpiCards files={activeFiles} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                <h3 className="font-semibold text-sm mb-2">
                  Tren Output per Departemen ({mode === 'sel' ? 'Minggu Ini' : 'Kumulatif'})
                </h3>
                <TrendChart snapshots={snapshots} selectedFiles={selectedFiles} mode={mode} />
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                <h3 className="font-semibold text-sm mb-2">Akumulasi per Tahap vs Order</h3>
                <StageBarChart files={activeFiles} />
              </div>
            </div>

            <SizeRanking
              sizes={snapshot.sizes}
              selectedFiles={selectedFiles}
              selectedColors={selectedColors}
              selectedSizes={selectedSizes}
            />

            <RejectPanel snapshot={snapshot} snapshots={snapshots} />
          </>
        )}
      </main>
    </div>
  )
}
