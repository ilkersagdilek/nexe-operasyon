import { getRows } from '../../lib/sheets'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const rows = await getRows()
    res.status(200).json({ rows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
