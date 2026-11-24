export function maskCpf(value) {
  let v = String(value || '').replace(/\D/g, '')
  if (v.length > 11) v = v.slice(0, 11)
  if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
  if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3')
  if (v.length > 3) return v.replace(/(\d{3})(\d{1,3})/, '$1.$2')
  return v
}

export function digits(value) {
  return String(value || '').replace(/\D/g, '')
}

/**
 * Formata qualquer data para o padrão brasileiro DD-MM-AAAA.
 * Aceita: 2026-05-11, 2026-05-11T10:00:00, 11/05/2026, Date
 */
export function formatDate(dateStr) {
  if (dateStr == null || dateStr === '') return '—'

  if (dateStr instanceof Date && !isNaN(dateStr)) {
    const d = String(dateStr.getDate()).padStart(2, '0')
    const m = String(dateStr.getMonth() + 1).padStart(2, '0')
    const y = dateStr.getFullYear()
    return `${d}-${m}-${y}`
  }

  const raw = String(dateStr).trim()

  // já em DD-MM-AAAA ou DD/MM/AAAA
  const br = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
  if (br) return `${br[1]}-${br[2]}-${br[3]}`

  // ISO: AAAA-MM-DD ou AAAA-MM-DDTHH:mm:ss
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`

  // tenta Date nativo
  const parsed = new Date(raw)
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0')
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const y = parsed.getFullYear()
    return `${d}-${m}-${y}`
  }

  return raw
}

/** Troca datas ISO (AAAA-MM-DD) dentro de um texto por DD-MM-AAAA */
export function formatDatesInText(text) {
  if (!text) return text
  return String(text).replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, '$3-$2-$1')
}

export function todayIso() {
  // valor interno para <input type="date"> continua ISO
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function gerarProtocolo() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 90000) + 10000)
  return `HB-${y}${m}${day}-${rand}`
}
