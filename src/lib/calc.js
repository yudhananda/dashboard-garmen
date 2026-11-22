/**
 * @file calc.js
 * @description Derived metric helpers used by the dashboard.
 */

import { STAGES } from '../constants.js'

/** Format a number in id-ID locale (thousand separator "."). */
export function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '0'
  return Math.round(n).toLocaleString('id-ID')
}

/** Format percentage with 1 decimal. */
export function fmtPct(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '0.0%'
  return `${(n * 100).toFixed(1)}%`
}

/** Yield = Pack / Order (0 if order 0). */
export function yieldPct(order, pack) {
  if (!order) return 0
  return pack / order
}

/** Build a trend series for a given file + stage across snapshots.
 *  @param {Array} snapshots sorted ascending by reportDate
 *  @param {string} file
 *  @param {string} stage one of STAGES
 *  @param {'cum'|'sel'} mode cumulative or period (Minggu Ini)
 */
export function trendSeries(snapshots, file, stage, mode = 'cum') {
  const stageKey = stage.replace(/\s+/g, '').toLowerCase() // cut, sewin, qc1, ...
  const map = {
    cut: mode === 'cum' ? 'cut' : 'cutSel',
    sewin: mode === 'cum' ? 'sewIn' : 'sewInSel',
    'qc-1': mode === 'cum' ? 'qc1' : 'qc1Sel',
    'qc-2': mode === 'cum' ? 'qc2' : 'qc2Sel',
    metal: mode === 'cum' ? 'metal' : 'metalSel',
    pack: mode === 'cum' ? 'pack' : 'packSel',
  }
  const key = map[stage.toLowerCase()]
  return snapshots.map((s) => {
    const f = (s.files || []).find((x) => x.file === file)
    return {
      date: s.reportDate,
      value: f ? f[key] ?? 0 : 0,
    }
  })
}

/** Compute "rising" defects: parts whose pcs increased vs previous snapshot. */
export function risingDefects(currentParts, previousParts) {
  const prevMap = {}
  ;(previousParts || []).forEach((p) => {
    prevMap[p.part] = p.pcs
  })
  return (currentParts || [])
    .map((p) => {
      const prev = prevMap[p.part] || 0
      const delta = p.pcs - prev
      const pct = prev > 0 ? delta / prev : (p.pcs > 0 ? Infinity : 0)
      return { ...p, prev, delta, pct }
    })
    .filter((p) => p.delta > 0)
    .sort((a, b) => b.delta - a.delta)
}

/** Aggregate a subset of files into one combined metric object. */
export function aggregateFiles(files) {
  const init = { order: 0, commit: 0, cut: 0, reject: 0, cutAfterReject: 0, sewIn: 0, qc1: 0, qc2: 0, metal: 0, pack: 0, cutSel: 0, sewInSel: 0, qc1Sel: 0, qc2Sel: 0, metalSel: 0, packSel: 0 }
  const out = { ...init }
  files.forEach((f) => {
    for (const k of Object.keys(init)) out[k] += f[k] ?? 0
  })
  out.selisihOrder = out.cutAfterReject - out.order
  out.balSewIn = out.sewIn - out.cutAfterReject
  out.balQc1 = out.qc1 - out.sewIn
  out.balQc2 = out.qc2 - out.qc1
  out.balMetal = out.metal - out.qc2
  out.balPack = out.pack - out.qc2
  out.yieldPct = out.order ? out.pack / out.order : 0
  return out
}

/** Stage value lookup for a file object. */
export function stageValue(file, stage) {
  const map = { Cut: 'cut', 'Sew In': 'sewIn', 'QC-1': 'qc1', 'QC-2': 'qc2', Metal: 'metal', Pack: 'pack' }
  return file[map[stage]] ?? 0
}
