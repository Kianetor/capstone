import { useRef } from 'react'
import { Link } from 'react-router-dom'

const MAX_TILT = 8 // gradi di inclinazione massima

// Carta che si inclina leggermente in 3D seguendo il mouse.
// Aggiorna solo variabili CSS (niente stato React): il resto lo fa .cv-tilt in index.css.
// Con il tocco (telefono) non si inclina; con "riduci movimento" attivo l'inclinazione la toglie il CSS
export default function TiltCard({ children, className = '', to }) {
  const ref = useRef(null)

  const move = (e) => {
    if (e.pointerType !== 'mouse' || !ref.current) return
    const box = ref.current.getBoundingClientRect()
    const x = (e.clientX - box.left) / box.width
    const y = (e.clientY - box.top) / box.height
    const style = ref.current.style
    style.setProperty('--rx', `${(0.5 - y) * MAX_TILT}deg`)
    style.setProperty('--ry', `${(x - 0.5) * MAX_TILT}deg`)
  }

  const reset = () => {
    if (!ref.current) return
    ref.current.style.removeProperty('--rx')
    ref.current.style.removeProperty('--ry')
  }

  const classes = `cv-tilt ${className}`
  // Come link: stesso indirizzo del titolo della carta, fuori dalla tabulazione per non avere due link uguali
  if (to) {
    return (
      <Link
        ref={ref}
        to={to}
        tabIndex={-1}
        aria-hidden="true"
        className={`${classes} cv-tilt-front d-block`}
        onPointerMove={move}
        onPointerLeave={reset}
      >
        {children}
      </Link>
    )
  }
  return (
    <div ref={ref} className={classes} onPointerMove={move} onPointerLeave={reset}>
      {children}
    </div>
  )
}
