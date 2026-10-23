import { useState } from 'react'
import { pokemonArtwork } from '../lib/format'

// Colore già calcolato per ogni Pokémon: l'immagine si analizza una volta sola
const colors = new Map()

// Colore dominante dell'immagine: le tonalità dei pixel colorati vengono raggruppate in 12 fasce
// e vince la fascia più presente. Nero, bianco e grigi (contorni, riflessi) non contano.
function dominantColor(img) {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, size, size)
  const data = ctx.getImageData(0, 0, size, size).data

  const bins = Array.from({ length: 12 }, () => ({ count: 0, h: 0, s: 0 }))
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const [h, s, l] = toHsl(data[i], data[i + 1], data[i + 2])
    if (s < 0.15 || l < 0.12 || l > 0.9) continue
    const bin = bins[Math.floor(h / 30) % 12]
    bin.count++
    bin.h += h
    bin.s += s
  }
  const best = bins.reduce((a, b) => (b.count > a.count ? b : a))
  if (best.count === 0) return null
  // Colore un po' più vivo e luminosità fissa: il bordo deve vedersi bene sullo sfondo scuro
  const saturation = Math.max(55, Math.round((best.s / best.count) * 100))
  return `hsl(${Math.round(best.h / best.count)} ${saturation}% 62%)`
}

function toHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  let h
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [(h * 60 + 360) % 360, s, l]
}

// Avatar rotondo dell'utente: il Pokémon scelto con il bordo del suo colore, altrimenti l'iniziale dello username
export default function Avatar({ user, size = 36 }) {
  const dex = user.avatarDex
  const [, setLoaded] = useState(0)

  const handleLoad = (e) => {
    if (colors.has(dex)) return
    try {
      colors.set(dex, dominantColor(e.currentTarget))
    } catch {
      colors.set(dex, null) // immagine non leggibile: resta il bordo bianco
    }
    setLoaded((n) => n + 1)
  }

  const style = { width: size, height: size }
  if (dex) {
    const color = colors.get(dex)
    return (
      <span className="cv-avatar" style={color ? { ...style, borderColor: color } : style}>
        <img src={pokemonArtwork(dex)} alt="" crossOrigin="anonymous" onLoad={handleLoad} />
      </span>
    )
  }
  return (
    <span className="cv-avatar cv-avatar-initial" style={{ ...style, fontSize: size * 0.45 }} aria-hidden="true">
      {user.username.charAt(0).toUpperCase()}
    </span>
  )
}
