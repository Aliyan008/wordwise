import './LandingPage.css'
import CustomButton from '../components/CustomButton'
import { useAuth } from '../context/AuthContext.jsx'
import { useState } from 'react'

function LandingPage({ onNavigate }) {
  const { profile, signOut } = useAuth() || {}
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const usernameLetter = profile?.username?.[0]?.toUpperCase() || '?'

  const handleAvatarClick = () => {
    setIsMenuOpen((open) => !open)
  }

  const handleLogout = async () => {
    setIsMenuOpen(false)
    try {
      await signOut?.()
    } finally {
      onNavigate?.('landing')
    }
  }

  return (
    <main className="landing">
      <div className="landing-top-bar">
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
              <span>{usernameLetter}</span>
            </button>
            {isMenuOpen && (
              <div className="landing-avatar-menu">
                <button
                  type="button"
                  className="landing-avatar-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false)
                    onNavigate?.('settings')
                  }}
                >
                  Profile
                </button>
                <button
                  type="button"
                  className="landing-avatar-menu-item landing-avatar-menu-item-danger"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <section className="landing-card">
        <header className="landing-header">
          <div className="title-group">
            <h1 className="app-title">
              <span className="title-tile">W</span>
              <span className="title-text">ord</span>
              <span className="title-tile">W</span>
              <span className="title-text">ise</span>
            </h1>
          </div>
        </header>

        <section className="landing-main">
          <div className="actions">
            <CustomButton 
              variant="primary" 
              fullWidth
              onClick={() => onNavigate?.('game')}
            >
              Play
            </CustomButton>

            <div className="button-pair">
              <CustomButton 
                variant="primary"
                onClick={() => onNavigate?.('leaderboard')}
              >
                Leaderboard
              </CustomButton>
              <CustomButton 
                variant="primary"
                onClick={() => onNavigate?.('settings')}
              >
                Settings
              </CustomButton>
            </div>

            <CustomButton 
              variant="ghost" 
              fullWidth
              onClick={() => onNavigate?.('faq')}
            >
              FAQ
            </CustomButton>
          </div>
        </section>

        <section className="landing-preview">
          <div className="preview-tiles">
            <div className="preview-tile">W</div>
            <div className="preview-tile">O</div>
            <div className="preview-tile preview-tile-correct">R</div>
            <div className="preview-tile">D</div>
          </div>
          <p className="landing-footer-text">Made for kids who love words.</p>
        </section>
      </section>
    </main>
  )
}

export default LandingPage

