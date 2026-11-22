# Skema Data

## Sumber: `REKAP_MINGGUAN_YYYYMMDD.xlsx`

| Sheet | Header row | Isi |
|---|---|---|
| `RINGKASAN FILE#` | 3 | 1 baris per File#: Order, Commit, Cut, Reject, Cut AR, Sew In, QC-1, QC-2, Metal, Pack, Selisih, Balance, aktivitas Minggu Ini, anomali. |
| `DETAIL WARNA` | 3 | Per File# × warna (+ Top-3 part reject). |
| `DETAIL SIZE` | 3 | Per File# × warna × style × size + catatan anomali. |
| `DATA_FSJP213` | 2 | Mentah per PO × Style × Size (Order/Cut/Sew In/QC-1/QC-2/Metal/Pack, DIHITUNG). |
| `DATA_REJECT` | 2 | Reject mati per File# × Style × Warna × Size × Part. |
| `DATA_DP` | 2 | FSJP220 Select (periode) & Acc (kumulatif) per warna. |

## Aturan (V.14.1)

- Order/Cut/... = kumulatif FSJP213 per File# × style × size.
- Warna bernomor ("… 2") tidak dihitung; kode warna digabung ke warna style-nya.
- Reject = reject mati SEW0395 proses MEND per style × size; size tidak tercantum = "n/a" (Cut AR = Cut).
- Cut After Reject = Cut − Reject. Selisih Order = Cut AR − Order.
- Balance = tahap − tahap sebelumnya (Pack − Metal). Minus = kurang.
- "Minggu Ini" = kolom Select FSJP220.
- Commit FSJP220 dipakai untuk cek Order = Commit per File#.

## Normalisasi

- Warna dinormalisasi ke Title Case untuk grouping (`BLACK SOOT` → `Black Soot`).
- Tanggal rekap diekstrak dari nama file `REKAP_MINGGUAN_YYYYMMDD`.
