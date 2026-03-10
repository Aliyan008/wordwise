import { useState, useEffect } from 'react'
import './GamePage.css'
import WordDisplay from '../components/WordDisplay'
import Keyboard from '../components/Keyboard'
import LivesDisplay from '../components/LivesDisplay'
import GameOverModal from '../components/GameOverModal'

// Word list organized by difficulty with categories
const WORDS_BY_DIFFICULTY = {
  Easy: [
    { word: 'APPLE', category: 'Fruit' },
    { word: 'LION', category: 'Animal' },
    { word: 'SUN', category: 'Nature' },
    { word: 'CAR', category: 'Vehicle' },
    { word: 'MOON', category: 'Nature' },
    { word: 'STAR', category: 'Nature' },
    { word: 'CAT', category: 'Animal' },
    { word: 'DOG', category: 'Animal' },
    { word: 'BIRD', category: 'Animal' },
    { word: 'FISH', category: 'Animal' },
    { word: 'TREE', category: 'Nature' },
    { word: 'ROSE', category: 'Flower' },
    { word: 'BOOK', category: 'Object' },
    { word: 'BALL', category: 'Object' },
    { word: 'CAKE', category: 'Food' },
    { word: 'MILK', category: 'Food' },
    { word: 'SHOE', category: 'Clothing' },
    { word: 'HAT', category: 'Clothing' },
    { word: 'BED', category: 'Furniture' },
    { word: 'CHAIR', category: 'Furniture' }
  ],
  Normal: [
    { word: 'BANANA', category: 'Fruit' },
    { word: 'ORANGE', category: 'Fruit' },
    { word: 'TIGER', category: 'Animal' },
    { word: 'MONKEY', category: 'Animal' },
    { word: 'PANDA', category: 'Animal' },
    { word: 'HOUSE', category: 'Building' },
    { word: 'TRAIN', category: 'Vehicle' },
    { word: 'PLANE', category: 'Vehicle' },
    { word: 'EARTH', category: 'Nature' },
    { word: 'OCEAN', category: 'Nature' },
    { word: 'RIVER', category: 'Nature' },
    { word: 'MOUNTAIN', category: 'Nature' },
    { word: 'SCHOOL', category: 'Building' },
    { word: 'GARDEN', category: 'Place' },
    { word: 'WINDOW', category: 'Object' },
    { word: 'PENCIL', category: 'Object' },
    { word: 'COOKIE', category: 'Food' },
    { word: 'PIZZA', category: 'Food' },
    { word: 'JACKET', category: 'Clothing' },
    { word: 'TABLE', category: 'Furniture' }
  ],
  Hard: [
    { word: 'ELEPHANT', category: 'Animal' },
    { word: 'BICYCLE', category: 'Vehicle' },
    { word: 'AIRPLANE', category: 'Vehicle' },
    { word: 'COMPUTER', category: 'Technology' },
    { word: 'TELEPHONE', category: 'Technology' },
    { word: 'BUTTERFLY', category: 'Animal' },
    { word: 'CHOCOLATE', category: 'Food' },
    { word: 'ELEVATOR', category: 'Building' },
    { word: 'LIBRARY', category: 'Building' },
    { word: 'HOSPITAL', category: 'Building' },
    { word: 'UNIVERSITY', category: 'Building' },
    { word: 'ADVENTURE', category: 'Concept' },
    { word: 'DISCOVERY', category: 'Concept' },
    { word: 'JOURNEY', category: 'Concept' },
    { word: 'MYSTERY', category: 'Concept' },
    { word: 'SUNSHINE', category: 'Nature' },
    { word: 'RAINBOW', category: 'Nature' },
    { word: 'THUNDER', category: 'Nature' },
    { word: 'VOLCANO', category: 'Nature' },
    { word: 'TELESCOPE', category: 'Technology' }
  ],
  "you ain't that tuff 🥀": [
    { word: 'CHALLENGE', category: 'Concept' },
    { word: 'DIFFICULTY', category: 'Concept' },
    { word: 'EXTRAORDINARY', category: 'Concept' },
    { word: 'IMAGINATION', category: 'Concept' },
    { word: 'KNOWLEDGE', category: 'Concept' },
    { word: 'PHILOSOPHY', category: 'Concept' },
    { word: 'REVOLUTION', category: 'Concept' },
    { word: 'SYMPHONY', category: 'Music' },
    { word: 'ARCHITECTURE', category: 'Building' },
    { word: 'CIVILIZATION', category: 'Concept' },
    { word: 'EXPERIENCE', category: 'Concept' },
    { word: 'FOUNDATION', category: 'Concept' },
    { word: 'GENERATION', category: 'Concept' },
    { word: 'HISTORY', category: 'Subject' },
    { word: 'INSPIRATION', category: 'Concept' },
    { word: 'JOURNEY', category: 'Concept' },
    { word: 'LANDSCAPE', category: 'Nature' },
    { word: 'MAGNIFICENT', category: 'Concept' },
    { word: 'NATURAL', category: 'Concept' },
    { word: 'OPPORTUNITY', category: 'Concept' }
  ]
}

const getLivesForDifficulty = (diff) => {
  switch (diff) {
    case 'Easy':
      return 4
    case 'Normal':
      return 6
    case 'Hard':
      return 8
    case "you ain't that tuff 🥀":
      return 8
    default:
      return 6
  }
}

function GamePage({ onBack }) {
  const [difficulty, setDifficulty] = useState('Normal')
  const [currentWord, setCurrentWord] = useState('')
  const [currentCategory, setCurrentCategory] = useState('')
  const [guessedLetters, setGuessedLetters] = useState([])
  const initialLives = getLivesForDifficulty('Normal')
  const [lives, setLives] = useState(initialLives)
  const [maxLives, setMaxLives] = useState(initialLives)
  const [score, setScore] = useState(0)
  const [gameStatus, setGameStatus] = useState('playing') // 'playing' | 'won' | 'lost'

  // Single source of truth: always read latest difficulty from localStorage
  const startNewGame = () => {
    const savedDifficulty = localStorage.getItem('difficulty') || 'Normal'
    setDifficulty(savedDifficulty)

    const wordsForDifficulty =
      WORDS_BY_DIFFICULTY[savedDifficulty] || WORDS_BY_DIFFICULTY.Normal
    const randomEntry =
      wordsForDifficulty[Math.floor(Math.random() * wordsForDifficulty.length)]

    setCurrentWord(randomEntry.word)
    setCurrentCategory(randomEntry.category)
    setGuessedLetters([])

    const livesForDifficulty = getLivesForDifficulty(savedDifficulty)
    setMaxLives(livesForDifficulty)
    setLives(livesForDifficulty)
    setGameStatus('playing')
    setScore(0)
  }

  const handleLetterClick = (letter) => {
    // 1. If game not playing → return
    if (gameStatus !== 'playing') return

    // 2. If letter already guessed → return
    if (guessedLetters.includes(letter)) return

    // 3. Add letter to guessedLetters
    const updatedGuessed = [...guessedLetters, letter]
    setGuessedLetters(updatedGuessed)

    // 4. If letter NOT in word → decrease lives by 1 (functional update)
    if (!currentWord.includes(letter)) {
      setLives((prevLives) => {
        const newLives = Math.max(prevLives - 1, 0)
        if (newLives === 0) {
          setGameStatus('lost')
        }
        return newLives
      })
      return
    }

    // Extra: check for win when all letters are guessed
    const wordLetters = currentWord.split('')
    const allGuessed = wordLetters.every((ch) => updatedGuessed.includes(ch))
    if (allGuessed) {
      setGameStatus('won')
      setScore((prevScore) => prevScore + lives * 10)
    }
  }

  // Initialize game
  useEffect(() => {
    startNewGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard event listener (physical keyboard → trigger button click)
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (gameStatus !== 'playing') return

      const key = event.key.toUpperCase()
      if (key.length === 1 && key >= 'A' && key <= 'Z') {
        const button = document.querySelector(
          `.keyboard button[data-key=\"${key}\"]`,
        )
        if (button) {
          event.preventDefault()
          button.click()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [gameStatus])

  const correctLetters = guessedLetters.filter((letter) =>
    currentWord.includes(letter)
  )
  const wrongLetters = guessedLetters.filter(
    (letter) => !currentWord.includes(letter)
  )

  return (
    <main className="game-page">
      <div className="game-container">
        <header className="game-header">
          <button className="game-back-button" onClick={onBack} aria-label="Back to home">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <LivesDisplay lives={lives} maxLives={maxLives} />
        </header>

        <section className="game-main">
          {difficulty === 'Easy' && currentCategory && currentWord && (
            <div className="game-hint">
              <span className="hint-label">Hint:</span>
              <span className="hint-text">{currentCategory}</span>
            </div>
          )}
          <WordDisplay word={currentWord} guessedLetters={guessedLetters} />
        </section>

        <section className="game-keyboard-section">
          <Keyboard
            onLetterClick={handleLetterClick}
            guessedLetters={guessedLetters}
            correctLetters={correctLetters}
            wrongLetters={wrongLetters}
          />
        </section>
      </div>

      <GameOverModal
        isOpen={gameStatus !== 'playing'}
        hasWon={gameStatus === 'won'}
        word={currentWord}
        score={score}
        onPlayAgain={startNewGame}
        onGoHome={onBack}
      />
    </main>
  )
}

export default GamePage
