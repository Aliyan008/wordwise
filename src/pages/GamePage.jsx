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
    let allowedGuesses = 6

    if (savedDifficulty === 'Easy') {
      pool = EASY_WORDS
      allowedGuesses = 6
    } else if (savedDifficulty === 'Normal') {
      pool = ALL_WORDS
      allowedGuesses = 6
    } else if (savedDifficulty === 'Hard') {
      pool = ALL_WORDS
      allowedGuesses = 5
    } else if (savedDifficulty === "you ain't that tuff 🥀") {
      pool = TOUGH_WORDS
      allowedGuesses = 5
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

  const getTileStyle = (status) => {
    if (status === 'correct') {
      return {
        backgroundColor: 'var(--color-success)',
        borderColor: 'var(--color-success)',
        color: '#ffffff',
      }
    }
    if (status === 'present') {
      return {
        backgroundColor: 'var(--color-warning)',
        borderColor: 'var(--color-warning)',
        color: 'var(--color-text-primary)',
      }
    }
    if (status === 'absent') {
      return {
        backgroundColor: 'var(--color-border-dark)',
        borderColor: 'var(--color-border-dark)',
        color: 'var(--color-text-secondary-dark)',
      }
    }
    return {
      backgroundColor: 'var(--color-surface)',
      borderColor: 'var(--color-border-light)',
      color: 'var(--color-text-primary)',
    }
  }

  const getKeyStyle = (state) => {
    if (state === 'correct') {
      return {
        backgroundColor: 'var(--color-success)',
        color: '#ffffff',
      }
    }
    if (state === 'present') {
      return {
        backgroundColor: 'var(--color-warning)',
        color: 'var(--color-text-primary)',
      }
    }
    if (state === 'absent') {
      return {
        backgroundColor: 'var(--color-border-dark)',
        color: 'var(--color-text-secondary-dark)',
      }
    }
    return {
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text-primary)',
    }
  }

  const livesRemaining =
    gameStatus === 'playing' ? Math.max(maxGuesses - guesses.length, 0) : 0

  return (
    <main className="game-page">
      <div className="game-container">
        <div className="game-inner">
        <header className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            aria-label="Back to home"
            className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]"
          >
            ← Back
          </button>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-xl font-bold tracking-wide">
              WordWise • Daily
            </h1>
            <p className="text-[11px] uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              {difficulty} • {maxGuesses} guesses
            </p>
          </div>
          <button
            onClick={resetGame}
            className="text-xs text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-hover)]"
          >
            New
          </button>
        </header>

        <div className="flex justify-end mb-1">
          <LivesDisplay lives={livesRemaining} maxLives={maxGuesses} />
        </div>

        <section
          className="game-grid"
          style={{ gridTemplateRows: `repeat(${maxGuesses}, 1fr)` }}
        >
          {rows.map(({ guess, statusRow, isCurrent }, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 5 }, (_, colIdx) => {
                const letter =
                  isCurrent && currentGuess[colIdx]
                    ? currentGuess[colIdx]
                    : guess[colIdx] || ''
                const status = statusRow[colIdx] || 'empty'

                return (
                  <div
                    key={colIdx}
                    className="w-12 h-12 sm:w-14 sm:h-14 border flex items-center justify-center text-lg font-bold rounded-md transition-colors duration-200"
                    style={getTileStyle(status)}
                  >
                    {letter}
                  </div>
                )
              })}
            </div>
          ))}
        </section>

        <section className="mt-4 flex flex-col items-center gap-1">
          {message && (
            <p className="mb-1 text-xs font-semibold text-[color:var(--color-error)]">
              {message}
            </p>
          )}
          {KEYBOARD_ROWS.map((row) => (
            <div key={row} className="flex justify-center gap-1">
              {row.split('').map((letter) => {
                const state = keyboardState[letter] || 'idle'
                return (
                  <button
                    key={letter}
                    className="px-2.5 py-2 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-semibold cursor-pointer select-none transition-colors duration-150 border border-[color:var(--color-border-light)]"
                    style={getKeyStyle(state)}
                    onClick={() => handleKey(letter)}
                  >
                    {letter}
                  </button>
                )
              })}
              {row === 'ZXCVBNM' && (
                <>
                  <button
                    className="px-3 py-2 rounded-md text-xs sm:text-sm font-semibold border border-[color:var(--color-border-light)]"
                    style={getKeyStyle('idle')}
                    onClick={() => handleKey('BACKSPACE')}
                  >
                    ⌫
                  </button>
                  <button
                    className="px-3 py-2 rounded-md text-xs sm:text-sm font-semibold border border-[color:var(--color-border-light)]"
                    style={getKeyStyle('idle')}
                    onClick={() => handleKey('ENTER')}
                  >
                    Enter
                  </button>
                </>
              )}
            </div>
          ))}
        </section>

        {gameStatus !== 'playing' && (
          <section className="mt-4 text-center space-y-2">
            <p className="text-lg font-semibold">
              {gameStatus === 'won' ? 'Nice! You got it.' : 'Good try!'}
            </p>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              The word was{' '}
              <span className="font-mono font-bold text-[color:var(--color-primary)]">
                {solution}
              </span>
              .
            </p>
            <button
              onClick={resetGame}
              className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold shadow-md"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
              }}
            >
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
