import { useState, useEffect, useRef } from 'react'
import styles from './index.module.css'

const KULLANICILAR = ['İlker', 'Levent', 'Hakan', 'Ersoy']

const MESLEKLER = ['Tıp Doktoru', 'Diş Hekimi', 'Eczacı']

const DURUMLAR = [
  { key: 'Yeni Talep', label: 'Yeni Talep', bg: '#E8EAF6', color: '#283593' },
  { key: 'WhatsApp Gönderildi', label: 'WhatsApp Gönderildi', bg: '#E0F2F1', color: '#00695C' },
  { key: 'Arandı - Ulaşılamadı', label: 'Ulaşılamadı', bg: '#FFF3E0', color: '#E65100' },
  { key: 'Görüşüldü', label: 'Görüşüldü', bg: '#E3F2FD', color: '#0D47A1' },
  { key: 'İlgileniyor', label: 'İlgileniyor', bg: '#F1F8E9', color: '#33691E' },
  { key: 'Takip Edilecek', label: 'Takip Edilecek', bg: '#FFFDE7', color: '#827717' },
  { key: 'Müşteri Oldu', label: 'Müşteri Oldu', bg: '#F3E5F5', color: '#4A148C' },
  { key: 'Olumsuz', label: 'Olumsuz', bg: '#FFEBEE', color: '#B71C1C' },
]

const ODEME_DURUMLARI = ['Bekliyor', 'Ödendi', 'İptal']

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function phoneDigits(value) {
  return (value || '').replace(/[^0-9]/g, '')
}

function parseMoney(value) {
  const normalized = String(value || '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '')
  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : 0
}

export default function Home() {
  const [authed, setAuthed] = useState(false)
  const [pwError, setPwError] = useState('')
  const [kullanici, setKullanici] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [fMeslek, setFMeslek] = useState('')
  const [fDurum, setFDurum] = useState('')
  const [fOdeme, setFOdeme] = useState('')
  const [modal, setModal] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [selDurum, setSelDurum] = useState('')
  const [selKomisyon, setSelKomisyon] = useState('')
  const [selOdeme, setSelOdeme] = useState('')
  const [selMusteriTarihi, setSelMusteriTarihi] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const noteRef = useRef()
  const tableWrapRef = useRef()

  useEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const onScroll = () => setShowScrollTop(el.scrollTop > 200)
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [authed])

  useEffect(() => {
    const saved = sessionStorage.getItem('nexe_musteri_takip_user')
    if (saved) {
      setKullanici(saved)
      setAuthed(true)
      loadRows()
    }
  }, [])

  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') closeModal()
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && modal) saveRecord()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [modal, noteText, selDurum, selKomisyon, selOdeme, selMusteriTarihi])

  async function handleLogin(e) {
    e.preventDefault()
    if (!kullanici) {
      setPwError('Lütfen adınızı seçin.')
      return
    }

    sessionStorage.setItem('nexe_musteri_takip_user', kullanici)
    setAuthed(true)
    loadRows()
  }

  async function loadRows() {
    setLoading(true)
    try {
      const res = await fetch('/api/rows')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRows(data.rows)
    } catch (e) {
      showToast('Veri yüklenemedi: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function saveRecord() {
    if (!modal) return
    setSaving(true)
    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isim: modal.row.isim,
          note: noteText,
          durum: selDurum,
          komisyon: selKomisyon,
          odeme: selOdeme,
          musteriOlmaTarihi: selMusteriTarihi,
          kullanici,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setRows(prev => prev.map(r =>
        r.rowNum === modal.row.rowNum
          ? {
              ...r,
              sonGorusme: data.sonGorusme,
              durum: data.durum,
              komisyon: data.komisyon,
              odeme: data.odeme,
              musteriOlmaTarihi: data.musteriOlmaTarihi,
              notlar: data.notlar,
            }
          : r
      ))
      showToast('Kaydedildi', 'success')
      closeModal()
    } catch (e) {
      showToast('Hata: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  function openModal(row) {
    setModal({ row })
    setNoteText('')
    setSelDurum(row.durum || 'Yeni Talep')
    setSelKomisyon(row.komisyon || '')
    setSelOdeme(row.odeme || 'Bekliyor')
    setSelMusteriTarihi(row.musteriOlmaTarihi || '')
    setTimeout(() => noteRef.current?.focus(), 100)
  }

  function closeModal() {
    setModal(null)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function openWhatsApp(row) {
    const digits = phoneDigits(row.telefon)
    if (!digits) return
    window.open('https://wa.me/' + digits, '_blank', 'noopener,noreferrer')
  }

  function callPhone(row) {
    const digits = phoneDigits(row.telefon)
    if (!digits) return
    window.open('tel:+' + digits)
  }

  const filtered = rows.filter(r => {
    const q = search.toLocaleLowerCase('tr-TR')
    const textMatch = !q || [
      r.isim,
      r.meslek,
      r.telefon,
      r.durum,
      r.komisyon,
      r.odeme,
      r.notlar,
    ].join(' ').toLocaleLowerCase('tr-TR').includes(q)
    const meslekMatch = !fMeslek || r.meslek === fMeslek
    const durumMatch = !fDurum || (fDurum === 'Yeni Talep'
      ? (!r.durum || r.durum === 'Yeni Talep')
      : r.durum === fDurum)
    const odemeMatch = !fOdeme || r.odeme === fOdeme
    return textMatch && meslekMatch && durumMatch && odemeMatch
  })

  const total = rows.length
  const yeni = rows.filter(r => !r.durum || r.durum === 'Yeni Talep').length
  const gorusuldu = rows.filter(r => r.durum === 'Görüşüldü').length
  const musteri = rows.filter(r => r.durum === 'Müşteri Oldu').length
  const bekleyenOdeme = rows.filter(r => r.komisyon && r.odeme !== 'Ödendi' && r.odeme !== 'İptal').length
  const komisyonToplam = rows.reduce((sum, r) => sum + parseMoney(r.komisyon), 0)
  const odenenToplam = rows
    .filter(r => r.odeme === 'Ödendi')
    .reduce((sum, r) => sum + parseMoney(r.komisyon), 0)

  if (!authed) return (
    <div className={styles.loginBg}>
      <form className={styles.loginCard} onSubmit={handleLogin}>
        <div className={styles.loginLogo}>NEXE</div>
        <div className={styles.loginSub}>OPERASYON · CRM</div>
        <div className={styles.loginField}>
          <label>Adınız</label>
          <select value={kullanici} onChange={e => setKullanici(e.target.value)} required>
            <option value="">Seçin...</option>
            {KULLANICILAR.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        {pwError && <div className={styles.pwError}>{pwError}</div>}
        <button type="submit" className={styles.btnLogin}>Giriş Yap</button>
      </form>
    </div>
  )

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.brand}>NEXE</span>
        <div className={styles.hdivider} />
        <span className={styles.pageTitle}>Operasyon Takip</span>
        <div className={styles.headerRight}>
          <span className={styles.userBadge}>{kullanici}</span>
          <button className={styles.btnSignout} onClick={() => {
            sessionStorage.removeItem('nexe_musteri_takip_user')
            setAuthed(false)
          }}>Çıkış</button>
        </div>
      </header>

      <div className={styles.statsBar}>
        <Stat color="#283593" num={yeni} label="Yeni" />
        <Stat color="#0D47A1" num={gorusuldu} label="Görüşüldü" />
        <Stat color="#4A148C" num={musteri} label="Müşteri" />
        <Stat color="#E65100" num={bekleyenOdeme} label="Ödeme Bekler" />
        <div className={styles.statsSep} />
        <Stat color="#00695C" num={`${komisyonToplam} €`} label="Komisyon" />
        <Stat color="#1B5E20" num={`${odenenToplam} €`} label="Ödenen" />
        <Stat color="#1B2C48" num={total} label="Toplam" right />
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <SearchIcon />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="İsim, telefon, not ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className={styles.clearBtn} onClick={() => setSearch('')}>×</button>}
        </div>
        <select className={styles.select} value={fMeslek} onChange={e => setFMeslek(e.target.value)}>
          <option value="">Tüm Meslekler</option>
          {MESLEKLER.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className={styles.select} value={fDurum} onChange={e => setFDurum(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          {DURUMLAR.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
        </select>
        <select className={styles.select} value={fOdeme} onChange={e => setFOdeme(e.target.value)}>
          <option value="">Tüm Ödemeler</option>
          {ODEME_DURUMLARI.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <button className={styles.btnScrollBottom} onClick={() => tableWrapRef.current?.scrollTo({ top: tableWrapRef.current.scrollHeight, behavior: 'smooth' })}>
          En Alta
        </button>
        <button className={styles.btnRefresh} onClick={loadRows} disabled={loading}>
          {loading ? 'Yükleniyor...' : 'Yenile'}
        </button>
        <span className={styles.countBadge}>{filtered.length} kayıt</span>
      </div>

      <div className={styles.tableWrap} ref={tableWrapRef}>
        {loading && rows.length === 0 ? (
          <div className={styles.loadingMsg}><span className={styles.spinner} /> Yükleniyor...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>İsim</th>
                <th>Meslek</th>
                <th>Telefon</th>
                <th className={styles.hideM}>Geliş</th>
                <th className={styles.hideM}>Son Görüşme</th>
                <th>Durum</th>
                <th>Komisyon</th>
                <th>Ödeme</th>
                <th className={styles.hideM}>Müşteri Tarihi</th>
                <th>Son Not</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => {
                const lastNote = r.notlar
                  ? r.notlar.split('\n').pop().substring(0, 55) + (r.notlar.length > 55 ? '...' : '')
                  : ''
                return (
                  <tr key={r.rowNum} className={`${styles.row} ${styles['row_' + meslekKey(r.meslek)]}`}>
                    <td className={styles.tdIdx}>{idx + 1}</td>
                    <td className={styles.tdName}>{r.isim}</td>
                    <td><MeslekBadge m={r.meslek} /></td>
                    <td className={styles.tdTel}>
                      <div className={styles.phoneCell}>
                        <span>{r.telefon}</span>
                        <button className={`${styles.btnAct} ${styles.btnWhatsApp}`} title="WhatsApp" onClick={() => openWhatsApp(r)}>WA</button>
                        <button className={`${styles.btnAct} ${styles.btnCall}`} title="Ara" onClick={() => callPhone(r)}>Ara</button>
                      </div>
                    </td>
                    <td className={`${styles.tdDate} ${styles.hideM}`}>{r.gelisTarihi}</td>
                    <td className={`${styles.tdDate} ${styles.hideM}`}>{r.sonGorusme}</td>
                    <td><DurumBadge d={r.durum || 'Yeni Talep'} /></td>
                    <td className={styles.tdMoney}>{r.komisyon}</td>
                    <td><OdemeBadge value={r.odeme || 'Bekliyor'} /></td>
                    <td className={`${styles.tdDate} ${styles.hideM}`}>{r.musteriOlmaTarihi}</td>
                    <td className={styles.tdNote} title={r.notlar}>{lastNote}</td>
                    <td>
                      <button className={`${styles.btnAct} ${styles.btnNote}`} onClick={() => openModal(r)}>Düzenle</button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className={styles.empty}>Sonuç bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className={styles.modalBg} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>{modal.row.isim}</div>
                <div className={styles.modalSub}>
                  <MeslekBadge m={modal.row.meslek} />
                  <span className={styles.modalPhone}>{modal.row.telefon}</span>
                </div>
              </div>
              <button className={styles.modalClose} onClick={closeModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              {modal.row.notlar && (
                <div className={styles.history}>
                  {modal.row.notlar.split('\n').map((line, i) => (
                    <div key={i} className={styles.histLine}>{line}</div>
                  ))}
                </div>
              )}
              <div className={styles.formGrid}>
                <label>
                  <span>Durum</span>
                  <select value={selDurum} onChange={e => {
                    setSelDurum(e.target.value)
                    if (e.target.value === 'Müşteri Oldu' && !selMusteriTarihi) setSelMusteriTarihi(todayISO())
                  }}>
                    {DURUMLAR.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Komisyon</span>
                  <input value={selKomisyon} onChange={e => setSelKomisyon(e.target.value)} placeholder="275 €, 550 €..." />
                </label>
                <label>
                  <span>Ödeme</span>
                  <select value={selOdeme} onChange={e => setSelOdeme(e.target.value)}>
                    {ODEME_DURUMLARI.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
                <label>
                  <span>Müşteri Olma Tarihi</span>
                  <input type="date" value={selMusteriTarihi} onChange={e => setSelMusteriTarihi(e.target.value)} />
                </label>
              </div>
              <textarea
                ref={noteRef}
                className={styles.noteInput}
                placeholder="Görüşme notu, takip adımı, adayın sorusu..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={4}
              />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={closeModal}>İptal</button>
              <button className={styles.btnSave} onClick={saveRecord} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`${styles.toast} ${styles['toast_' + toast.type]}`}>{toast.msg}</div>}

      {showScrollTop && (
        <button className={styles.btnScrollTop} onClick={() => tableWrapRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} title="En üste git">
          ↑
        </button>
      )}
    </div>
  )
}

function Stat({ color, num, label, right }) {
  return (
    <div className={styles.stat} style={right ? { marginLeft: 'auto' } : {}}>
      <div className={styles.statDot} style={{ background: color }} />
      <span className={styles.statNum}>{num}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

function MeslekBadge({ m }) {
  const map = {
    'Tıp Doktoru': { bg: '#FFF3E0', color: '#E65100', label: 'Tıp Dr.' },
    'Diş Hekimi': { bg: '#E8F5E9', color: '#1B5E20', label: 'Diş Hek.' },
    'Eczacı': { bg: '#E3F2FD', color: '#0D47A1', label: 'Eczacı' },
  }
  const s = map[m] || { bg: '#EEEEEE', color: '#777', label: '?' }
  return <span className={styles.badge} style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

function DurumBadge({ d }) {
  const found = DURUMLAR.find(x => x.key === d) || DURUMLAR[0]
  return <span className={styles.badge} style={{ background: found.bg, color: found.color }}>{found.label}</span>
}

function OdemeBadge({ value }) {
  const style = {
    'Ödendi': { bg: '#E8F5E9', color: '#1B5E20' },
    'İptal': { bg: '#ECEFF1', color: '#546E7A' },
    'Bekliyor': { bg: '#FFF3E0', color: '#E65100' },
  }[value] || { bg: '#FFF3E0', color: '#E65100' }

  return <span className={styles.badge} style={{ background: style.bg, color: style.color }}>{value || 'Bekliyor'}</span>
}

function meslekKey(m) {
  if (m === 'Tıp Doktoru') return 'tip'
  if (m === 'Diş Hekimi') return 'dis'
  if (m === 'Eczacı') return 'ecz'
  return 'bos'
}

function SearchIcon() {
  return (
    <svg className={styles.searchIco} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}
