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
  return HtmlService.createHtmlOutputFromFile('Index')
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
    return JSON.stringify({
      success: true,
      stats: { total: 0, ms: 0, revisi: 0, tms: 0, proses: 0 },
      records: [],
      filterOptions: { years: [], months: [] }
    });
  }

  // Helper konversi nilai sel ke string bersih
  const cleanStr = (val) => {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) return Utilities.formatDate(val, 'Asia/Jakarta', 'dd-MM-yyyy');
    return val.toString().trim();
  };

  // Lewati baris header (baris ke-1)
  const rows = rawValues.slice(1);

  const yearsSet = new Set();
  const monthsSet = new Set();
  const kecSet = new Set();
  const jenjangSet = new Set();

  let countMS = 0;
  let countRevisi = 0;
  let countTMS = 0;
  let countProses = 0;

  const records = [];

  for (let index = 0; index < rows.length; index++) {
    const r = rows[index];
    // Jika baris kosong, lewati
    if (!r[6] && !r[5] && !r[4]) continue;

    // Status Asli Kolom AE (index 30)
    let statusAE = cleanStr(r[30]);
    if (!statusAE) statusAE = 'Belum Dicek';

    // Normalisasi case jika ada sedikit perbedaan penulisan
    const upperStatus = statusAE.toUpperCase();
    if (upperStatus === 'APPROVE') statusAE = 'Approve';
    else if (upperStatus === 'REVISI DIKIRIM') statusAE = 'Revisi Dikirim';
    else if (upperStatus === 'REVISI') statusAE = 'Revisi';
    else if (upperStatus === 'BELUM DICEK') statusAE = 'Belum Dicek';
    else if (upperStatus === 'DITOLAK' || upperStatus === 'TMS') statusAE = 'Ditolak';
    else if (upperStatus === 'SISULKA') statusAE = 'Sisulka';

    const tahun = cleanStr(r[9]);
    const bulan = cleanStr(r[8]);
    const kec = cleanStr(r[2]) || 'Lainnya';
    const jenjang = cleanStr(r[3]) || 'Lainnya';
    const ajuanPangkat = cleanStr(r[34]) || cleanStr(r[33]) || 'Belum Ditentukan';

    if (tahun) yearsSet.add(tahun);
    if (bulan) monthsSet.add(bulan);
    if (kec && kec !== 'Lainnya') kecSet.add(kec);
    if (jenjang && jenjang !== 'Lainnya') jenjangSet.add(jenjang);

    records.push({
      id: cleanStr(r[0]) || (index + 1).toString(),
      kec: kec,
      jenjang: jenjang,
      bulan_ajuan: bulan || 'Tidak Diketahui',
      tahun_ajuan: tahun || 'Tidak Diketahui',
      status: statusAE,
      status_ae: statusAE,
      is_revisi: (statusAE === 'Revisi' || statusAE === 'Revisi Dikirim'),
      ajuan_pangkat: ajuanPangkat
    });
  }

  // Urutan bulan standar Indonesia untuk sorting
  const bulanUrut = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const sortedMonths = Array.from(monthsSet).sort((a, b) => {
    let ia = bulanUrut.indexOf(a);
    let ib = bulanUrut.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    return a.localeCompare(b);
  });

  const payload = {
    success: true,
    stats: {
      total: records.length,
      ms: countMS,
      revisi: countRevisi,
      tms: countTMS,
      proses: countProses
    },
    records: records,
    filterOptions: {
      years: Array.from(yearsSet).sort().reverse(),
      months: sortedMonths,
      kecamatan: Array.from(kecSet).sort((a, b) => a.localeCompare(b)),
      jenjang: Array.from(jenjangSet).sort((a, b) => a.localeCompare(b))
    },
    updatedAt: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd-MM-yyyy HH:mm:ss') + ' WIB'
  };

  const jsonString = JSON.stringify(payload);

  try {
    cache.put(cacheKey, jsonString, CONFIG.CACHE_EXPIRATION_SECONDS);
  } catch (err) {}

  return jsonString;
} catch (error) {
  return JSON.stringify({
    success: false,
    message: error.message || error.toString()
  });
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
