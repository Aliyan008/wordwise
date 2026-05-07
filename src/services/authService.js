import { supabase } from '../supabaseClient'

export const authService = {
  // Check active session
  getSession: async () => {
    return await supabase.auth.getSession()
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Complete Email / Password Sign Up
  signUp: async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error

    const user = data.user
    if (user) {
      await authService.createProfile(user.id, username)
    }
    return data
  },

  // Email / Password Login
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  // Google OAuth Login
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    })
    if (error) throw error
    return data
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  resetPasswordForEmail: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) throw error
    return data
  },

  updateUserPassword: async (password) => {
    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    return data
  },

  // Profile Methods
  createProfile: async (userId, username) => {
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      username,
    })
    if (error) throw error
  },

  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', userId)
      .single()
    return { data, error }
  }
}
