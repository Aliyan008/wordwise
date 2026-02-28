import './Toggle.css'

function Toggle({ checked, onChange, label, id, ...props }) {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="toggle-wrapper">
      {label && (
        <label htmlFor={toggleId} className="toggle-label">
          {label}
        </label>
      )}
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle ${checked ? 'toggle-checked' : ''}`}
        onClick={() => onChange(!checked)}
        {...props}
      >
        <span className="toggle-slider">
          <span className="toggle-knob"></span>
        </span>
      </button>
    </div>
  )
}

export default Toggle
