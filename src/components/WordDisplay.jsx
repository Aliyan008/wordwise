import './WordDisplay.css'

function WordDisplay({ word, guessedLetters }) {
  const length = word?.length || 0
  const maxTilesBeforeShrink = 10
  const scale =
    length > maxTilesBeforeShrink
      ? Math.max(0.75, maxTilesBeforeShrink / length)
      : 1

  return (
    <div className="word-display" style={{ '--word-scale': scale }}>
      {word.split('').map((letter, index) => {
        const isRevealed = guessedLetters.includes(letter.toUpperCase())
        return (
          <div
            key={index}
            className={`word-tile ${isRevealed ? 'word-tile-revealed' : 'word-tile-hidden'}`}
          >
            {isRevealed ? letter.toUpperCase() : ''}
          </div>
        )
      })}
    </div>
  )
}

export default WordDisplay
