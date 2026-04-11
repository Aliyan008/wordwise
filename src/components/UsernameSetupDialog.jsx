import { useState } from 'react'
import CustomDialog from './CustomDialog'
import CustomButton from './CustomButton'
import './UsernameSetupDialog.css'

function UsernameSetupDialog({ isOpen, onSubmit }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = username.trim()
    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      await onSubmit(trimmed)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomDialog isOpen={isOpen} title="Welcome to WordWise!">
      <p className="username-dialog-desc">
        Before you start playing, pick a fun username that your friends will see!
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="text"
          className="username-dialog-input"
          placeholder="Enter a username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isSubmitting}
          autoFocus
        />
        {error && <p className="username-dialog-error">{error}</p>}
        <CustomButton
          type="submit"
          variant="primary"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Start Playing'}
        </CustomButton>
      </form>
    </CustomDialog>
  )
}

export default UsernameSetupDialog
