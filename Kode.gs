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
      stats: { total: 0, ms: 0, btl: 0, tms: 0, proses: 0 },
      records: [],
      filterOptions: { years: [], months: [], subdistricts: [], levels: [], statuses: [] }
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
  const subdistrictsSet = new Set();
  const levelsSet = new Set();
  const statusSet = new Set();

  let countMS = 0;
  let countBTL = 0;
  let countTMS = 0;
  let countProses = 0;

  const records = rows.map((r, index) => {
    // Normalisasi status
    const rawStatus = cleanStr(r[30]);
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

    const tahun = cleanStr(r[9]);
    const bulan = cleanStr(r[8]);
    const kec = cleanStr(r[2]);
    const jenjang = cleanStr(r[3]);

    if (tahun) yearsSet.add(tahun);
    if (bulan) monthsSet.add(bulan);
    if (kec) subdistrictsSet.add(kec);
    if (jenjang) levelsSet.add(jenjang);
    if (cleanStatus) statusSet.add(cleanStatus);

    return {
      id: cleanStr(r[0]) || (index + 1).toString(),
      npsn: cleanStr(r[1]) || '-',
      kec: kec || '-',
      jenjang: jenjang || '-',
      unit_kerja: cleanStr(r[4]) || '-',
      nip: cleanStr(r[5]) || '-',
      nama: cleanStr(r[6]) || '-',
      no_hp: cleanStr(r[7]) || '-',
      bulan_ajuan: bulan || '-',
      tahun_ajuan: tahun || '-',
      email: cleanStr(r[10]) || '-',
      
      // Dokumen Awal (L - AB, AC)
      dokumen_pengajuan: {
        sk_pns: cleanStr(r[11]),
        sk_cpns: cleanStr(r[12]),
        skkp: cleanStr(r[13]),
        skp_1_th: cleanStr(r[14]),
        skp_2_th: cleanStr(r[15]),
        ijazah_terakhir: cleanStr(r[16]),
        transkrip_nilai: cleanStr(r[17]),
        stlud: cleanStr(r[18]),
        sib: cleanStr(r[19]),
        hudis: cleanStr(r[20]),
        ijin_gelar: cleanStr(r[21]),
        sk_jabatan_beruntun: cleanStr(r[22]),
        pak_gabungan: cleanStr(r[23]),
        serdik: cleanStr(r[24]),
        sertifikat_ukom: cleanStr(r[25]),
        surat_pengantar_korwil: cleanStr(r[26]),
        jabfung_ukkj: cleanStr(r[27]),
        url_full: cleanStr(r[28])
      },

      // Verifikasi & Status
      tanggal_revisi: cleanStr(r[29]) || '-',
      status: cleanStatus,
      raw_status: rawStatus,
      catatan: cleanStr(r[31]) || '-',
      jenis_jabatan: cleanStr(r[32]) || '-',
      pangkat_saat_ini: cleanStr(r[33]) || '-',
      ajuan_pangkat: cleanStr(r[34]) || '-',
      pemeriksa: cleanStr(r[35]) || '-',

      // Checklist Hasil Verifikasi Pemeriksa (AK - BA)
      verifikasi_dokumen: {
        sk_pns: cleanStr(r[36]) || '-',
        sk_cpns: cleanStr(r[37]) || '-',
        skkp: cleanStr(r[38]) || '-',
        evaluasi_kinerja_1_th: cleanStr(r[39]) || '-',
        evaluasi_kinerja_2_th: cleanStr(r[40]) || '-',
        ijazah_terakhir: cleanStr(r[41]) || '-',
        transkrip_nilai: cleanStr(r[42]) || '-',
        stlud: cleanStr(r[43]) || '-',
        sib: cleanStr(r[44]) || '-',
        hudis: cleanStr(r[45]) || '-',
        ijin_gelar: cleanStr(r[46]) || '-',
        sk_jabatan_beruntun: cleanStr(r[47]) || '-',
        pak_gabungan: cleanStr(r[48]) || '-',
        serdik: cleanStr(r[49]) || '-',
        sertifikat_ukom: cleanStr(r[50]) || '-',
        surat_pengantar_korwil: cleanStr(r[51]) || '-',
        lain_lain: cleanStr(r[52]) || '-'
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
    updatedAt: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd-MM-yyyy HH:mm:ss') + ' WIB'
  };

  const jsonString = JSON.stringify(payload);

  try {
    // Simpan di cache untuk mempercepat akses pengguna berikutnya
    cache.put(cacheKey, jsonString, CONFIG.CACHE_EXPIRATION_SECONDS);
  } catch (err) {
    // Abaikan jika payload melampaui limit ukuran cache
  }

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
