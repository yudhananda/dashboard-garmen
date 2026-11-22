/**
 * @file TrendChart.jsx
 * @description Line chart: output per department across weeks (from stored snapshots).
 */

import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { STAGES } from '../constants.js'
import { aggregateFiles } from '../lib/calc.js'

const COLORS = {
  Cut: '#2563eb',
  'Sew In': '#7c3aed',
  'QC-1': '#db2777',
  'QC-2': '#ec4899',
  Metal: '#d97706',
  Pack: '#059669',
}

const KEY = { Cut: 'cut', 'Sew In': 'sewIn', 'QC-1': 'qc1', 'QC-2': 'qc2', Metal: 'metal', Pack: 'pack' }
const SELKEY = { Cut: 'cutSel', 'Sew In': 'sewInSel', 'QC-1': 'qc1Sel', 'QC-2': 'qc2Sel', Metal: 'metalSel', Pack: 'packSel' }

export default function TrendChart({ snapshots, selectedFiles, mode }) {
  const data = useMemo(() => {
    return snapshots.map((s) => {
      const files = (s.files || []).filter((f) => selectedFiles.length === 0 || selectedFiles.includes(f.file))
      const agg = aggregateFiles(files)
      const row = { date: s.reportDate }
      STAGES.forEach((st) => {
        const k = mode === 'sel' ? SELKEY[st] : KEY[st]
        row[st] = agg[k] ?? 0
      })
      return row
    })
  }, [snapshots, selectedFiles, mode])

  if (snapshots.length === 0) {
    return <div className="text-sm text-slate-400 p-6 text-center">Belum ada riwayat mingguan. Upload minimal 1 file untuk melihat tren.</div>
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
          <Tooltip formatter={(v) => v.toLocaleString('id-ID')} />
          <Legend />
          {STAGES.map((st) => (
            <Line key={st} type="monotone" dataKey={st} stroke={COLORS[st]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
