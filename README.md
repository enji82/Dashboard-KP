# Dashboard Kenaikan Pangkat (KP) PNS Disdikbud Kab. Magelang

Aplikasi Web App berbasis **Google Apps Script (GAS)** untuk monitoring, pelacakan, dan analisis usulan Kenaikan Pangkat (KP) PNS di Lingkungan Dinas Pendidikan dan Kebudayaan Kabupaten Magelang menggunakan data Google Spreadsheet (Kolom A s.d. BA).

---

## 🚀 Fitur Utama

1. **KPI Summary Cards**:
   - Total Usulan Masuk
   - Memenuhi Syarat (MS) / Terbit SK
   - Perlu Perbaikan (BTL)
   - Tidak Memenuhi Syarat (TMS)
   - Dalam Proses Verifikasi
2. **Visualisasi Interaktif (Chart.js)**:
   - Distribusi usulan pangkat (Pangkat Lama ke Baru)
   - Top kecamatan pengusul KP terbanyak
   - Komposisi jenjang pendidikan (TK, SD, SMP, SKB)
3. **Filter Multi-Kriteria & Pencarian Real-time**:
   - Filter Tahun, Bulan Ajuan, Jenjang, Kecamatan, dan Status
   - Live Search nama pegawai, NIP, unit kerja/sekolah
4. **Modal Inspeksi Dokumen (53 Kolom)**:
   - Menampilkan identitas lengkap pegawai
   - Menampilkan catatan verifikator / alasan BTL
   - Checklist 16 dokumen usulan beserta tautan file Google Drive dan hasil verifikasi pemeriksa
5. **Ekspor Data**:
   - Download data hasil filter ke format CSV/Excel instan.

---

## 📂 Struktur File

```text
├── Kode.gs         # Backend Google Apps Script (doGet, data parser, CacheService)
├── Index.html      # Tampilan utama Dashboard (Responsive Bootstrap 5)
├── css.html        # Styling custom & modern color palette
├── js.html         # Logika frontend, pemanggilan GAS, Chart.js, filter, pagination
├── appsscript.json # Manifest Apps Script
└── README.md       # Dokumentasi proyek
```

---

## ⚙️ Petunjuk Pemasangan & Konfigurasi

### 1. Hubungkan ke Spreadsheet

Buka file [`Kode.gs`](file:///Users/macbookpro/Documents/GitHub/Dashboard-KP/Kode.gs) di baris 10:

```javascript
const CONFIG = {
  SPREADSHEET_ID: '', // Masukkan ID Spreadsheet jika Standalone Script
  SHEET_NAME: '',     // Contoh: 'Data KP' (Atau biarkan kosong untuk sheet pertama)
  CACHE_EXPIRATION_SECONDS: 600 // 10 menit cache untuk efisiensi performa
};
```
- **Jika Script Menempel di Spreadsheet (Container-Bound)**: `SPREADSHEET_ID` cukup dibiarkan kosong `''`.
- **Jika Script Standalone**: Ambil ID spreadsheet dari URL browser (`https://docs.google.com/spreadsheets/d/[ID_SPREADSHEET_DISINI]/edit`) lalu masukkan ke `SPREADSHEET_ID`.

### 2. Deploy Web App di Google Apps Script

1. Salin seluruh file (`Kode.gs`, `Index.html`, `css.html`, `js.html`) ke proyek Apps Script Anda (atau gunakan `clasp push`).
2. Klik tombol **Terapkan (Deploy)** di pojok kanan atas $\rightarrow$ **Penerapan Baru (New Deployment)**.
3. Pilih jenis: **Aplikasi Web (Web App)**.
4. Pengaturan:
   - **Jalankan sebagai (Execute as)**: *Saya (Me / Akun Anda)*.
   - **Siapa yang memiliki akses (Who has access)**: *Siapa saja di dalam organisasi* atau *Siapa saja (Anyone)* sesuai kebutuhan.
5. Klik **Terapkan (Deploy)** dan salin URL Web App yang dihasilkan untuk dibagikan ke pengguna atau disematkan di portal Disdikbud.
