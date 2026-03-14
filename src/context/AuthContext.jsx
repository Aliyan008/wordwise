import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

const PROFILE_CACHE_KEY = 'wordwise_profile_username'

// First continuous alphabetic part of string (e.g. "faiz.khan" → "faiz", "faiz123" → "faiz")
function firstAlphabeticPart(str) {
  const match = (str || '').match(/^[a-zA-Z]+/)
  return match ? match[0] : ''
}

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

  // Helper: load profile for a given user id, with 3s timeout + email fallback
  const loadProfile = async (userId, emailForFallback) => {
    if (!userId) {
      setProfile(null)
      return
    }
    console.log('[Auth] loadProfile: start for user id:', userId)

    const timeoutMs = 3000
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ timedOut: true }), timeoutMs),
    )

    const queryPromise = supabase
      .from('profiles')
      .select('id, username')
      .eq('id', userId)
      .single()

    const result = await Promise.race([queryPromise, timeoutPromise])

    const getFallbackUsername = () => {
      const cached = getCachedUsername(userId)
      if (cached) return cached
      const localPart = emailForFallback ? emailForFallback.split('@')[0] || '' : ''
      return firstAlphabeticPart(localPart) || 'player'
    }

    if (result && result.timedOut) {
      console.warn('[Auth] loadProfile: timed out after 3s, using email fallback')
      setProfile({ id: userId, username: getFallbackUsername() })
      return
    }

    const { data, error } = result

    if (!error && data) {
      console.log('[Auth] loadProfile: success:', data)
      setCachedUsername(userId, data.username)
      setProfile(data)
    } else {
      console.warn('[Auth] loadProfile: no profile or error, using email fallback:', error)
      setProfile({ id: userId, username: getFallbackUsername() })
    }
  }

  // Initial session + profile load and subscribe to changes
  useEffect(() => {
    let mounted = true

    const init = async () => {
      console.log('[Auth] init: fetching existing session')
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)
      console.log('[Auth] init: session:', data.session)
      const user = data.session?.user
      const userId = user?.id ?? null
      // Show cached username immediately so avatar shows correct initial (e.g. F for faiz) while profile loads
      const cachedUsername = getCachedUsername(userId)
      if (userId && cachedUsername) {
        setProfile({ id: userId, username: cachedUsername })
      }
      await loadProfile(userId, user?.email ?? null)
      if (!mounted) return
      setLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[Auth] onAuthStateChange:', event, newSession)
      setSession(newSession)
      const user = newSession?.user
      const userId = user?.id ?? null
      const cachedUsername = getCachedUsername(userId)
      if (userId && cachedUsername) {
        setProfile({ id: userId, username: cachedUsername })
      }
      await loadProfile(userId, user?.email ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async ({ email, password, username }) => {
    try {
      console.log('[Auth] signUp: start for email:', email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      console.log('[Auth] signUp: response from Supabase:', { data, error })
      if (error) throw error

      const user = data.user
      if (user) {
        console.log('[Auth] signUp: inserting profile for user id:', user.id)
        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          username,
        })
        if (profileError) {
          console.error('Error inserting profile:', profileError)
          throw profileError
        }
        console.log('[Auth] signUp: profile insert success, loading profile')
        await loadProfile(user.id, user.email)
      }

      console.log('[Auth] signUp: complete, returning data')
      return data
    } catch (err) {
      console.error('Error during signUp:', err)
      throw err
    }
  }

  const signIn = async ({ email, password }) => {
    try {
      console.log('[Auth] signIn: start for email:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      console.log('[Auth] signIn: response from Supabase:', { data, error })
      if (error) throw error

      const user = data.user
      if (user) {
        console.log('[Auth] signIn: scheduling background profile load for user id:', user.id)
        // Fire-and-forget profile load; do not block navigation
        loadProfile(user.id, user.email)
      }

      console.log('[Auth] signIn: complete, returning data')
      return data
    } catch (err) {
      console.error('Error during signIn:', err)
      throw err
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

