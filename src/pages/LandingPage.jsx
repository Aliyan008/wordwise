import './LandingPage.css'
import WordLogo from '../components/WordLogo'
import CustomDialog from '../components/CustomDialog'
import CustomButton from '../components/CustomButton'
import { useAuth } from '../context/AuthContext.jsx'
import { useState } from 'react'

const FLOATING_LETTERS = [
  { letter: 'W', className: 'landing-deco--tl' },
  { letter: 'E', className: 'landing-deco--tc' },
  { letter: 'R', className: 'landing-deco--tr' },
  { letter: 'D', className: 'landing-deco--ml' },
  { letter: 'S', className: 'landing-deco--mr' },
  { letter: 'A', className: 'landing-deco--bl' },
  { letter: 'L', className: 'landing-deco--br' },
]

function LandingPage({ onNavigate }) {
  const { profile, signOut } = useAuth() || {}
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const usernameLetter = profile?.username?.[0]?.toUpperCase() || '?'
  const avatarUrl = profile?.avatar_url || null

  const handleAvatarClick = () => {
    setIsMenuOpen((open) => !open)
  }

  const handleLogoutClick = () => {
    setIsMenuOpen(false)
    setIsLogoutConfirmOpen(true)
  }

  const handleCancelLogout = () => {
    if (isLoggingOut) return
    setIsLogoutConfirmOpen(false)
  }

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut?.()
    } finally {
      setIsLoggingOut(false)
      setIsLogoutConfirmOpen(false)
      onNavigate?.('landing')
    }
  }

  return (
    <main className="landing">
      <div className="landing-bg-dots" aria-hidden />
      {FLOATING_LETTERS.map(({ letter, className }) => (
        <div key={letter} className={`landing-deco ${className}`} aria-hidden>
          {letter}
        </div>
      ))}

      <div className="landing-avatar-corner">
        {!profile && (
          <button
            type="button"
            className="landing-auth-button"
            onClick={() => onNavigate?.('auth')}
          >
            Log in / Sign up
          </button>
        )}
        {profile && (
          <div className="landing-avatar-wrapper">
            <button
              type="button"
              className="landing-avatar"
              onClick={handleAvatarClick}
              aria-label="User menu"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="landing-avatar-image" />
              ) : (
                <span>{usernameLetter}</span>
              )}
            </button>
            {isMenuOpen && (
              <div className="landing-avatar-menu">
                <button
                  type="button"
                  className="landing-avatar-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false)
                    onNavigate?.('profile')
                  }}
                >
                  Profile
                </button>
                <button
                  type="button"
                  className="landing-avatar-menu-item landing-avatar-menu-item-danger"
                  onClick={handleLogoutClick}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="landing-content">
        <WordLogo />

        <p className="landing-tagline">A word game for kids who love words</p>

        <div className="landing-sample-tiles">
          <div className="landing-sample-tile landing-sample-tile-w">W</div>
          <div className="landing-sample-tile landing-sample-tile-o">O</div>
          <div className="landing-sample-tile landing-sample-tile-r">R</div>
          <div className="landing-sample-tile landing-sample-tile-d">D</div>
        </div>

        <div className="landing-actions">
          <button type="button" className="landing-btn-play" onClick={() => onNavigate?.('game')}>
            ▶ Play
          </button>

          <div className="landing-btn-row">
            <button
              type="button"
              className="landing-btn-secondary"
              onClick={() => onNavigate?.('leaderboard')}
            >
              <span className="material-symbols-outlined" aria-hidden>military_tech</span>
              Leaderboard
            </button>
            <button
              type="button"
              className="landing-btn-secondary"
              onClick={() => onNavigate?.('settings')}
            >
              <span className="material-symbols-outlined" aria-hidden>settings</span>
              Settings
            </button>
          </div>

          <button type="button" className="landing-faq-link" onClick={() => onNavigate?.('faq')}>
            FAQ
          </button>
        </div>

        <p className="landing-caption">Made for kids who love words.</p>
      </div>

      <CustomDialog isOpen={isLogoutConfirmOpen} title="Log out?">
        <p className="landing-logout-desc">
          You&apos;ll need to sign in again to access your profile and stats.
        </p>
        <div className="landing-logout-actions">
          <CustomButton
            variant="secondary"
            onClick={handleCancelLogout}
            disabled={isLoggingOut}
          >
            Cancel
          </CustomButton>
          <button
            type="button"
            className="landing-logout-confirm-btn"
            onClick={handleConfirmLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Logging out…' : 'Log Out'}
          </button>
        </div>
      </CustomDialog>
    </main>
  )
}

export default LandingPage



