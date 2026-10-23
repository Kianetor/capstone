import { useState } from 'react'

// Indirizzi da provare per il logo di un set, nell'ordine: alcuni loghi su TCGdex esistono solo in .png,
// e per molti set non inglesi l'unico logo disponibile è quello inglese
function candidates(url) {
  if (!url) return []
  const png = url.replace(/\.webp$/, '.png')
  const english = url.replace(/\/(it|fr|de|es|pt|ja)\//, '/en/')
  return [...new Set([url, png, english, english.replace(/\.webp$/, '.png')])]
}

// Logo di un set su sfondo chiaro. Se nessun indirizzo funziona mostra il nome del set,
// oppure niente se hideIfMissing (pagina del set, dove il nome c'è già nel titolo)
export default function SetLogo({ url, name, large = false, hideIfMissing = false }) {
  const urls = candidates(url)
  const [attempt, setAttempt] = useState(0)
  const src = urls[attempt]

  if (!src && hideIfMissing) return null
  return (
    <div className={`cv-set-logo ${large ? 'cv-set-logo-lg' : ''} ${src ? '' : 'cv-set-logo-missing'}`}>
      {src ? <img src={src} alt={name} loading="lazy" onError={() => setAttempt((a) => a + 1)} /> : <span>{name}</span>}
    </div>
  )
}
