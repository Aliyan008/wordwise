import { useState, useEffect } from 'react'
import './SettingsPage.css'
import DifficultySelector from '../components/DifficultySelector'
import ReadOnlyField from '../components/ReadOnlyField'
import Toggle from '../components/Toggle'

function SettingsPage({ onBack }) {
  const [difficulty, setDifficulty] = useState(() => {
    return localStorage.getItem('difficulty') || 'Normal'
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
      root.style.setProperty('--color-background', '#1a1a1a')
      root.style.setProperty('--color-surface', '#2d2d2d')
      root.style.setProperty('--color-text-primary', '#f1f5f9')
      root.style.setProperty('--color-text-secondary', '#94a3b8')
      root.style.setProperty('--color-border-light', '#404040')
    } else {
      root.style.setProperty('--color-background', '#f8fafc')
      root.style.setProperty('--color-surface', '#ffffff')
      root.style.setProperty('--color-text-primary', '#0f172a')
      root.style.setProperty('--color-text-secondary', '#475569')
      root.style.setProperty('--color-border-light', '#e2e8f0')
    }
  }

  // Save difficulty to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('difficulty', difficulty)
  }, [difficulty])

  // Apply theme on mount and when darkMode changes
  useEffect(() => {
    applyDarkMode(darkMode)
    localStorage.setItem('darkMode', darkMode.toString())
  }, [darkMode])

  const getLivesForDifficulty = (diff) => {
    switch (diff) {
      case 'Easy':
        return 6
      case 'Normal':
        return 6
      case 'Hard':
        return 5
      case "you ain't that tuff 🥀":
        return 5
      default:
        return 6
    }
  }

  return (
    <main className="settings">
      <section className="settings-card">
        <header className="settings-header">
          <button className="settings-back-button" onClick={onBack} aria-label="Back to home">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="settings-title">Settings</h1>
        </header>

        <section className="settings-content">
          <div className="settings-section">
            <h2 className="settings-section-title">Game Preferences</h2>
            
            <div className="settings-item">
              <label className="settings-label">Difficulty</label>
              <div className="settings-control">
                <DifficultySelector 
                  value={difficulty} 
                  onChange={setDifficulty}
                />
              </div>
            </div>

            <div className="settings-item">
              <ReadOnlyField 
                label="Number of Lives"
                value={getLivesForDifficulty(difficulty)}
              />
            </div>
          </div>

          <div className="settings-section">
            <h2 className="settings-section-title">Appearance</h2>
            
            <div className="settings-item">
              <Toggle
                checked={darkMode}
                onChange={setDarkMode}
                label="Dark Mode"
              />
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default SettingsPage
