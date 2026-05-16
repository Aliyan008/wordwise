import { useEffect, useRef, useState } from 'react'
import wordList from 'word-list-json'
import LivesDisplay from '../components/LivesDisplay'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import './GamePage.css'

// Large local list of valid 5-letter words (no network calls)
const ALL_WORDS = wordList
  .filter((w) => w.length === 5 && /^[a-z]+$/i.test(w))
  .map((w) => w.toUpperCase())

// Curated easy/common words (subset for Easy difficulty)
const EASY_WORDS = [
  'HOUSE',
  'TABLE',
  'LIGHT',
  'WATER',
  'SMILE',
  'BEACH',
  'CLOCK',
  'BREAD',
  'APPLE',
  'GRASS',
  'CHAIR',
  'BRICK',
  'PLANT',
  'MUSIC',
  'RIVER',
  'STONE',
  'CLOUD',
  'SUGAR',
  'TRAIN',
  'SWEET',
  'SLEEP',
  'GREEN',
  'BLACK',
  'WHITE',
  'ROUND',
  'SHAPE',
  'FRUIT',
  'STARS',
  'SMELL',
  'HAPPY',
  'FUNNY',
  'SMALL',
  'LARGE',
  'NORTH',
  'SOUTH',
  'EASTS',
  'WESTS',
  'SOUND',
  'VOICE',
  'HEART',
  'WORLD',
  'YOUTH',
  'SHEEP',
  'BLOOM',
  'SANDY',
  'SHELL',
  'LEMON',
  'MOUSE',
  'TEETH',
  'WORDS',
  'STORY',
  'PIZZA',
  'BASIC',
  'CLEAN',
  'DREAM',
  'LAUGH',
  'QUIET',
  'NOISE',
  'SHINE',
  'RANGE',
  'SCORE',
  'FRIEND',
].filter((w) => w.length === 5)

// Curated tough/uncommon words for "you ain't that tuff 🥀"
const TOUGH_WORDS = [
  'CRYPT',
  'QUART',
  'LYMPH',
  'NYMPH',
  'JAZZY',
  'FUZZY',
  'WRYLY',
  'PHASE',
  'PIXEL',
  'WALTZ',
  'RHINO',
  'GNASH',
  'PSALM',
  'KNEEL',
  'WHARF',
  'VIXEN',
  'ZESTY',
  'TWIRL',
  'SCOUR',
  'SHRUB',
  'PLAZA',
  'FJORD',
  'GLYPH',
  'SCARF',
  'SQUAD',
  'QUILT',
  'BLITZ',
  'SMELT',
  'SWIRL',
  'PINCH',
  'CRANK',
  'SCRAP',
  'SCOWL',
  'FRAIL',
  'GAUZE',
  'HAZEL',
  'KIOSK',
  'KNACK',
  'QUIRK',
  'ROGUE',
  'SHARD',
  'SIEVE',
  'SMOCK',
  'SNUCK',
  'SWOON',
  'THROB',
  'TRYST',
  'WRYER',
]

const KEYBOARD_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

function pickRandomFrom(pool) {
  return pool[Math.floor(Math.random() * pool.length)]
}

function evaluateGuess(guess, solution) {
  const result = Array(5).fill('absent')
  const solutionLetters = solution.split('')
  const used = Array(5).fill(false)

  // Greens
  for (let i = 0; i < 5; i++) {
    if (guess[i] === solution[i]) {
      result[i] = 'correct'
      used[i] = true
    }
  }

  // Yellows
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue
    const idx = solutionLetters.findIndex((ch, j) => ch === guess[i] && !used[j])
    if (idx !== -1) {
      result[i] = 'present'
      used[idx] = true
    }
  }

  return result
}

function GamePage({ onBack }) {
  const { user, profile } = useAuth() || {}
  const [solution, setSolution] = useState('APPLE')
  const [guesses, setGuesses] = useState([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [statuses, setStatuses] = useState([])
  const [keyboardState, setKeyboardState] = useState({})
  const [gameStatus, setGameStatus] = useState('playing') // 'playing' | 'won' | 'lost'
  const [message, setMessage] = useState('')
  const [difficulty, setDifficulty] = useState('Normal')
  const [maxGuesses, setMaxGuesses] = useState(6)
  const hasInsertedGameRef = useRef(false)

  const resetGame = () => {
    hasInsertedGameRef.current = false
    const savedDifficulty = localStorage.getItem('difficulty') || 'Normal'
    setDifficulty(savedDifficulty)

    let pool = ALL_WORDS
    
    const getDefaultLives = (diff) => {
      if (diff === "you ain't that tuff 🥀") return 4
      if (diff === 'Hard') return 5
      return 6
    }
    
    let savedLives = parseInt(localStorage.getItem('lives'), 10)
    let allowedGuesses = (!isNaN(savedLives) && savedLives >= 3 && savedLives <= 6) 
      ? savedLives 
      : getDefaultLives(savedDifficulty)

    if (savedDifficulty === 'Easy') {
      pool = EASY_WORDS
    } else if (savedDifficulty === 'Normal') {
      pool = ALL_WORDS
    } else if (savedDifficulty === 'Hard') {
      pool = ALL_WORDS
    } else if (savedDifficulty === "you ain't that tuff 🥀") {
      pool = TOUGH_WORDS
    }

    setMaxGuesses(allowedGuesses)
    setSolution(pickRandomFrom(pool))
    setGuesses([])
    setCurrentGuess('')
    setStatuses([])
    setKeyboardState({})
    setGameStatus('playing')
  }

  // Re-read difficulty from localStorage on mount (e.g. after changing it in Settings)
  useEffect(() => {
    resetGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Insert game result into Supabase when game ends (win or loss); only when logged in and once per game
  useEffect(() => {
    if (gameStatus !== 'won' && gameStatus !== 'lost') return
    if (hasInsertedGameRef.current || !user?.id || !profile?.username) return

    hasInsertedGameRef.current = true
    supabase
      .from('games')
      .insert({
        user_id: user.id,
        username: profile.username,
        difficulty,
        won: gameStatus === 'won',
        guesses_used: gameStatus === 'won' ? guesses.length : null,
        max_guesses: maxGuesses,
      })
      .then(({ error }) => {
        if (error) {
          console.error('[GamePage] failed to save game:', error)
        } else {
          localStorage.removeItem('wordwise_leaderboard_cache')
        }
      })
  }, [gameStatus, user?.id, profile?.username, difficulty, maxGuesses, guesses.length])

  const handleSubmitGuess = () => {
    if (gameStatus !== 'playing') return
    if (currentGuess.length !== 5) {
      setMessage('Guess must be 5 letters.')
      return
    }

    const guess = currentGuess.toUpperCase()
    if (!ALL_WORDS.includes(guess)) {
      setMessage('Not in word list.')
      return
    }
    setMessage('')
    const evaluation = evaluateGuess(guess, solution)

    setGuesses((prev) => [...prev, guess])
    setStatuses((prev) => [...prev, evaluation])

    setKeyboardState((prev) => {
      const next = { ...prev }
      guess.split('').forEach((letter, idx) => {
        const status = evaluation[idx]
        const prevStatus = next[letter]
        const rank = { correct: 3, present: 2, absent: 1 }
        if (!prevStatus || rank[status] > rank[prevStatus]) {
          next[letter] = status
        }
      })
      return next
    })

    if (guess === solution) {
      setGameStatus('won')
      setCurrentGuess('')
      return
    }

    if (guesses.length + 1 >= maxGuesses) {
      setGameStatus('lost')
      setCurrentGuess('')
      return
    }

    setCurrentGuess('')
  }

  const handleKey = (key) => {
    if (gameStatus !== 'playing') return

    if (key === 'ENTER') {
      handleSubmitGuess()
      return
    }

    if (key === 'BACKSPACE') {
      setCurrentGuess((prev) => prev.slice(0, -1))
      setMessage('')
      return
    }

    if (key.length === 1 && key >= 'A' && key <= 'Z') {
      setCurrentGuess((prev) => {
        if (prev.length >= 5) return prev
        return prev + key
      })
      setMessage('')
    }
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleKey('ENTER')
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleKey('BACKSPACE')
      } else {
        const k = e.key.toUpperCase()
        if (k.length === 1 && k >= 'A' && k <= 'Z') {
          e.preventDefault()
          handleKey(k)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [gameStatus, currentGuess, guesses.length, solution])

  const rows = Array.from({ length: maxGuesses }, (_, rowIndex) => {
    const guess = guesses[rowIndex] || ''
    const statusRow = statuses[rowIndex] || []
    const isCurrent = rowIndex === guesses.length

    return { guess, statusRow, isCurrent }
  })



  // Removed getKeyStyle inline object styling

  const livesRemaining = Math.max(maxGuesses - guesses.length, 0)

  const decoLetters = ['W', 'E', 'R', 'D', 'S', 'A', 'L']
  const decoClasses = ['w', 'e', 'r', 'd', 's', 'a', 'l']

  return (
    <main className="game-page">
      {decoLetters.map((letter, i) => (
        <div
          key={letter}
          className={`game-page-deco game-page-deco--${decoClasses[i]}`}
          aria-hidden
        >
          {letter}
        </div>
      ))}
      <div className="game-container">
        <div className="game-inner">
          <header className="game-header">
            <button
              onClick={onBack}
              aria-label="Back to home"
              className="game-back-button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="game-header-text">
              <h1 className="game-title">
                WordWise • <span className="game-title-accent">Daily</span>
              </h1>
              <p className="game-subtitle">
                {difficulty} • {maxGuesses} guesses
              </p>
            </div>
            {/* TODO: Implement logic to only show this badge if the user hasn't played today's word yet */}
            <span className="game-new-badge">New</span>
          </header>

          <div className="game-lives-row">
            <LivesDisplay lives={livesRemaining} maxLives={maxGuesses} />
          </div>

          <section className="game-grid">
            {rows.map(({ guess, statusRow, isCurrent }, rowIdx) => (
              <div key={rowIdx} className={`game-row${isCurrent ? ' game-row-current' : ''}`}>
                {Array.from({ length: 5 }, (_, colIdx) => {
                  const letter =
                    isCurrent && currentGuess[colIdx]
                      ? currentGuess[colIdx]
                      : guess[colIdx] || ''
                  const status = statusRow[colIdx] || 'empty'

                  const isRevealed = status !== 'empty'
                  
                  return (
                    <div
                      key={colIdx}
                      className={`game-tile ${isRevealed ? 'revealed' : ''}`}
                    >
                      <div 
                        className={`game-tile-inner status-${status}`}
                        style={{ transitionDelay: `${colIdx * 150}ms` }}
                      >
                        <div className="game-tile-front">
                          {letter}
                        </div>
                        <div className="game-tile-back">
                          {letter}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </section>

          <section className="game-keyboard-section">
            {message && (
              <p className="game-message">
                {message}
              </p>
            )}
            {KEYBOARD_ROWS.map((row) => (
              <div key={row} className="game-keyboard-row">
                {row === 'ZXCVBNM' && (
                  <button
                    className="game-key game-key-enter"
                    onClick={() => handleKey('ENTER')}
                  >
                    Enter
                  </button>
                )}
                {row.split('').map((letter) => {
                  const state = keyboardState[letter] || 'idle'
                  const stateClass = state !== 'idle' ? `game-key-${state}` : ''
                  return (
                    <button
                      key={letter}
                      className={`game-key ${stateClass}`}
                      onClick={() => handleKey(letter)}
                    >
                      {letter}
                    </button>
                  )
                })}
                {row === 'ZXCVBNM' && (
                  <button
                    className="game-key game-key-delete"
                    onClick={() => handleKey('BACKSPACE')}
                    aria-label="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="currentColor">
                      <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"></path>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </section>

          {gameStatus !== 'playing' && (
            <section className="game-over">
              <p className="game-over-title">
                {gameStatus === 'won' ? 'Nice! You got it.' : 'Good try!'}
              </p>
              <p className="game-over-word">
                The word was <strong>{solution}</strong>.
              </p>
              <button type="button" onClick={resetGame} className="game-play-again">
                Play again
              </button>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

export default GamePage
