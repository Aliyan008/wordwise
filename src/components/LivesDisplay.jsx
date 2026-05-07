import './LivesDisplay.css'

function LivesDisplay({ lives, maxLives }) {
  const isTwoRows = maxLives === 8
  const firstRowCount = isTwoRows ? 4 : maxLives
  const secondRowCount = isTwoRows ? 4 : 0

  return (
    <div className="lives-display">
      <span className="lives-label">Lives:</span>
      <div className="lives-hearts">
        {Array.from({ length: maxLives }).map((_, index) => (
          <span
            key={index}
            className={`heart ${index < lives ? 'heart-full' : 'heart-empty'}`}
          >
            {index < lives ? '❤️' : '🤍'}
          </span>
        ))}
      </div>
      <span className="lives-count">{lives}/{maxLives}</span>
    </div>
  )
}

export default LivesDisplay
