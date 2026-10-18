// Etichette in italiano per i valori degli enum del backend e funzioni di formattazione

export const LANGUAGES = [
  { value: 'ITA', label: 'Italiano', tcgdex: 'it' },
  { value: 'ENG', label: 'Inglese', tcgdex: 'en' },
  { value: 'JAP', label: 'Giapponese', tcgdex: 'ja' },
  { value: 'FRA', label: 'Francese', tcgdex: 'fr' },
  { value: 'GER', label: 'Tedesco', tcgdex: 'de' },
  { value: 'SPA', label: 'Spagnolo', tcgdex: 'es' },
  { value: 'POR', label: 'Portoghese', tcgdex: 'pt' },
  { value: 'KOR', label: 'Coreano', tcgdex: 'en' },
  { value: 'CHN', label: 'Cinese', tcgdex: 'en' },
]

// Stessi nomi usati da Cardmarket, dalla condizione migliore alla peggiore
export const CONDITIONS = [
  { value: 'MINT', label: 'Mint', short: 'MT', variant: 'success' },
  { value: 'NEAR_MINT', label: 'Near Mint', short: 'NM', variant: 'success' },
  { value: 'EXCELLENT', label: 'Excellent', short: 'EX', variant: 'info' },
  { value: 'GOOD', label: 'Good', short: 'GD', variant: 'primary' },
  { value: 'PLAYED', label: 'Played', short: 'PL', variant: 'warning' },
  { value: 'POOR', label: 'Poor', short: 'PO', variant: 'danger' },
]

export const GRADING_COMPANIES = ['PSA', 'BGS', 'CGC', 'SGC', 'ACE', 'Altro']

export const SORT_OPTIONS = [
  { value: 'createdAt,desc', label: 'Più recenti' },
  { value: 'name,asc', label: 'Nome (A-Z)' },
  { value: 'estimatedValue,desc', label: 'Valore più alto' },
  { value: 'estimatedValue,asc', label: 'Valore più basso' },
  { value: 'quantity,desc', label: 'Più copie' },
  { value: 'setName,asc', label: 'Set (A-Z)' },
]

export const languageLabel = (value) => LANGUAGES.find((l) => l.value === value)?.label ?? value
export const condition = (value) => CONDITIONS.find((c) => c.value === value) ?? { label: value, short: value, variant: 'secondary' }
export const tcgdexLanguage = (value) => LANGUAGES.find((l) => l.value === value)?.tcgdex ?? 'en'

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

export function formatEuro(value) {
  if (value === null || value === undefined || value === '') return '—'
  return euro.format(Number(value))
}

export function formatDate(value) {
  if (!value) return '—'
  // Le date "yyyy-MM-dd" del backend vanno lette come date locali, non UTC
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Oggi in formato yyyy-MM-dd, per i campi data dei form
export function todayIso() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
