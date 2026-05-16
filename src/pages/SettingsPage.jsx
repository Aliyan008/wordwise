import { useState, useEffect, useRef } from 'react'
import './SettingsPage.css'
import DifficultySelector from '../components/DifficultySelector'
import NumberSelector from '../components/NumberSelector'
import Toggle from '../components/Toggle'

const CHEAT_MESSAGES = [
  "We don't judge. (We judge a little.)",
  "Sir this is a kids game and you're still struggling?",
  "The word isn't even that hard....",
  "Bumping up the lives? I'll pretend I didn't see that.",
  "Training wheels detected. 🍼",
  "More lives? Someone's not feeling confident today."
]

const BRAVE_MESSAGES = [
  "Ah yes, suffering. A classic choice.",
  "Oh we got a MENACE over here.",
  "Your future self will not forgive you for this.",
  "Look out, we've got a tough guy over here.",
  "This isn't bravery. This is a cry for help.",
  "You are NOT built for this."
]

const getDefaultLives = (diff) => {
  if (diff === "you ain't that tuff 🥀") return 4
  if (diff === 'Hard') return 5
  return 6
}

function SettingsPage({ onBack }) {
  const [difficulty, setDifficulty] = useState(() => {
    return localStorage.getItem('difficulty') || 'Normal'
  })

  const [lives, setLives] = useState(() => {
    const saved = parseInt(localStorage.getItem('lives'), 10)
    const initDifficulty = localStorage.getItem('difficulty') || 'Normal'
    if (isNaN(saved) || saved < 3 || saved > 6) return getDefaultLives(initDifficulty)
    return saved
  })

  // Load dark mode from localStorage on mount
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved === 'true'
  })

  // Apply dark mode theme
  const applyDarkMode = (isDark) => {
    const root = document.documentElement
    if (isDark) {
      root.style.setProperty('--color-background', '#0e1225')
      root.style.setProperty('--color-surface', '#1b1f31')
      root.style.setProperty('--color-text-primary', '#dee1fb')
      root.style.setProperty('--color-text-secondary', '#e0c0b1')
      root.style.setProperty('--color-border-light', 'rgba(255,255,255,0.08)')
      document.documentElement.removeAttribute('data-theme')
    } else {
      root.style.setProperty('--color-background', '#f8fafc')
      root.style.setProperty('--color-surface', '#ffffff')
      root.style.setProperty('--color-text-primary', '#0f172a')
      root.style.setProperty('--color-text-secondary', '#475569')
      root.style.setProperty('--color-border-light', '#e2e8f0')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }



  const handleDifficultyChange = (newDiff) => {
    setDifficulty(newDiff)
    setLives(getDefaultLives(newDiff))
  }

  // Save difficulty to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('difficulty', difficulty)
  }, [difficulty])

  // Save lives to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('lives', lives.toString())
  }, [lives])

  // Apply theme on mount and when darkMode changes
  useEffect(() => {
    applyDarkMode(darkMode)
    localStorage.setItem('darkMode', darkMode.toString())
  }, [darkMode])

  const [livesMessage, setLivesMessage] = useState("")
  const lastMessageIdxRef = useRef(-1)

  useEffect(() => {
    const defaultL = getDefaultLives(difficulty)
    if (lives > defaultL) {
      let idx
      do {
        idx = Math.floor(Math.random() * CHEAT_MESSAGES.length)
      } while (idx === lastMessageIdxRef.current && CHEAT_MESSAGES.length > 1)
      lastMessageIdxRef.current = idx
      setLivesMessage(CHEAT_MESSAGES[idx])
    } else if (lives < defaultL) {
      let idx
      do {
        idx = Math.floor(Math.random() * BRAVE_MESSAGES.length)
      } while (idx === lastMessageIdxRef.current && BRAVE_MESSAGES.length > 1)
      lastMessageIdxRef.current = idx
      setLivesMessage(BRAVE_MESSAGES[idx])
    } else {
      setLivesMessage("")
      lastMessageIdxRef.current = -1
    }
  }, [lives, difficulty])

  return (
    <main className="settings">
      <section className="settings-card">
        <header className="settings-header">
          <button className="settings-back-button" onClick={onBack} aria-label="Back to home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="settings-title">Settings</h1>
        </header>

        <section className="settings-content">
          <div className="settings-section">
            <div className="settings-section-card">
              <div className="settings-card-header">
                <h2 className="settings-section-title">GAME PREFERENCES</h2>
              </div>
              <div className="settings-item settings-item-stacked">
                <label className="settings-label">Difficulty</label>
                <div className="settings-control">
                  <DifficultySelector
                    value={difficulty}
                    onChange={handleDifficultyChange}
                  />
                </div>
              </div>

              <div className="settings-item settings-item-stacked settings-item-last">
                <label className="settings-label">Number of lives</label>
                <div className="settings-control">
                  <NumberSelector
                    value={lives}
                    onChange={setLives}
                    min={3}
                    max={6}
                  />
                </div>
                {lives > getDefaultLives(difficulty) && (
                  <p className="settings-lives-message settings-lives-cheat">
                    {livesMessage}
                  </p>
                )}
                {lives < getDefaultLives(difficulty) && (
                  <p className="settings-lives-message settings-lives-brave">
                    {livesMessage}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-card">
              <div className="settings-card-header">
                <h2 className="settings-section-title">APPEARANCE</h2>
              </div>
              <div className="settings-item">
                <label className="settings-label">Dark Mode</label>
                <div className="settings-control">
                  <Toggle
                    checked={darkMode}
                    onChange={setDarkMode}
                    id="dark-mode-toggle"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default SettingsPage
