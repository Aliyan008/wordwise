import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import UsernameSetupDialog from './components/UsernameSetupDialog.jsx'
import LandingPage from './pages/LandingPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import GamePage from './pages/GamePage.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx'
import FAQPage from './pages/FAQPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import RecoveryPage from './pages/RecoveryPage.jsx'

const VALID_ROUTES = ['landing', 'auth', 'settings', 'game', 'leaderboard', 'faq', 'profile']
const ROUTE_STORAGE_KEY = 'wordwise_route'

function App() {
  const { profile, saveMissingUsername, recoveryMode } = useAuth() || {}
  
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem(ROUTE_STORAGE_KEY)
    if (saved === 'auth') return 'landing' // Never boot directly into the auth page
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
    if (recoveryMode) {
      return <RecoveryPage />
    }

    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={navigateTo} />
      case 'auth':
        return (
          <AuthPage
            onAuthSuccess={() => navigateTo('landing')}
            onBack={() => navigateTo('landing')}
          />
        )
      case 'settings':
        return <SettingsPage onBack={() => navigateTo('landing')} />
      case 'game':
        return <GamePage onBack={() => navigateTo('landing')} />
      case 'leaderboard':
        return <LeaderboardPage onBack={() => navigateTo('landing')} />
      case 'faq':
        return <FAQPage onBack={() => navigateTo('landing')} />
      case 'profile':
        return <ProfilePage onBack={() => navigateTo('landing')} />
      default:
        return <LandingPage onNavigate={navigateTo} />
    }
  }

  return (
    <>
      <UsernameSetupDialog 
        isOpen={profile?.needsUsername === true} 
        onSubmit={saveMissingUsername} 
      />
      {renderPage()}
    </>
  )
}

export default App
