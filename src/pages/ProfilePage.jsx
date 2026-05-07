import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import './ProfilePage.css'

const PROFILE_CACHE_MAX_AGE_MS = 60 * 60 * 1000 // 1 hour
const PROFILE_SELECT = 'id, won, guesses_used, last_updatedat'

function getCache(userId) {
  try {
    const raw = localStorage.getItem(`wordwise_profile_cache_${userId}`)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.games) || !data.lastFetchTimestamp) return null
    return data
  } catch {
    return null
  }
}

function setCache(userId, games, lastFetchTimestamp) {
  try {
    localStorage.setItem(
      `wordwise_profile_cache_${userId}`,
      JSON.stringify({ games, lastFetchTimestamp }),
    )
  } catch {
    // ignore
  }
}

function cacheAgeMs(cache) {
  return Date.now() - new Date(cache.lastFetchTimestamp).getTime()
}

function mergeGames(cachedGames, incomingGames) {
  const byId = new Map(cachedGames.map((g) => [g.id, { ...g }]))
  for (const g of incomingGames) {
    byId.set(g.id, { ...g })
  }
  return Array.from(byId.values())
}

function ProfilePage({ onBack }) {
  const { user, profile } = useAuth() || {}
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    winRate: 0,
    avgGuesses: null,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const usernameLetter = profile?.username?.[0]?.toUpperCase() || '?'
  const username = profile?.username || 'Anonymous'
  const email = user?.email || 'No email'

  const providers = user?.app_metadata?.providers || []
  const isEmailUser = providers.includes('email')

  let playerTitle = "Word Apprentice 📖"
  if (stats.winRate >= 70) {
    playerTitle = "Word Wizard 🧙"
  } else if (stats.winRate >= 40) {
    playerTitle = "Word Explorer 🗺️"
  }

  useEffect(() => {
    let mounted = true

    async function fetchStats() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      const computeStats = (gamesData) => {
        let totalGames = 0
        let wins = 0
        let guessesSum = 0

        if (gamesData) {
          for (const g of gamesData) {
            totalGames += 1
            if (g.won) {
              wins += 1
              if (g.guesses_used != null) guessesSum += g.guesses_used
            }
          }
        }

        setStats({
          totalGames,
          wins,
          winRate: totalGames > 0 ? (wins / totalGames) * 100 : 0,
          avgGuesses: wins > 0 ? guessesSum / wins : null,
        })
        setLoading(false)
      }

      const cache = getCache(user.id)
      const ageMs = cache ? cacheAgeMs(cache) : Infinity

      // Tier 1: Fresh Cache
      if (cache && ageMs < PROFILE_CACHE_MAX_AGE_MS) {
        computeStats(cache.games)
        return
      }

      // Tier 2: No Cache
      if (!cache) {
        setLoading(true)
        const { data, error } = await supabase
          .from('games')
          .select(PROFILE_SELECT)
          .eq('user_id', user.id)

        if (!mounted) return

        if (error) {
          console.error('Failed to fetch user stats', error)
          setLoading(false)
          return
        }

        const list = data || []
        setCache(user.id, list, new Date().toISOString())
        computeStats(list)
        return
      }

      // Tier 3: Stale Cache
      setLoading(true)
      const lastTs = cache.lastFetchTimestamp
      const { data, error } = await supabase
        .from('games')
        .select(PROFILE_SELECT)
        .eq('user_id', user.id)
        .gt('last_updatedat', lastTs)

      if (!mounted) return

      if (error) {
        console.error('Failed to update stale cache', error)
        setLoading(false)
        return
      }

      const incoming = data || []
      const merged = mergeGames(cache.games, incoming)
      setCache(user.id, merged, new Date().toISOString())
      computeStats(merged)
    }

    fetchStats()

    return () => {
      mounted = false
    }
  }, [user?.id])

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!user?.email || !currentPassword || !newPassword || !confirmPassword) return

    setResetError('')

    if (newPassword.length < 6) {
      setResetError('New password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setResetError('New passwords do not match.')
      return
    }

    setResetLoading(true)

    // First verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })

    if (signInError) {
      setResetError('Current password is incorrect.')
      setResetLoading(false)
      return
    }

    // If valid, update the password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    setResetLoading(false)

    if (!updateError) {
      setResetSent(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsModalOpen(false)
      setTimeout(() => setResetSent(false), 5000)
    } else {
      setResetError(updateError.message || 'Failed to update password.')
    }
  }

  const handleOpenModal = () => {
    setResetError('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <main className="profile-page">
      <header className="profile-header">
        <button className="profile-back-button" onClick={onBack} aria-label="Back to home">
          ← Back
        </button>
      </header>

      <section className="profile-content">
        <div className="profile-user-card">
          <div className="profile-avatar">
            {usernameLetter}
          </div>
          <h2 className="profile-username">{username}</h2>
          <p className="profile-title-text">{playerTitle}</p>
          <p className="profile-email">{email}</p>
        </div>

        <div>
          <h3 className="profile-section-title">Your Battle Record 📊</h3>
          <div className="profile-stats-grid">
            <div className="profile-stat-card">
              <span className="profile-stat-label">🎮 Games Played</span>
              <span className="profile-stat-value">
                {loading ? '-' : stats.totalGames}
              </span>
            </div>
            <div className="profile-stat-card">
              <span className="profile-stat-label">🏆 Wins</span>
              <span className="profile-stat-value">
                {loading ? '-' : stats.wins}
              </span>
            </div>
            <div className="profile-stat-card">
              <span className="profile-stat-label">🎯 Win Rate</span>
              <span className="profile-stat-value">
                {loading ? '-' : `${Math.round(stats.winRate)}%`}
              </span>
            </div>
            <div className="profile-stat-card">
              <span className="profile-stat-label">🧠 Avg Guesses</span>
              <span className="profile-stat-value">
                {loading ? '-' : (stats.avgGuesses ? stats.avgGuesses.toFixed(1) : 'N/A')}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="profile-actions-card">
            {!isEmailUser ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', textAlign: 'center', margin: 0 }}>
                Account managed via Google
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  type="button"
                  className="profile-reset-button"
                  onClick={handleOpenModal}
                >
                  Change Password
                </button>
                {resetSent && <p className="profile-reset-success">Password updated successfully!</p>}
              </div>
            )}
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="profile-modal-overlay" onClick={handleCloseModal}>
          <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="profile-modal-title">Change Password</h2>
            
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {resetError && <p style={{ color: '#EF4444', fontSize: '13px', margin: 0 }}>{resetError}</p>}
              
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
                className="profile-modal-input"
                required
              />

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password (min 6 chars)"
                className="profile-modal-input"
                required
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="profile-modal-input"
                required
              />

              <button
                type="submit"
                className="profile-modal-submit"
                disabled={resetLoading || !currentPassword || !newPassword || !confirmPassword}
                style={{ marginTop: '8px' }}
              >
                {resetLoading ? 'Updating...' : 'Update Password'}
              </button>

              <button
                type="button"
                className="profile-modal-cancel"
                onClick={handleCloseModal}
                disabled={resetLoading}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default ProfilePage
