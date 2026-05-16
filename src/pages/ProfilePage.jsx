import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import { Gamepad2, Trophy, Target, Brain, Flame, Award, Pencil, Check, X } from 'lucide-react'
import AvatarCropperModal from '../components/AvatarCropperModal'
import './ProfilePage.css'

const PROFILE_CACHE_MAX_AGE_MS = 60 * 60 * 1000 // 1 hour
const PROFILE_SELECT = 'id, won, guesses_used, last_updatedat'
const LEADERBOARD_PROFILES_CACHE_KEY = 'wordwise_leaderboard_profiles_cache'

function invalidateLeaderboardProfileCache() {
  try {
    localStorage.removeItem(LEADERBOARD_PROFILES_CACHE_KEY)
  } catch {
    // ignore
  }
}

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
  const { user, profile, refreshProfile } = useAuth() || {}
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    winRate: 0,
    avgGuesses: null,
    currentStreak: 0,
    longestStreak: 0,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // New states for editing
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [editUsernameValue, setEditUsernameValue] = useState("")
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [cropperImageSrc, setCropperImageSrc] = useState(null)
  const fileInputRef = useRef(null)

  const usernameLetter = profile?.username?.[0]?.toUpperCase() || '?'
  const username = profile?.username || 'Anonymous'
  const email = user?.email || 'No email'
  // Read avatar_url directly from the AuthContext profile (no extra fetch).
  const avatarUrl = profile?.avatar_url || null

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

        // Streaks (consecutive wins by game order, not calendar days).
        // Sort a shallow copy ascending by last_updatedat so we don't mutate
        // the cached array.
        const ordered = (gamesData ? [...gamesData] : []).sort((a, b) => {
          const ta = new Date(a.last_updatedat).getTime()
          const tb = new Date(b.last_updatedat).getTime()
          return ta - tb
        })

        let longestStreak = 0
        let runningStreak = 0
        let currentStreak = 0
        for (const g of ordered) {
          if (g.won) {
            runningStreak += 1
            if (runningStreak > longestStreak) longestStreak = runningStreak
          } else {
            runningStreak = 0
          }
        }
        // Current streak = trailing run of consecutive wins (stops at first
        // loss when scanning from newest to oldest).
        currentStreak = runningStreak

        setStats({
          totalGames,
          wins,
          winRate: totalGames > 0 ? (wins / totalGames) * 100 : 0,
          avgGuesses: wins > 0 ? guessesSum / wins : null,
          currentStreak,
          longestStreak,
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

  // Profile Edit Handlers
  const handleEditUsernameClick = () => {
    setEditUsernameValue(username)
    setIsEditingUsername(true)
  }

  const handleSaveUsername = async () => {
    if (!editUsernameValue.trim() || editUsernameValue === username) {
      setIsEditingUsername(false)
      return
    }
    try {
      await authService.updateProfile(user.id, { username: editUsernameValue.trim() })
      if (refreshProfile) await refreshProfile()
      invalidateLeaderboardProfileCache()
      setIsEditingUsername(false)
    } catch (err) {
      console.error('Failed to update username:', err)
      alert('Failed to update username. Please try again.')
    }
  }

  const handleCancelUsername = () => {
    setIsEditingUsername(false)
    setEditUsernameValue("")
  }

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    const reader = new FileReader()
    reader.onload = () => {
      setCropperImageSrc(reader.result)
    }
    reader.onerror = () => {
      console.error('Failed to read image file')
      alert('Could not read the selected image.')
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCropCancel = () => {
    if (isUploadingAvatar) return
    setCropperImageSrc(null)
  }

  const handleCropConfirm = async (blob, error) => {
    if (error || !blob || !user?.id) {
      if (error) alert('Failed to crop image. Please try a different picture.')
      return
    }

    setIsUploadingAvatar(true)
    setCropperImageSrc(null)
    try {
      const publicUrl = await authService.uploadAvatar(user.id, blob)
      await authService.updateProfile(user.id, { avatar_url: publicUrl })
      if (refreshProfile) await refreshProfile()
      invalidateLeaderboardProfileCache()
    } catch (err) {
      console.error('Avatar upload failed:', err)
      alert('Failed to upload profile picture.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  return (
    <main className="profile-page">
      <header className="profile-header">
        <button className="profile-back-button" onClick={onBack} aria-label="Back to home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </header>

      <section className="profile-content">
        <div className="profile-user-card">
          <div className="profile-avatar-container">
            <div className="profile-avatar">
              {isUploadingAvatar ? (
                <span className="profile-avatar-loading" aria-label="Uploading">
                  <span className="profile-avatar-loading-dot" />
                  <span className="profile-avatar-loading-dot" />
                  <span className="profile-avatar-loading-dot" />
                </span>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="profile-avatar-image" />
              ) : (
                usernameLetter
              )}
            </div>
            <button className="profile-avatar-edit-btn" onClick={handleAvatarClick} aria-label="Edit Avatar">
              <Pencil size={14} color="#ffffff" strokeWidth={2.5} />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
            />
          </div>

          <div className="profile-username-container">
            {isEditingUsername ? (
              <div className="profile-username-edit-mode">
                <input
                  type="text"
                  value={editUsernameValue}
                  onChange={(e) => setEditUsernameValue(e.target.value)}
                  className="profile-username-input"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveUsername()
                    if (e.key === 'Escape') handleCancelUsername()
                  }}
                />
                <button className="profile-username-action-btn check-btn" onClick={handleSaveUsername}>
                  <Check size={16} />
                </button>
                <button className="profile-username-action-btn cancel-btn" onClick={handleCancelUsername}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="profile-username-display-mode">
                <h2 className="profile-username">{username}</h2>
                <button className="profile-username-edit-trigger" onClick={handleEditUsernameClick}>
                  <Pencil size={14} />
                </button>
              </div>
            )}
          </div>
          
          <p className="profile-title-text">{playerTitle}</p>
          <p className="profile-email">{email}</p>
        </div>

        <div className="profile-section-separator"></div>

        <div>
          <h3 className="profile-section-title">Battle Record</h3>
          <div className="profile-stats-grid">
            <div className="profile-stat-card">
              <div className="profile-stat-label"><Gamepad2 size={16} color="#FF6B1A" /> Games Played</div>
              <span className="profile-stat-value">
                {loading ? '-' : stats.totalGames}
              </span>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-label"><Trophy size={16} color="#FF6B1A" /> Wins</div>
              <span className="profile-stat-value">
                {loading ? '-' : stats.wins}
              </span>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-label"><Target size={16} color="#FF6B1A" /> Win Rate</div>
              <span className="profile-stat-value">
                {loading ? '-' : `${Math.round(stats.winRate)}%`}
              </span>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-label"><Brain size={16} color="#FF6B1A" /> Avg Guesses</div>
              <span className="profile-stat-value">
                {loading ? '-' : (stats.avgGuesses ? stats.avgGuesses.toFixed(1) : 'N/A')}
              </span>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-label"><Flame size={16} color="#FF6B1A" /> Current Streak</div>
              <span className="profile-stat-value">
                {loading ? '-' : stats.currentStreak}
              </span>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-label"><Award size={16} color="#FF6B1A" /> Longest Streak</div>
              <span className="profile-stat-value">
                {loading ? '-' : stats.longestStreak}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-section-separator"></div>

        <div>
          <div className="profile-actions-card">
            {!isEmailUser ? (
              <p className="profile-managed-note">
                Account managed via Google
              </p>
            ) : (
              <div className="profile-password-actions">
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

      {cropperImageSrc && (
        <AvatarCropperModal
          imageSrc={cropperImageSrc}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
          isSaving={isUploadingAvatar}
        />
      )}

      {isModalOpen && (
        <div className="profile-modal-overlay" onClick={handleCloseModal}>
          <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="profile-modal-title">Change Password</h2>
            
            <form onSubmit={handlePasswordChange} className="profile-modal-form">
              {resetError && <p className="profile-modal-error">{resetError}</p>}
              
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
