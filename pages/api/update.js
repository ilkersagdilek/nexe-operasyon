import { getRows, updateRow } from '../../lib/sheets'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const {
    isim,
    note,
    durum,
    komisyon,
    odeme,
    musteriOlmaTarihi,
    kullanici,
  } = req.body

  if (!isim) return res.status(400).json({ error: 'isim gerekli' })

  try {
    const rows = await getRows()
    const row = rows.find(r => r.isim === isim)
    if (!row) return res.status(404).json({ error: 'Kayıt bulunamadı' })

    const ts = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Berlin' })
    const newLine = note ? '[' + ts + ' · ' + kullanici + ']: ' + note : ''
    const combined = [row.notlar, newLine].filter(Boolean).join('\n')
    const sonGorusme = note ? ts : (row.sonGorusme || '')

    const values = {
      sonGorusme,
      durum: durum !== undefined ? durum : row.durum,
      komisyon: komisyon !== undefined ? komisyon : row.komisyon,
      odeme: odeme !== undefined ? odeme : row.odeme,
      musteriOlmaTarihi: musteriOlmaTarihi !== undefined ? musteriOlmaTarihi : row.musteriOlmaTarihi,
      notlar: combined,
    }

    await updateRow(row.isim, values)

    res.json({ ok: true, ...values })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
