import './WordDisplay.css'

function WordDisplay({ word, guessedLetters }) {
  return (
    <div className="word-display">
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
