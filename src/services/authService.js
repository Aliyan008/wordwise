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
      .select('id, username, avatar_url')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Storage Methods
  uploadAvatar: async (userId, file) => {
    // Accept either File or Blob (cropper returns a Blob).
    // Derive extension from File.name when present, otherwise from MIME type.
    let fileExt = 'jpg'
    if (file && typeof file.name === 'string' && file.name.includes('.')) {
      fileExt = file.name.split('.').pop()
    } else if (file && typeof file.type === 'string' && file.type.startsWith('image/')) {
      fileExt = file.type.split('/')[1] || 'jpg'
      if (fileExt === 'jpeg') fileExt = 'jpg'
    }
    const contentType = (file && file.type) || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true, contentType })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    return publicUrl
  },

  // Batch fetch username + avatar_url for many users (used by leaderboard)
  getProfilesByIds: async (userIds) => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return { data: [], error: null }
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds)
    return { data, error }
  }
}
