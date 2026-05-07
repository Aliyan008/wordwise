import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

const PROFILE_CACHE_KEY = 'wordwise_profile_username'

function getCachedUsername(userId) {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY)
    if (!raw) return null
    const map = JSON.parse(raw)
    return map[userId] ?? null
  } catch {
    return null
  }
}

function setCachedUsername(userId, username) {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY) || '{}'
    const map = JSON.parse(raw)
    map[userId] = username
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)

  // Helper: load profile for a given user id, with 3s timeout
  const loadProfile = async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    console.log('[Auth] loadProfile: start for user id:', userId)

    const timeoutMs = 3000
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ timedOut: true }), timeoutMs),
    )

    const queryPromise = authService.getProfile(userId)

    const result = await Promise.race([queryPromise, timeoutPromise])

    if (result && result.timedOut) {
      console.warn('[Auth] loadProfile: timed out after 3s, falling back to cache if possible')
      setProfile({ id: userId, username: getCachedUsername(userId) || 'player' })
      return
    }

    const { data, error } = result

    if (!error && data) {
      console.log('[Auth] loadProfile: success:', data)
      setCachedUsername(userId, data.username)
      setProfile(data)
    } else {
      console.warn('[Auth] loadProfile: no profile found, setting needsUsername flag.')
      setProfile({ id: userId, needsUsername: true, username: null })
    }
  }

  // Initial session + profile load and subscribe to changes
  useEffect(() => {
    let mounted = true

    const init = async () => {
      console.log('[Auth] init: fetching existing session')
      const { data } = await authService.getSession()
      if (!mounted) return
      setSession(data.session)
      console.log('[Auth] init: session:', data.session)
      const user = data.session?.user
      const userId = user?.id ?? null
      
      const cachedUsername = getCachedUsername(userId)
      if (userId && cachedUsername) {
        setProfile({ id: userId, username: cachedUsername })
      }
      await loadProfile(userId)
      if (!mounted) return
      setLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, newSession) => {
      console.log('[Auth] onAuthStateChange:', event, newSession)
      
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
      }
      
      setSession(newSession)
      const user = newSession?.user
      const userId = user?.id ?? null
      const cachedUsername = getCachedUsername(userId)
      if (userId && cachedUsername) {
        setProfile({ id: userId, username: cachedUsername })
      }
      if (userId) {
        await loadProfile(userId)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async ({ email, password, username }) => {
    try {
      const data = await authService.signUp(email, password, username)
      if (data.user) {
        await loadProfile(data.user.id)
      }
      return data
    } catch (err) {
      console.error('Error during signUp:', err)
      throw err
    }
  }

  const signIn = async ({ email, password }) => {
    try {
      const data = await authService.signIn(email, password)
      if (data.user) {
        loadProfile(data.user.id) // background load
      }
      return data
    } catch (err) {
      console.error('Error during signIn:', err)
      throw err
    }
  }

  const signInWithGoogle = async () => {
    try {
      return await authService.signInWithGoogle()
    } catch (err) {
      console.error('Error during Google sign-in:', err)
      throw err
    }
  }

  const signOut = async () => {
    await authService.signOut()
    setSession(null)
    setProfile(null)
  }

  const resetPasswordForEmail = async (email) => {
    return await authService.resetPasswordForEmail(email)
  }

  const updateUserPassword = async (password) => {
    return await authService.updateUserPassword(password)
  }

  const saveMissingUsername = async (username) => {
    if (!session?.user?.id) throw new Error("No authenticated user")
    await authService.createProfile(session.user.id, username)
    await loadProfile(session.user.id)
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    recoveryMode,
    setRecoveryMode,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPasswordForEmail,
    updateUserPassword,
    saveMissingUsername,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
