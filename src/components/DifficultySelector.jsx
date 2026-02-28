import './DifficultySelector.css'

function DifficultySelector({ value, onChange }) {
  const difficulties = ['Easy', 'Normal', 'Hard', "you ain't that tuff 🥀"]
  const currentIndex = difficulties.indexOf(value)

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : difficulties.length - 1
    onChange(difficulties[newIndex])
  }

  const handleNext = () => {
    const newIndex = currentIndex < difficulties.length - 1 ? currentIndex + 1 : 0
    onChange(difficulties[newIndex])
  }

  return (
    <div className="difficulty-selector">
      <button 
        className="difficulty-arrow difficulty-arrow-left"
        onClick={handlePrevious}
        aria-label="Previous difficulty"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 4.2 Q12.1 4 11.8 4.3 L5.8 9.8 Q5.5 10 5.8 10.2 L11.8 15.7 Q12.1 16 12.5 15.8 Q12.9 15.6 13 15.2 L13 4.8 Q13 4.4 12.5 4.2 Z" fill="currentColor"/>
        </svg>
      </button>
      <div className="difficulty-value">{value}</div>
      <button 
        className="difficulty-arrow difficulty-arrow-right"
        onClick={handleNext}
        aria-label="Next difficulty"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.5 4.2 Q7.1 4 6.8 4.3 L6.8 4.3 Q6.5 4.6 6.5 5 L6.5 15 Q6.5 15.4 6.8 15.7 L6.8 15.7 Q7.1 16 7.5 15.8 Q7.9 15.6 8 15.2 L14.2 10.2 Q14.5 10 14.2 9.8 L8 4.8 Q7.9 4.4 7.5 4.2 Z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  )
}

export default DifficultySelector
