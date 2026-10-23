import { NavLink } from 'react-router-dom'

// Icone disegnate con il colore del testo (currentColor): attiva = gialla, le altre grigie
const icon = (children) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

const TABS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: icon(<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />),
  },
  {
    to: '/cards',
    end: true,
    label: 'Inventario',
    icon: icon(
      <>
        <rect x="8" y="3" width="12" height="16" rx="2" />
        <path d="M5 6.5v12.5a2 2 0 0 0 2 2h9" />
      </>,
    ),
  },
  { to: '/cards/new', label: 'Aggiungi', add: true, icon: icon(<path d="M12 5v14M5 12h14" />) },
  {
    to: '/transactions',
    label: 'Transazioni',
    icon: icon(<path d="M8 20V4m0 0L4 8m4-4 4 4m4-4v16m0 0 4-4m-4 4-4-4" />),
  },
  {
    to: '/explore',
    label: 'Esplora',
    icon: icon(
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5z" />
      </>,
    ),
  },
]

// Barra in basso con le sezioni principali, solo su telefono (sopra md c'è la navbar in alto)
export default function MobileTabBar() {
  return (
    <nav className="cv-tabbar d-md-none" aria-label="Sezioni principali">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `cv-tab ${tab.add ? 'cv-tab-add' : ''} ${isActive ? 'active' : ''}`}
        >
          <span className="cv-tab-icon">{tab.icon}</span>
          <span className="cv-tab-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
