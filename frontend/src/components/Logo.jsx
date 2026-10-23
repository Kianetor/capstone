// Due carte sovrapposte con una stella: logo dell'app (colore preso da currentColor)
export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect
        x="10"
        y="3"
        width="16"
        height="22"
        rx="3"
        transform="rotate(12 18 14)"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.55"
      />
      <rect x="5" y="7" width="16" height="22" rx="3" fill="currentColor" />
      <path d="M13 12.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#0d1321" />
    </svg>
  )
}
