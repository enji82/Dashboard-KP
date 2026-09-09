/**
 * Dashboard Kenaikan Pangkat (KP) PNS
 * Dinas Pendidikan dan Kebudayaan Kabupaten Magelang
 * Backend Google Apps Script
 */

// ==========================================
// KONFIGURASI SPREADSHEET
// ==========================================
// Jika script ini menempel langsung (Container-Bound) pada Spreadsheet, Anda bisa kosongkan SPREADSHEET_ID.
// Jika Standalone Script, isikan ID Spreadsheet pada variabel di bawah:
const CONFIG = {
  SPREADSHEET_ID: '1SmlQmzojwZ_cJC7yDCGMqgXKcU0nJScqTDk7MqvRdEE',
  SHEET_NAME: 'Data',
  CACHE_EXPIRATION_SECONDS: 600 // 10 menit
};

/**
 * Endpoint utama Web App
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Dashboard Kenaikan Pangkat (KP) - Disdikbud Kab. Magelang')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper untuk menyertakan file html modular (css.html, js.html)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Mengambil referensi sheet data
 */
function getSheetRef() {
  let ss;
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== '') {
    ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  if (!ss) {
    throw new Error('Spreadsheet tidak ditemukan! Pastikan SPREADSHEET_ID terisi jika script bersifat Standalone.');
  }

  let sheet;
  if (CONFIG.SHEET_NAME && CONFIG.SHEET_NAME.trim() !== '') {
    sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  } else {
    sheet = ss.getSheets()[0];
  }

  if (!sheet) {
    throw new Error('Sheet data tidak ditemukan.');
  }

  return sheet;
}

/**
 * Fungsi utama: Mengambil data dan menghitung agregat statistik
 */
function getDashboardData(forceRefresh) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = 'DASHBOARD_KP_DATA_MAGELANG';

    if (!forceRefresh) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        try {
          return JSON.parse(cachedData);
        } catch (e) {
          // Abaikan jika cache rusak, ambil fresh data
        }
      }
    }

    const sheet = getSheetRef();
    const rawValues = sheet.getDataRange().getValues();

  if (rawValues.length <= 1) {
    return {
      success: true,
      stats: { total: 0, ms: 0, btl: 0, tms: 0, proses: 0 },
      records: [],
      filterOptions: { years: [], months: [], subdistricts: [], levels: [], statuses: [] }
    };
  }

  // Lewati baris header (baris ke-1)
  const rows = rawValues.slice(1);

  const yearsSet = new Set();
  const monthsSet = new Set();
  const subdistrictsSet = new Set();
  const levelsSet = new Set();
  const statusSet = new Set();

  let countMS = 0;
  let countBTL = 0;
  let countTMS = 0;
  let countProses = 0;

  const records = rows.map((r, index) => {
    // Normalisasi status
    const rawStatus = (r[30] || '').toString().trim();
    const upperStatus = rawStatus.toUpperCase();

    let cleanStatus = 'Dalam Proses';
    if (upperStatus.includes('MS') || upperStatus.includes('MEMENUHI SYARAT') || upperStatus.includes('SETUJU') || upperStatus.includes('TERBIT SK')) {
      cleanStatus = 'Memenuhi Syarat';
      countMS++;
    } else if (upperStatus.includes('BTL') || upperStatus.includes('TIDAK LENGKAP') || upperStatus.includes('PERBAIKAN')) {
      cleanStatus = 'Berkas Tidak Lengkap';
      countBTL++;
    } else if (upperStatus.includes('TMS') || upperStatus.includes('TOLAK') || upperStatus.includes('TIDAK MEMENUHI')) {
      cleanStatus = 'Tidak Memenuhi Syarat';
      countTMS++;
    } else {
      cleanStatus = rawStatus !== '' ? rawStatus : 'Dalam Proses';
      countProses++;
    }

    const tahun = (r[9] !== undefined && r[9] !== null) ? r[9].toString().trim() : '';
    const bulan = (r[8] || '').toString().trim();
    const kec = (r[2] || '').toString().trim();
    const jenjang = (r[3] || '').toString().trim();

    if (tahun) yearsSet.add(tahun);
    if (bulan) monthsSet.add(bulan);
    if (kec) subdistrictsSet.add(kec);
    if (jenjang) levelsSet.add(jenjang);
    if (cleanStatus) statusSet.add(cleanStatus);

    return {
      id: r[0] || (index + 1),
      npsn: r[1] || '-',
      kec: kec || '-',
      jenjang: jenjang || '-',
      unit_kerja: r[4] || '-',
      nip: r[5] ? "'" + r[5].toString().trim() : '-',
      nama: r[6] || '-',
      no_hp: r[7] || '-',
      bulan_ajuan: bulan || '-',
      tahun_ajuan: tahun || '-',
      email: r[10] || '-',
      
      // Dokumen Awal (L - AB, AC)
      dokumen_pengajuan: {
        sk_pns: r[11] || '',
        sk_cpns: r[12] || '',
        skkp: r[13] || '',
        skp_1_th: r[14] || '',
        skp_2_th: r[15] || '',
        ijazah_terakhir: r[16] || '',
        transkrip_nilai: r[17] || '',
        stlud: r[18] || '',
        sib: r[19] || '',
        hudis: r[20] || '',
        ijin_gelar: r[21] || '',
        sk_jabatan_beruntun: r[22] || '',
        pak_gabungan: r[23] || '',
        serdik: r[24] || '',
        sertifikat_ukom: r[25] || '',
        surat_pengantar_korwil: r[26] || '',
        jabfung_ukkj: r[27] || '',
        url_full: r[28] || ''
      },

      // Verifikasi & Status
      tanggal_revisi: r[29] ? formatDate(r[29]) : '-',
      status: cleanStatus,
      raw_status: rawStatus,
      catatan: r[31] || '-',
      jenis_jabatan: r[32] || '-',
      pangkat_saat_ini: r[33] || '-',
      ajuan_pangkat: r[34] || '-',
      pemeriksa: r[35] || '-',

      // Checklist Hasil Verifikasi Pemeriksa (AK - BA)
      verifikasi_dokumen: {
        sk_pns: r[36] || '-',
        sk_cpns: r[37] || '-',
        skkp: r[38] || '-',
        evaluasi_kinerja_1_th: r[39] || '-',
        evaluasi_kinerja_2_th: r[40] || '-',
        ijazah_terakhir: r[41] || '-',
        transkrip_nilai: r[42] || '-',
        stlud: r[43] || '-',
        sib: r[44] || '-',
        hudis: r[45] || '-',
        ijin_gelar: r[46] || '-',
        sk_jabatan_beruntun: r[47] || '-',
        pak_gabungan: r[48] || '-',
        serdik: r[49] || '-',
        sertifikat_ukom: r[50] || '-',
        surat_pengantar_korwil: r[51] || '-',
        lain_lain: r[52] || '-'
      }
    };
  });

  const payload = {
    success: true,
    stats: {
      total: records.length,
      ms: countMS,
      btl: countBTL,
      tms: countTMS,
      proses: countProses
    },
    records: records,
    filterOptions: {
      years: Array.from(yearsSet).sort().reverse(),
      months: Array.from(monthsSet).sort(),
      subdistricts: Array.from(subdistrictsSet).sort(),
      levels: Array.from(levelsSet).sort(),
      statuses: Array.from(statusSet).sort()
    },
    updatedAt: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  };

    try {
      // Simpan di cache untuk mempercepat akses pengguna berikutnya
      cache.put(cacheKey, JSON.stringify(payload), CONFIG.CACHE_EXPIRATION_SECONDS);
    } catch (err) {
      // Abaikan jika payload melampaui limit ukuran cache 100KB
    }

    return payload;
  } catch (error) {
    return {
      success: false,
      message: error.message || error.toString()
    };
  }
}

/**
 * Format tanggal ke format Indonesia yang mudah dibaca
 */
function formatDate(dateVal) {
  if (!dateVal) return '-';
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, 'Asia/Jakarta', 'dd-MM-yyyy');
  }
  return dateVal.toString();
}

/**
 * Fungsi untuk refresh data (bypass cache)
 */
function refreshDashboardData() {
  return getDashboardData(true);
}
