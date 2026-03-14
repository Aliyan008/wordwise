import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import GamePage from './pages/GamePage.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx'

const VALID_ROUTES = ['landing', 'auth', 'settings', 'game', 'leaderboard', 'faq']
const ROUTE_STORAGE_KEY = 'wordwise_route'

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem(ROUTE_STORAGE_KEY)
    return VALID_ROUTES.includes(saved) ? saved : 'landing'
  })

  // Apply dark mode on app load from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    const root = document.documentElement
    if (savedDarkMode) {
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
  }, [])

  const navigateTo = (page) => {
    setCurrentPage(page)
    localStorage.setItem(ROUTE_STORAGE_KEY, page)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={navigateTo} />
      case 'auth':
        return <AuthPage onAuthSuccess={() => navigateTo('landing')} />
      case 'settings':
        return <SettingsPage onBack={() => navigateTo('landing')} />
      case 'game':
        return <GamePage onBack={() => navigateTo('landing')} />
      case 'leaderboard':
        return <LeaderboardPage onBack={() => navigateTo('landing')} />
      case 'faq':
        // FAQ page will be created later
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>FAQ</h1>
            <p>Coming soon...</p>
            <button onClick={() => navigateTo('landing')}>Back to Home</button>
          </div>
        )
      default:
        return <LandingPage onNavigate={navigateTo} />
    }
  }

  return renderPage()
}

export default App
