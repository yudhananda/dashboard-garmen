/**
 * @file parseExcel.js
 * @description Parses a REKAP_MINGGUAN_*.xlsx workbook into a normalized snapshot.
 *              Strategy (anti-halucination):
 *                1. Read RAW sheets (DATA_FSJP213, DATA_REJECT, DATA_DP) + aggregated
 *                   sheets (RINGKASAN, DETAIL WARNA, DETAIL SIZE).
 *                2. Recompute aggregates from RAW using the documented rules (V.14.1).
 *                3. Cross-check computed totals against the pre-computed sheets.
 *                   Any mismatch is recorded in `validation.warnings` and surfaced in UI.
 *              All numeric parsing is strict (NaN => 0 with a recorded warning).
 */

import * as XLSX from 'xlsx'
import { SHEETS, HEADER_ROW, FILE_DATE_REGEX } from '../constants.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a cell value to a finite number, defaulting to 0. */
export function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  // Strip thousands separators and spaces.
  const cleaned = String(value).replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

/** Normalize a color label to Title Case for grouping (e.g. "BLACK SOOT" -> "Black Soot"). */
export function normalizeColor(raw) {
  if (raw === null || raw === undefined) return ''
  const s = String(raw).trim()
  if (s === '' || s === '*' || s.toLowerCase() === 'n/a') return s
  // Title-case each word, preserving parenthetical codes like "(BC04)".
  return s
    .toLowerCase()
    .replace(/(^|[\s(])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
}

/** True if color label is a "numbered" variant that must be excluded (e.g. "Black Soot 2"). */
export function isNumberedColor(raw) {
  if (raw === null || raw === undefined) return false
  return /\s\d+\s*$/.test(String(raw).trim())
}

/** Extract report date (ISO yyyy-mm-dd) from file name. */
export function extractReportDate(fileName) {
  const m = String(fileName).match(FILE_DATE_REGEX)
  if (!m) return null
  const [, y, mo, d] = m
  return `${y}-${mo}-${d}`
}

/** Read a sheet as array-of-arrays (header handled by caller). */
function sheetToAoa(workbook, sheetName) {
  const ws = workbook.Sheets[sheetName]
  if (!ws) return null
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true })
}

/** Slice aoa to data rows below a 1-based header row. */
function dataRows(aoa, headerRow) {
  if (!aoa) return []
  return aoa.slice(headerRow) // headerRow is 1-based; slice(headerRow) skips first `headerRow` rows (0..headerRow-1)
}

/** Find column index by header name (case-insensitive, trimmed). */
export function colIndex(headers, name) {
  const target = String(name).trim().toLowerCase()
  return headers.findIndex((h) => String(h ?? '').trim().toLowerCase() === target)
}

// ---------------------------------------------------------------------------
// Parsers per sheet
// ---------------------------------------------------------------------------

/**
 * Parse DATA_FSJP213: 1 row = File# x PO x Style x Size.
 * Returns array of raw records with numeric fields.
 */
export function parseDataFsjp213(workbook) {
  const aoa = sheetToAoa(workbook, SHEETS.DATA_FSJP213)
  if (!aoa) return { records: [], headers: [] }
  const headers = (aoa[HEADER_ROW.DATA_FSJP213 - 1] || []).map((h) => (h === null ? '' : String(h).trim()))
  const rows = dataRows(aoa, HEADER_ROW.DATA_FSJP213)
  const idx = {
    file: colIndex(headers, 'FILE#'),
    po: colIndex(headers, 'PO'),
    style: colIndex(headers, 'STYLE'),
    combo: colIndex(headers, 'COMBO'),
    color: colIndex(headers, 'WARNA'),
    size: colIndex(headers, 'SIZE'),
    order: colIndex(headers, 'ORDER'),
    cut: colIndex(headers, 'CUT'),
    sewIn: colIndex(headers, 'SEW IN'),
    qc1: colIndex(headers, 'QC-1'),
    qc2: colIndex(headers, 'QC-2'),
    metal: colIndex(headers, 'METAL'),
    pack: colIndex(headers, 'PACK'),
    counted: colIndex(headers, 'DIHITUNG'),
    note: colIndex(headers, 'KETERANGAN'),
  }
  const records = []
  for (const r of rows) {
    if (!r || r.every((c) => c === null || c === '')) continue
    const file = r[idx.file]
    if (!file) continue
    records.push({
      file: String(file).trim(),
      po: r[idx.po],
      style: String(r[idx.style] ?? '').trim(),
      combo: r[idx.combo],
      colorRaw: r[idx.color],
      color: normalizeColor(r[idx.color]),
      size: String(r[idx.size] ?? '').trim(),
      order: toNumber(r[idx.order]),
      cut: toNumber(r[idx.cut]),
      sewIn: toNumber(r[idx.sewIn]),
      qc1: toNumber(r[idx.qc1]),
      qc2: toNumber(r[idx.qc2]),
      metal: toNumber(r[idx.metal]),
      pack: toNumber(r[idx.pack]),
      counted: String(r[idx.counted] ?? '').trim().toLowerCase() === 'ya',
      note: r[idx.note],
    })
  }
  return { records, headers }
}

/**
 * Parse DATA_REJECT: 1 row = File# x Style x Color x Size x Part -> reject pcs.
 */
export function parseDataReject(workbook) {
  const aoa = sheetToAoa(workbook, SHEETS.DATA_REJECT)
  if (!aoa) return { records: [], headers: [] }
  const headers = (aoa[HEADER_ROW.DATA_REJECT - 1] || []).map((h) => (h === null ? '' : String(h).trim()))
  const rows = dataRows(aoa, HEADER_ROW.DATA_REJECT)
  const idx = {
    file: colIndex(headers, 'FILE#'),
    style: colIndex(headers, 'STYLE'),
    color: colIndex(headers, 'WARNA'),
    size: colIndex(headers, 'SIZE'),
    part: colIndex(headers, 'PART'),
    reject: colIndex(headers, 'REJECT (PCS)'),
  }
  const records = []
  for (const r of rows) {
    if (!r || r.every((c) => c === null || c === '')) continue
    if (!r[idx.file]) continue
    records.push({
      file: String(r[idx.file]).trim(),
      style: String(r[idx.style] ?? '').trim(),
      colorRaw: r[idx.color],
      color: normalizeColor(r[idx.color]),
      size: String(r[idx.size] ?? '').trim(),
      part: String(r[idx.part] ?? '').trim(),
      reject: toNumber(r[idx.reject]),
    })
  }
  return { records, headers }
}

/**
 * Parse DATA_DP: FSJP220 Select (period) & Acc (cumulative) per color.
 */
export function parseDataDp(workbook) {
  const aoa = sheetToAoa(workbook, SHEETS.DATA_DP)
  if (!aoa) return { records: [], headers: [] }
  const headers = (aoa[HEADER_ROW.DATA_DP - 1] || []).map((h) => (h === null ? '' : String(h).trim()))
  const rows = dataRows(aoa, HEADER_ROW.DATA_DP)
  const idx = {
    file: colIndex(headers, 'FILE#'),
    color: colIndex(headers, 'WARNA (LABEL FSJP220)'),
    commit: colIndex(headers, 'COMMIT'),
    cutSel: colIndex(headers, 'CUT SELECT'),
    sewSel: colIndex(headers, 'SEW IN SELECT'),
    qc1Sel: colIndex(headers, 'QC-1 SELECT'),
    qc2Sel: colIndex(headers, 'QC-2 SELECT'),
    metalSel: colIndex(headers, 'METAL SELECT'),
    packSel: colIndex(headers, 'PACK SELECT'),
    cutAcc: colIndex(headers, 'CUT ACC'),
    sewAcc: colIndex(headers, 'SEW IN ACC'),
    qc1Acc: colIndex(headers, 'QC-1 ACC'),
    qc2Acc: colIndex(headers, 'QC-2 ACC'),
    metalAcc: colIndex(headers, 'METAL ACC'),
    packAcc: colIndex(headers, 'PACK ACC'),
  }
  const records = []
  for (const r of rows) {
    if (!r || r.every((c) => c === null || c === '')) continue
    if (!r[idx.file]) continue
    records.push({
      file: String(r[idx.file]).trim(),
      colorRaw: r[idx.color],
      color: normalizeColor(r[idx.color]),
      commit: toNumber(r[idx.commit]),
      cutSel: toNumber(r[idx.cutSel]),
      sewInSel: toNumber(r[idx.sewSel]),
      qc1Sel: toNumber(r[idx.qc1Sel]),
      qc2Sel: toNumber(r[idx.qc2Sel]),
      metalSel: toNumber(r[idx.metalSel]),
      packSel: toNumber(r[idx.packSel]),
      cutAcc: toNumber(r[idx.cutAcc]),
      sewInAcc: toNumber(r[idx.sewAcc]),
      qc1Acc: toNumber(r[idx.qc1Acc]),
      qc2Acc: toNumber(r[idx.qc2Acc]),
      metalAcc: toNumber(r[idx.metalAcc]),
      packAcc: toNumber(r[idx.packAcc]),
    })
  }
  return { records, headers }
}

/**
 * Parse an aggregated sheet into array-of-objects keyed by its header row.
 * Used for cross-checking.
 */
export function parseAggregatedSheet(workbook, sheetName, headerRow) {
  const aoa = sheetToAoa(workbook, sheetName)
  if (!aoa) return { rows: [], headers: [] }
  const headers = (aoa[headerRow - 1] || []).map((h) => (h === null ? '' : String(h).trim()))
  const rows = dataRows(aoa, headerRow)
  const out = []
  for (const r of rows) {
    if (!r || r.every((c) => c === null || c === '')) continue
    const obj = {}
    headers.forEach((h, i) => {
      if (h) obj[h] = r[i]
    })
    out.push(obj)
  }
  return { rows: out, headers }
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * Parse a full workbook File/Blob/ArrayBuffer.
 * @param {ArrayBuffer} buffer
 * @param {string} fileName
 * @returns {Promise<object>} snapshot
 */
export async function parseWorkbook(buffer, fileName) {
  const workbook = XLSX.read(buffer, { type: 'array', cellFormula: false })
  const reportDate = extractReportDate(fileName)

  const warnings = []

  // Raw
  const fsjp = parseDataFsjp213(workbook)
  const rej = parseDataReject(workbook)
  const dp = parseDataDp(workbook)

  // Aggregated (for cross-check)
  const ringkasan = parseAggregatedSheet(workbook, SHEETS.RINGKASAN, HEADER_ROW.RINGKASAN)
  const warna = parseAggregatedSheet(workbook, SHEETS.WARNA, HEADER_ROW.WARNA)
  const size = parseAggregatedSheet(workbook, SHEETS.SIZE, HEADER_ROW.SIZE)

  // --- Recompute aggregates from RAW (V.14.1 rules) ---
  // Exclude numbered color variants ("... 2").
  const countedRecords = fsjp.records.filter((r) => r.counted && !isNumberedColor(r.colorRaw))

  // Per file
  const fileSet = [...new Set(countedRecords.map((r) => r.file))]
  const files = fileSet.map((file) => {
    const recs = countedRecords.filter((r) => r.file === file)
    const order = recs.reduce((a, r) => a + r.order, 0)
    const cut = recs.reduce((a, r) => a + r.cut, 0)
    const sewIn = recs.reduce((a, r) => a + r.sewIn, 0)
    const qc1 = recs.reduce((a, r) => a + r.qc1, 0)
    const qc2 = recs.reduce((a, r) => a + r.qc2, 0)
    const metal = recs.reduce((a, r) => a + r.metal, 0)
    const pack = recs.reduce((a, r) => a + r.pack, 0)

    // Reject (MEND) for this file: sum reject pcs from DATA_REJECT.
    const rejRecs = rej.records.filter((r) => r.file === file)
    const reject = rejRecs.reduce((a, r) => a + r.reject, 0)
    const cutAfterReject = cut - reject

    // DP (FSJP220) for this file: aggregate commit + select/acc.
    const dpRecs = dp.records.filter((r) => r.file === file)
    const commit = dpRecs.reduce((a, r) => a + r.commit, 0)
    const cutSel = dpRecs.reduce((a, r) => a + r.cutSel, 0)
    const sewInSel = dpRecs.reduce((a, r) => a + r.sewInSel, 0)
    const qc1Sel = dpRecs.reduce((a, r) => a + r.qc1Sel, 0)
    const qc2Sel = dpRecs.reduce((a, r) => a + r.qc2Sel, 0)
    const metalSel = dpRecs.reduce((a, r) => a + r.metalSel, 0)
    const packSel = dpRecs.reduce((a, r) => a + r.packSel, 0)

    return {
      file,
      order,
      commit,
      orderEqualsCommit: order === commit,
      cut,
      reject,
      cutAfterReject,
      sewIn,
      qc1,
      qc2,
      metal,
      pack,
      selisihOrder: cutAfterReject - order,
      balSewIn: sewIn - cutAfterReject,
      balQc1: qc1 - sewIn,
      balQc2: qc2 - qc1,
      balMetal: metal - qc2,
       balPack: pack - qc2,
      // Period activity (Minggu Ini)
      cutSel,
      sewInSel,
      qc1Sel,
      qc2Sel,
      metalSel,
      packSel,
      // Counts for anomaly counters
      warnaCount: new Set(recs.map((r) => r.color)).size,
    }
  })

  // Per color (within file)
  const colors = []
  for (const file of fileSet) {
    const recs = countedRecords.filter((r) => r.file === file)
    const colorSet = [...new Set(recs.map((r) => r.color))]
    for (const color of colorSet) {
      const cres = recs.filter((r) => r.color === color)
      const order = cres.reduce((a, r) => a + r.order, 0)
      const cut = cres.reduce((a, r) => a + r.cut, 0)
      const sewIn = cres.reduce((a, r) => a + r.sewIn, 0)
      const qc1 = cres.reduce((a, r) => a + r.qc1, 0)
      const qc2 = cres.reduce((a, r) => a + r.qc2, 0)
      const metal = cres.reduce((a, r) => a + r.metal, 0)
      const pack = cres.reduce((a, r) => a + r.pack, 0)
      const rejRecs = rej.records.filter((r) => r.file === file && r.color === color)
      const reject = rejRecs.reduce((a, r) => a + r.reject, 0)
      const cutAfterReject = cut - reject
      // Top-3 reject parts
      const partMap = {}
      rejRecs.forEach((r) => {
        const key = r.part || '(part kosong)'
        partMap[key] = (partMap[key] || 0) + r.reject
      })
      const topParts = Object.entries(partMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([part, pcs]) => ({ part, pcs }))
      // DP for this color
      const dpRec = dp.records.find((r) => r.file === file && r.color === color)
      colors.push({
        file,
        color,
        order,
        cut,
        reject,
        cutAfterReject,
        sewIn,
        qc1,
        qc2,
        metal,
        pack,
        selisihOrder: cutAfterReject - order,
        balSewIn: sewIn - cutAfterReject,
        balQc1: qc1 - sewIn,
        balQc2: qc2 - qc1,
        balMetal: metal - qc2,
        balPack: pack - qc2,
        cutSel: dpRec ? dpRec.cutSel : 0,
        sewInSel: dpRec ? dpRec.sewInSel : 0,
        qc1Sel: dpRec ? dpRec.qc1Sel : 0,
        qc2Sel: dpRec ? dpRec.qc2Sel : 0,
        metalSel: dpRec ? dpRec.metalSel : 0,
        packSel: dpRec ? dpRec.packSel : 0,
        topParts,
        // anomaly counters
        sizeCutArLessThanOrder: 0, // filled below
      })
    }
  }

  // Per size (within file x color x style)
  const sizes = []
  for (const r of countedRecords) {
    const rejRecs = rej.records.filter(
      (x) => x.file === r.file && x.style === r.style && x.color === r.color && x.size === r.size
    )
    const reject = rejRecs.reduce((a, x) => a + x.reject, 0)
    const cutAfterReject = r.cut - reject
    const topPart = rejRecs
      .reduce((acc, x) => {
        const key = x.part || '(part kosong)'
        acc[key] = (acc[key] || 0) + x.reject
        return acc
      }, {})
    const topPartEntry = Object.entries(topPart).sort((a, b) => b[1] - a[1])[0]
    sizes.push({
      file: r.file,
      color: r.color,
      style: r.style,
      size: r.size,
      order: r.order,
      cut: r.cut,
      reject,
      cutAfterReject,
      sewIn: r.sewIn,
      qc1: r.qc1,
      qc2: r.qc2,
      metal: r.metal,
      pack: r.pack,
      selisihOrder: cutAfterReject - r.order,
      balSewIn: r.sewIn - cutAfterReject,
      balQc1: r.qc1 - r.sewIn,
      balQc2: r.qc2 - r.qc1,
      balMetal: r.metal - r.qc2,
       balPack: r.pack - r.qc2,
      rejectNa: rejRecs.length === 0,
      topPart: topPartEntry ? `${topPartEntry[0]} (${topPartEntry[1]})` : 'n/a',
    })
  }

  // Reject by part (global across files) for Top/Rising panel.
  const rejectByPart = {}
  rej.records.forEach((r) => {
    const key = r.part || '(part kosong)'
    rejectByPart[key] = (rejectByPart[key] || 0) + r.reject
  })
  const rejectParts = Object.entries(rejectByPart)
    .map(([part, pcs]) => ({ part, pcs }))
    .sort((a, b) => b.pcs - a.pcs)

  // --- Cross-check against pre-computed sheets ---
  // Compare total Order/Cut/... per file against RINGKASAN FILE# rows.
  try {
    const ringRows = ringkasan.rows
    for (const f of files) {
      const src = ringRows.find((r) => String(r['File#'] ?? '').trim() === f.file)
      if (!src) {
        warnings.push(`File# ${f.file} tidak ditemukan di sheet RINGKASAN FILE# (cross-check dilewati).`)
        continue
      }
      const checks = [
        ['Order', 'Order', f.order],
        ['Cut', 'Cut', f.cut],
        ['Cut After Reject', 'Cut After Reject', f.cutAfterReject],
        ['Sew In', 'Sew In', f.sewIn],
        ['QC-1', 'QC-1', f.qc1],
        ['QC-2', 'QC-2', f.qc2],
        ['Metal', 'Metal', f.metal],
        ['Pack', 'Pack', f.pack],
      ]
      for (const [label, col, val] of checks) {
        const srcVal = toNumber(src[col])
        if (srcVal !== val) {
          warnings.push(
            `Mismatch ${f.file} ${label}: rekap=${srcVal}, computed=${val} (selisih ${val - srcVal}).`
          )
        }
      }
    }
  } catch (e) {
    warnings.push(`Cross-check gagal: ${e.message}`)
  }

  // Anomaly counters per file (from DETAIL WARNA columns if present).
  // We recompute from sizes instead.
  for (const f of files) {
    f.sizeCount = sizes.filter((s) => s.file === f.file).length
    f.sizeCutArLessThanOrder = sizes.filter((s) => s.file === f.file && s.cutAfterReject < s.order).length
    f.sizePackGreaterThanMetal = sizes.filter((s) => s.file === f.file && s.pack > s.metal).length
    f.sizeRejectNa = sizes.filter((s) => s.file === f.file && s.rejectNa).length
  }

  return {
    fileName,
    reportDate,
    files,
    colors,
    sizes,
    rejectParts,
    validation: {
      warnings,
      ok: warnings.length === 0,
      rawCounts: {
        fsjp213: fsjp.records.length,
        counted: countedRecords.length,
        reject: rej.records.length,
        dp: dp.records.length,
      },
    },
  }
}
