/**
 * @file StageBarChart.jsx
 * @description Bar chart: total per production stage vs Order (target) for selected files.
 */

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { STAGES } from '../constants.js'
import { aggregateFiles, fmt } from '../lib/calc.js'

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ec4899', '#d97706', '#059669']

export default function StageBarChart({ files }) {
  const agg = useMemo(() => aggregateFiles(files), [files])
  const data = STAGES.map((st, i) => {
    const v = agg[{ Cut: 'cut', 'Sew In': 'sewIn', 'QC-1': 'qc1', 'QC-2': 'qc2', Metal: 'metal', Pack: 'pack' }[st]]
    return { stage: st, value: v, fill: COLORS[i] }
  })

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
          <Tooltip formatter={(v) => v.toLocaleString('id-ID')} />
          <ReferenceLine y={agg.order} stroke="#94a3b8" strokeDasharray="6 4" label={{ value: `Order ${fmt(agg.order)}`, position: 'right', fontSize: 10 }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
