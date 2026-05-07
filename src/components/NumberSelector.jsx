import './DifficultySelector.css' // Reuse the same CSS for identical layout

function NumberSelector({ value, onChange, min = 1, max = 9 }) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  return (
    <div className="difficulty-selector">
      <button 
        className="difficulty-arrow"
        onClick={handleDecrement}
        aria-label="Decrease value"
        disabled={value <= min}
        style={{ opacity: value <= min ? 0.5 : 1, cursor: value <= min ? 'not-allowed' : 'pointer' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <div className="difficulty-value">{value}</div>
      <button 
        className="difficulty-arrow"
        onClick={handleIncrement}
        aria-label="Increase value"
        disabled={value >= max}
        style={{ opacity: value >= max ? 0.5 : 1, cursor: value >= max ? 'not-allowed' : 'pointer' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  )
}

export default NumberSelector
