import { useEffect, useRef, useState } from 'react'

// Larghezza attuale di un elemento (per disegnare i grafici SVG alla misura giusta, anche quando cambia)
export function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}

// Tacche "pulite" per l'asse dei prezzi: 0, 100, 200... fino a superare il massimo
export function niceTicks(max, count = 4) {
  if (!(max > 0)) return [0, 1]
  const raw = max / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)
  const ticks = []
  for (let v = 0; v < max + step; v += step) ticks.push(Math.round(v * 100) / 100)
  return ticks
}
