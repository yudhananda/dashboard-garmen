/**
 * @file constants.js
 * @description Central constants for the Garment Production Dashboard.
 *              Keeps magic strings/numbers in one place for maintainability.
 */

/** Department pipeline stages in production order. */
export const STAGES = ['Cut', 'Sew In', 'QC-1', 'QC-2', 'Metal', 'Pack']

/** Storage keys for IndexedDB / localStorage. */
export const DB_NAME = 'garmen-dashboard'
export const DB_VERSION = 1
export const STORE_SNAPSHOTS = 'snapshots'

/** LocalStorage key for theme preference. */
export const THEME_KEY = 'garmen-theme'

/** Sheet names expected inside REKAP_MINGGUAN_*.xlsx. */
export const SHEETS = {
  RINGKASAN: 'RINGKASAN FILE#',
  WARNA: 'DETAIL WARNA',
  SIZE: 'DETAIL SIZE',
  DATA_FSJP213: 'DATA_FSJP213',
  DATA_REJECT: 'DATA_REJECT',
  DATA_DP: 'DATA_DP',
}

/** Header row index (1-based) for each sheet. */
export const HEADER_ROW = {
  RINGKASAN: 3,
  WARNA: 3,
  SIZE: 3,
  DATA_FSJP213: 2,
  DATA_REJECT: 2,
  DATA_DP: 2,
}

/** File name pattern to extract report date: REKAP_MINGGUAN_YYYYMMDD. */
export const FILE_DATE_REGEX = /REKAP_MINGGUAN_(\d{4})(\d{2})(\d{2})/

/** Colors (Title Case) that are "numbered" variants and excluded from totals. */
export const NUMBERED_COLOR_SUFFIX = /^\s*\d+\s*$/
