import { google } from 'googleapis'

const SHEET_ID = process.env.SHEET_ID
const SHEET_NAME = process.env.SHEET_NAME || 'NEXE Operasyon'

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON eksik')

  let creds
  try {
    creds = JSON.parse(raw)
  } catch (e) {
    throw new Error('Google servis hesabı JSON okunamadı: ' + e.message)
  }

  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

function normalizeName(value) {
  return (value || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim()
}

export async function getRows() {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_NAME,
  })

  const rows = res.data.values || []
  return rows.slice(1).map((r, i) => ({
    rowNum: i + 2,
    isim: r[0] || '',
    meslek: r[1] || '',
    telefon: r[2] || '',
    gelisTarihi: r[3] || '',
    sonGorusme: r[4] || '',
    durum: r[5] || '',
    komisyon: r[6] || '',
    odeme: r[7] || '',
    musteriOlmaTarihi: r[8] || '',
    notlar: r[9] || '',
    yildiz: r[10] || '',
  }))
}

export async function updateRow(isim, values) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_NAME + '!A:A',
  })
  const names = res.data.values || []
  const normIsim = normalizeName(isim)
  const rowIndex = names.findIndex((r, i) => i > 0 && normalizeName(r[0]) === normIsim)

  if (rowIndex === -1) throw new Error('Kayıt bulunamadı: ' + isim)

  const rowNum = rowIndex + 1
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: SHEET_NAME + '!E' + rowNum + ':K' + rowNum,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        values.sonGorusme,
        values.durum,
        values.komisyon,
        values.odeme,
        values.musteriOlmaTarihi,
        values.notlar,
        values.yildiz,
      ]],
    },
  })

  return rowNum
}
