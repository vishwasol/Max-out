import { NavLink } from 'react-router-dom'
import logo from '../assets/logo.png'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/log', label: 'Log' },
  { to: '/progress', label: 'Progress' },
  { to: '/upgrades', label: 'Upgrades' },
]

export default function Navbar({ onLogout }) {
  return (
    <aside className="app-nav">
      {/* Sidebar Header: Logo */}
      <div className="app-nav-brand">
        <div>
          <img
            src={logo}
            alt="Logo"
            style={{ width: '100%', height: 'auto', maxWidth: 250 }}
          />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="app-nav-links" aria-label="Main navigation">
        {links.map(({ to, label }) => {
          return (
            <NavLink key={to} to={to} end={to === '/'} className="app-nav-link"
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                borderRadius: 12,
                fontSize: '0.925rem', fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isActive ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1))' : 'transparent',
                color: isActive ? '#fff' : '#94a3b8',
                border: isActive ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
              })}>
              <span>{label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Sidebar Footer: Logout */}
      {onLogout && (
        <div className="app-nav-account">
          <button className="app-nav-link" onClick={onLogout} style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'transparent', border: 'none', cursor: 'pointer',
            borderRadius: 12,
            color: '#ef4444', fontSize: '0.925rem', fontWeight: 600,
            transition: 'background 0.2s',
          }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  )
}
