# Rafi Kamil Arief Portfolio

Static portfolio website for GitHub Pages. The site uses plain HTML, CSS, and vanilla JavaScript, so it does not need a database, backend server, or build step.

## Struktur Aktif

```text
portfolio/
├── index.html
├── style.css
├── script.js
├── README.md
├── assets/
│   ├── documents/
│   ├── images/
│   └── icons/
└── projects/
    ├── feasibility-analysis/
    │   ├── index.html
    │   ├── style.css
    │   └── script.js
    ├── fbg-research/
    │   └── index.html
    └── waris/
        └── index.html
```

## Perubahan Terakhir

- Memisahkan CSS utama dari `index.html` ke `style.css`.
- Menambahkan `script.js` untuk menutup menu mobile setelah link navigasi dipilih.
- Memindahkan gambar ke `assets/images/`.
- Memindahkan aset publik ke `assets/`.
- Mengecualikan file mentah seperti workbook Excel dan naskah DOCX dari repository publik.
- Memindahkan subhalaman project ke folder `projects/`.
- Menghapus keterangan nomor HP dari halaman kontak.
- Mengganti kontak nomor HP dengan direct Instagram: `@rafikamilarief`.
- Menambahkan project card baru untuk `Feasibility Analysis`.
- Menambahkan subhalaman `projects/feasibility-analysis/` berbasis model Excel.

## Fitur

- Portfolio utama dengan section Home, About, Education, Skills, Portfolio, Experience, Publication, Achievements, dan Contact.
- Subhalaman FBG Hydrostatic Pressure Sensor.
- Subhalaman Kalkulator Waris Islam Faraidh.
- Subhalaman Feasibility Analysis untuk evaluasi proyek investasi.

## Feasibility Analysis

Subhalaman feasibility dibuat dengan mengonversi model perhitungan dari workbook lokal ke JavaScript statis. Workbook sumber tidak disertakan di repository publik.

Model yang diimplementasikan:

- Revenue tahunan dari produksi energi dan harga jual listrik.
- Biaya investasi, operasional, pemeliharaan, inflasi, pajak, dan pembiayaan pinjaman.
- Cash flow 20 tahun.
- Discounted factor berbasis MARR.
- NPV atau Net Present Value.
- IRR atau Internal Rate of Return.
- DPP atau Discounted Payback Period.
- Sensitivity analysis one-at-a-time untuk:
  - Produksi energi
  - Biaya investasi
  - Biaya operasional
  - Biaya pemeliharaan
  - Suku bunga pinjaman

Baseline dari workbook sudah dicocokkan:

- NPV: sekitar Rp853.831.107
- IRR: sekitar 10,215%
- DPP: tahun ke-16

## Deploy GitHub Pages

Website ini dapat langsung di-upload ke repository GitHub Pages. Entry point utama tetap:

```text
index.html
```

Tidak ada database, package manager, framework, atau proses build yang diperlukan.
