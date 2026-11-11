import { useEffect, useState } from 'react'
import { getUpgrades, getUser, unlockUpgrade } from '../api'

const EFFECT_ICONS = {
  pr_multiplier: <>
    <path d="M6.5 3h11v5.2c0 3.7-2.5 6.3-5.5 6.3s-5.5-2.6-5.5-6.3V3Z" />
    <path d="M6.5 5H3v2a4.5 4.5 0 0 0 4.3 4.5M17.5 5H21v2a4.5 4.5 0 0 1-4.3 4.5M12 14.5V19m-4 2h8v-2H8v2Z" />
  </>,
  streak_shield: <>
    <path d="M12 2.8 20 6v4.1c0 5-3.3 8.5-8 11.1-4.7-2.6-8-6.1-8-11.1V6l8-3.2Z" />
    <path d="m12 6 5.2 2v2.1c0 3.6-2.2 6.1-5.2 8V6Z" fill="currentColor" stroke="none" />
  </>,
  volume_bonus: <path d="M12 3 21 12h-5.5v9h-7v-9H3l9-9Z" fill="currentColor" strokeLinejoin="round" />,
  weekend_multiplier: <>
    <path d="M12 10.5c-2 3-3 6.6-3.1 10.5h3c-.3-3.9.3-7 1.9-9.6" />
    <path d="M12 10.5C8.8 8.9 6 9.2 3 11c.5-3 4-5.1 8.2-3.6-.9-2.3-2.4-3.5-4.7-4.1 3.7-1 6.6.4 7 4 2.6-2.2 6-1.9 7.5.8-2.3-.6-4.3-.2-5.9 1.1 3.2-.2 5.4 1.6 5.7 4.3-2.4-1.9-4.6-2.7-7-2.1" />
  </>,
}

function UpgradeIcon({ effect }) {
  const artwork = EFFECT_ICONS[effect]
  if (!artwork) return <span aria-hidden="true">⚡</span>
  return (
    <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      {artwork}
    </svg>
  )
}

const EFFECT_LABELS = {
  pr_multiplier: 'PR Multiplier',
  streak_shield: 'Streak Shield',
  volume_bonus: 'Volume Bonus',
  weekend_multiplier: 'Weekend Bonus',
}

function UpgradeCard({ upgrade, userPoints = 0, onUnlock }) {
  const canAfford = userPoints >= upgrade.cost
  const effectLabel = EFFECT_LABELS[upgrade.effect_type] ?? upgrade.effect_type

  return (
    <div className={`card fade-up ${upgrade.owned ? 'glow-green' : ''}`} style={{
      padding: '24px', display: 'flex', flexDirection: 'column', gap: 14,
      border: upgrade.count > 0
        ? '1px solid rgba(16,185,129,0.4)'
        : canAfford
          ? '1px solid rgba(139,92,246,0.25)'
          : '1px solid rgba(139,92,246,0.1)',
      opacity: 1,
      position: 'relative', overflow: 'hidden',
    }}>
      {upgrade.count > 0 && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(16,185,129,0.15)', color: '#10b981',
          fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999,
          border: '1px solid rgba(16,185,129,0.3)',
        }}>x{upgrade.count} OWNED</div>
      )}

      {/* Icon + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, flexShrink: 0, borderRadius: 12, color: '#c4b5fd',
          background: upgrade.count > 0
            ? 'rgba(16,185,129,0.1)'
            : 'rgba(139,92,246,0.1)',
          border: upgrade.count > 0
            ? '1px solid rgba(16,185,129,0.25)'
            : '1px solid rgba(139,92,246,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><UpgradeIcon effect={upgrade.effect_type} /></div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1rem' }}>
            {upgrade.name}
          </div>
          <span className="badge badge-purple" style={{ fontSize: '0.68rem', marginTop: 4 }}>
            {effectLabel}
          </span>
        </div>
      </div>

      {/* Description */}
      <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.55 }}>
        {upgrade.effect_type === 'streak_shield'
          ? 'Each copy protects one missed day per streak. Two missed days in a row break the streak.'
          : upgrade.description}
      </p>

      {/* Footer: cost + button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '1rem' }}>⚡</span>
          <span className="gold-text" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
            {upgrade.cost}
          </span>
          <span style={{ color: '#475569', fontSize: '0.8rem' }}>pts</span>
        </div>

        {onUnlock && (
          <button
            id={`unlock-btn-${upgrade.id}`}
            className={canAfford ? 'btn-gold' : 'btn-ghost'}
            onClick={() => onUnlock(upgrade)}
            disabled={!canAfford}
          >
            {canAfford ? 'UNLOCK' : `Need ${upgrade.cost - userPoints} more pts`}
          </button>
        )}
      </div>
    </div>
  )
}

function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return <div className={`toast toast-${type}`}>{msg}</div>
}

export default function Upgrades() {
  const [upgrades, setUpgrades] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [toast, setToast] = useState(null)

  const refresh = () =>
    Promise.all([getUpgrades(), getUser()])
      .then(([u, usr]) => {
        setLoadFailed(false)
        setUpgrades(u.data)
        setUser(usr.data)
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false))

  useEffect(() => { refresh() }, [])

  const handleUnlock = async (upgrade) => {
    try {
      const res = await unlockUpgrade({ upgrade_id: upgrade.id })
      if (res.data.success) {
        setToast({ msg: res.data.message, type: 'success' })
        refresh()
      } else {
        setToast({ msg: res.data.message, type: 'error' })
      }
    } catch {
      setToast({ msg: 'Something went wrong.', type: 'error' })
    }
  }

  const ownedUpgrades = upgrades.filter(u => u.count > 0);
  const totalOwnedCount = upgrades.reduce((sum, u) => sum + u.count, 0);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <div className="pulse-glow" style={{ width: 12, height: 12, borderRadius: '50%', background: '#8b5cf6' }} />
      <span style={{ color: '#94a3b8' }}>Loading upgrades…</span>
    </div>
  )

  if (loadFailed) return <p role="alert">Could not load the upgrade shop.</p>

  return (
    <div className="page">
      <h1 className="page-title gradient-text fade-up">Upgrade Shop</h1>
      <p className="page-subtitle fade-up">Spend your points on upgrades that amplify future rewards.</p>

      {/* Points balance */}
      <div className="card fade-up" style={{
        padding: '20px 28px', marginBottom: 32, display: 'flex',
        alignItems: 'center', gap: 16,
        background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.05))',
        border: '1px solid rgba(139,92,246,0.2)',
      }}>
        <div style={{ fontSize: '2rem' }}>⚡</div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 2 }}>AVAILABLE POINTS</div>
          <div className="gold-text" style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '2rem' }}>
            {(user?.total_points ?? 0).toLocaleString()}
          </div>
        </div>
        {totalOwnedCount > 0 && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>TOTAL OWNED</div>
            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#10b981' }}>{totalOwnedCount}</div>
          </div>
        )}
      </div>

      {/* Shop Section */}
      <h2 style={{
        fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1rem',
        color: '#94a3b8', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em'
      }}>
        Upgrade Shop
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 40 }}>
        {upgrades.map(u => (
          <UpgradeCard key={u.id} upgrade={u} userPoints={user?.total_points ?? 0} onUnlock={handleUnlock} />
        ))}
      </div>

      {/* Collection Section */}
      {ownedUpgrades.length > 0 && (
        <>
          <h2 style={{
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1rem',
            color: '#94a3b8', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em'
          }}>
            Active Upgrades
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            {ownedUpgrades.map(u => (
              <UpgradeCard key={u.id} upgrade={u} />
            ))}
          </div>
        </>
      )}

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  )
}
