import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './RecoveryPage.css'

function RecoveryPage() {
  const { updateUserPassword, setRecoveryMode } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    try {
      await updateUserPassword(password)
      setSuccess(true)
      // Allow user to read success message before closing recovery mode
      setTimeout(() => {
        setRecoveryMode(false)
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main className="recovery-page">
      <div className="recovery-card">
        <h1 className="recovery-title">Set New Password</h1>
        
        {success ? (
          <div className="recovery-success-card">
            <p className="recovery-success-title">
              Password updated successfully!
            </p>
            <p className="recovery-success-text">
              Redirecting...
            </p>
          </div>
        ) : (
          <form className="recovery-form" onSubmit={handleSubmit}>
            <p className="recovery-subtitle">
              Please enter your new password below.
            </p>
            
            {error && <div className="recovery-error">{error}</div>}
            
            <div className="recovery-input-group">
              <label htmlFor="new-password" className="recovery-label">New Password</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="recovery-input"
                required
              />
            </div>

            <div className="recovery-input-group">
              <label htmlFor="confirm-password" className="recovery-label">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="recovery-input"
                required
              />
            </div>

            <button type="submit" className="recovery-button" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

export default RecoveryPage
