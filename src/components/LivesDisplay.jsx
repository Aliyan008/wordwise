import './LivesDisplay.css'

function LivesDisplay({ lives, maxLives }) {
  const isTwoRows = maxLives === 8
  const firstRowCount = isTwoRows ? 4 : maxLives
  const secondRowCount = isTwoRows ? 4 : 0

  return (
    <div className="lives-display">
      <span className="lives-label">Lives:</span>
      <div className={`lives-hearts ${isTwoRows ? 'lives-hearts-two-rows' : ''}`}>
        <div className="lives-hearts-row">
          {Array.from({ length: firstRowCount }).map((_, index) => (
            <span
              key={index}
              className={`heart ${index < lives ? 'heart-full' : 'heart-empty'}`}
            >
              ❤️
            </span>
          ))}
        </div>
        {isTwoRows && (
          <div className="lives-hearts-row">
            {Array.from({ length: secondRowCount }).map((_, index) => (
              <span
                key={firstRowCount + index}
                className={`heart ${firstRowCount + index < lives ? 'heart-full' : 'heart-empty'}`}
              >
                ❤️
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="lives-count">{lives}/{maxLives}</span>
    </div>
  )
}

export default LivesDisplay
