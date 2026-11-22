# Dashboard Produksi Garmen (Google Trends style)

Dashboard interaktif untuk rekap mingguan produksi garmen. Sumber data: file `REKAP_MINGGUAN_YYYYMMDD.xlsx`.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:5173 lalu upload file rekap mingguan (`.xlsx`).

Build produksi:

```bash
npm run build
npm run preview
```

## Struktur data

Lihat `docs/DATA_SCHEMA.md`. Ringkasnya, parser membaca sheet `DATA_FSJP213`, `DATA_REJECT`, `DATA_DP` (mentah) dan merekomputasi agregasi sesuai aturan V.14.1, lalu cross-check terhadap sheet `RINGKASAN FILE#` / `DETAIL WARNA` / `DETAIL SIZE`. Mismatch ditampilkan di banner validasi.

## Fitur

- Multi-select `FILE#` (puluhan file per minggu), Warna, Size.
- Mode Kumulatif / Minggu Ini.
- KPI cards, tren per departemen week-over-week, bar stage vs Order, ranking semua size/style + balance, Top & Rising reject.
- Dark/light mode, persist riwayat mingguan di IndexedDB.
