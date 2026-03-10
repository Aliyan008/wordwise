import { useState } from 'react'
import './AuthPage.css'
import CustomButton from '../components/CustomButton'
import { useAuth } from '../context/AuthContext.jsx'

function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const { signIn, signUp } = useAuth()
  const [form, setForm] = useState({
    loginEmail: '',
    loginPassword: '',
    signupUsername: '',
    signupEmail: '',
    signupPassword: '',
    signupConfirm: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn({
        email: form.loginEmail,
        password: form.loginPassword,
      })
      onAuthSuccess?.()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignupSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.signupPassword !== form.signupConfirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await signUp({
        email: form.signupEmail,
        password: form.signupPassword,
        username: form.signupUsername,
      })
      onAuthSuccess?.()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card-title">Welcome</h1>

        <div className="auth-toggle-row">
          <button
            type="button"
            className={`auth-toggle-tab ${mode === 'login' ? 'auth-toggle-tab-active' : ''}`}
            onClick={() => setMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            className={`auth-toggle-tab ${mode === 'signup' ? 'auth-toggle-tab-active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <div className="auth-forms-wrapper">
          <div className={`auth-forms-track ${mode === 'signup' ? 'auth-forms-track-signup' : ''}`}>
            <section className="auth-form-pane" aria-label="Log in">
              <form className="auth-form" onSubmit={handleLoginSubmit}>
                <label className="auth-label" htmlFor="auth-email-login">Email</label>
                <input
                  id="auth-email-login"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={form.loginEmail}
                  onChange={handleChange('loginEmail')}
                />
                <label className="auth-label" htmlFor="auth-password-login">Password</label>
                <input
                  id="auth-password-login"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={form.loginPassword}
                  onChange={handleChange('loginPassword')}
                />
                <CustomButton
                  type="submit"
                  variant="primary"
                  fullWidth
                  className="auth-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Logging in…' : 'Log in'}
                </CustomButton>

                <div className="auth-divider">
                  <span className="auth-divider-line" />
                  <span className="auth-divider-label">OR</span>
                  <span className="auth-divider-line" />
                </div>

                <button type="button" className="auth-google-btn">
                  <span className="auth-google-icon" aria-hidden="true">
                    <svg
                      className="auth-google-svg"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.3 13.02 17.66 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.14-3.08-.39-4.55H24v9.02h12.94c-.56 2.91-2.24 5.38-4.76 7.04l7.44 5.78C43.98 37.54 46.98 31.6 46.98 24.55z" />
                      <path fill="#FBBC05" d="M10.54 28.42A14.48 14.48 0 0 1 9.75 24c0-1.53.27-3.01.76-4.42l-7.95-6.21A23.89 23.89 0 0 0 0 24c0 3.83.92 7.44 2.56 10.62l7.98-6.2z" />
                      <path fill="#34A853" d="M24 47.5c6.48 0 11.93-2.13 15.9-5.8l-7.44-5.78C30.54 37.42 27.53 38.5 24 38.5c-6.34 0-11.7-3.52-14.46-8.7l-7.98 6.2C6.51 42.62 14.62 47.5 24 47.5z" />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  </span>
                  <span className="auth-google-text">Continue with Google</span>
                </button>
              </form>
              <p className="auth-switch-text">
                New here?{' '}
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => setMode('signup')}
                >
                  Create an account
                </button>
              </p>
            </section>

            <section className="auth-form-pane" aria-label="Sign up">
              <form className="auth-form" onSubmit={handleSignupSubmit}>
                <label className="auth-label" htmlFor="auth-username-signup">Username</label>
                <input
                  id="auth-username-signup"
                  type="text"
                  className="auth-input"
                  placeholder="Pick a fun name"
                  autoComplete="nickname"
                  value={form.signupUsername}
                  onChange={handleChange('signupUsername')}
                />
                <label className="auth-label" htmlFor="auth-email-signup">Email</label>
                <input
                  id="auth-email-signup"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={form.signupEmail}
                  onChange={handleChange('signupEmail')}
                />
                <label className="auth-label" htmlFor="auth-password-signup">Password</label>
                <input
                  id="auth-password-signup"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={form.signupPassword}
                  onChange={handleChange('signupPassword')}
                />
                <label className="auth-label" htmlFor="auth-password-confirm">Confirm password</label>
                <input
                  id="auth-password-confirm"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={form.signupConfirm}
                  onChange={handleChange('signupConfirm')}
                />
                {error === 'Passwords do not match.' && (
                  <p className="auth-error-inline">Passwords do not match.</p>
                )}
                <CustomButton
                  type="submit"
                  variant="primary"
                  fullWidth
                  className="auth-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Signing up…' : 'Sign up'}
                </CustomButton>

                <div className="auth-divider">
                  <span className="auth-divider-line" />
                  <span className="auth-divider-label">OR</span>
                  <span className="auth-divider-line" />
                </div>

                <button type="button" className="auth-google-btn">
                  <span className="auth-google-icon" aria-hidden="true">
                    <svg
                      className="auth-google-svg"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.3 13.02 17.66 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.14-3.08-.39-4.55H24v9.02h12.94c-.56 2.91-2.24 5.38-4.76 7.04l7.44 5.78C43.98 37.54 46.98 31.6 46.98 24.55z" />
                      <path fill="#FBBC05" d="M10.54 28.42A14.48 14.48 0 0 1 9.75 24c0-1.53.27-3.01.76-4.42l-7.95-6.21A23.89 23.89 0 0 0 0 24c0 3.83.92 7.44 2.56 10.62l7.98-6.2z" />
                      <path fill="#34A853" d="M24 47.5c6.48 0 11.93-2.13 15.9-5.8l-7.44-5.78C30.54 37.42 27.53 38.5 24 38.5c-6.34 0-11.7-3.52-14.46-8.7l-7.98 6.2C6.51 42.62 14.62 47.5 24 47.5z" />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  </span>
                  <span className="auth-google-text">Sign up with Google</span>
                </button>
              </form>
              <p className="auth-switch-text">
                Already have an account?{' '}
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => setMode('login')}
                >
                  Log in
                </button>
              </p>
            </section>
          </div>
        </div>
      </div>
      {error && error !== 'Passwords do not match.' && (
        <p className="auth-error">{error}</p>
      )}
    </main>
  )
}

export default AuthPage
