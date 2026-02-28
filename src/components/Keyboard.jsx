import './Keyboard.css'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function Keyboard({ onLetterClick, guessedLetters, correctLetters, wrongLetters }) {
  const handleClick = (letter, event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!guessedLetters.includes(letter)) {
      onLetterClick(letter)
    }
  }

  const getLetterState = (letter) => {
    if (correctLetters.includes(letter)) return 'correct'
    if (wrongLetters.includes(letter)) return 'wrong'
    if (guessedLetters.includes(letter)) return 'disabled'
    return 'default'
  }

  return (
    <div className="keyboard">
      {LETTERS.map((letter) => {
        const state = getLetterState(letter)
        return (
          <button
            key={letter}
            data-key={letter}
            className={`keyboard-key keyboard-key-${state}`}
            onClick={(e) => handleClick(letter, e)}
            disabled={guessedLetters.includes(letter)}
          >
            {letter}
          </button>
        )
      })}
    </div>
  )
}

export default Keyboard
