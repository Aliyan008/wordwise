import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './LeaderboardPage.css'

const LEADERBOARD_CACHE_KEY = 'wordwise_leaderboard_cache'
const CACHE_MAX_AGE_MS = 60 * 60 * 1000 // 1 hour
const GAMES_SELECT = 'id, user_id, username, difficulty, won, guesses_used, max_guesses, last_updatedat'

const DIFFICULTY_OPTIONS = ['All', 'Easy', 'Normal', 'Hard', "you ain't that tuff 🥀"]

function getCache() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.games) || !data.lastFetchTimestamp) return null
    return data
  } catch {
    return null
  }
}

function setCache(games, lastFetchTimestamp) {
  try {
    localStorage.setItem(
      LEADERBOARD_CACHE_KEY,
      JSON.stringify({ games, lastFetchTimestamp }),
    )
  } catch {
    // ignore
  }
}

function cacheAgeMs(cache) {
  return Date.now() - new Date(cache.lastFetchTimestamp).getTime()
}

function mergeGames(cachedGames, incomingGames) {
  const byId = new Map(cachedGames.map((g) => [g.id, { ...g }]))
  for (const g of incomingGames) {
    byId.set(g.id, { ...g })
  }
  return Array.from(byId.values())
}

function aggregateByPlayer(games, difficultyFilter) {
  const filtered =
    difficultyFilter === 'All'
      ? games
      : games.filter((g) => g.difficulty === difficultyFilter)

  const byUserId = {}
  for (const g of filtered) {
    const id = g.user_id
    if (!byUserId[id]) {
      byUserId[id] = {
        user_id: id,
        username: g.username || 'Anonymous',
        totalGames: 0,
        wins: 0,
        guessesSum: 0,
      }
    }
    const row = byUserId[id]
    row.totalGames += 1
    if (g.won) {
      row.wins += 1
      if (g.guesses_used != null) row.guessesSum += g.guesses_used
    }
  }

  return Object.values(byUserId)
    .map((p) => ({
      ...p,
      winRate: p.totalGames > 0 ? (p.wins / p.totalGames) * 100 : 0,
      avgGuesses: p.wins > 0 ? p.guessesSum / p.wins : null,
    }))
    .sort((a, b) => b.wins - a.wins)
}

function LeaderboardPage({ onBack }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [difficultyFilter, setDifficultyFilter] = useState('All')

  useEffect(() => {
    let mounted = true
    setError(null)

    const cache = getCache()
    const ageMs = cache ? cacheAgeMs(cache) : Infinity

    if (cache && ageMs < CACHE_MAX_AGE_MS) {
      setGames(cache.games)
      setLoading(false)
      return
    }

    if (!cache) {
      setLoading(true)
      supabase
        .from('games')
        .select(GAMES_SELECT)
        .then(({ data, error: err }) => {
          if (!mounted) return
          if (err) {
            setError(err.message)
            setGames([])
          } else {
            const list = data || []
            setGames(list)
            setCache(list, new Date().toISOString())
          }
          setLoading(false)
        })
      return
    }

    setLoading(true)
    const lastTs = cache.lastFetchTimestamp
    supabase
      .from('games')
      .select(GAMES_SELECT)
      .gt('last_updatedat', lastTs)
      .then(({ data, error: err }) => {
        if (!mounted) return
        if (err) {
          setError(err.message)
          setLoading(false)
          return
        }
        const incoming = data || []
        const merged = mergeGames(cache.games, incoming)
        setGames(merged)
        setCache(merged, new Date().toISOString())
        setLoading(false)
      })
  }, [])

  const ranked = aggregateByPlayer(games, difficultyFilter)

  const getRankClass = (index) => {
    if (index === 0) return 'leaderboard-rank leaderboard-rank-gold'
    if (index === 1) return 'leaderboard-rank leaderboard-rank-silver'
    if (index === 2) return 'leaderboard-rank leaderboard-rank-bronze'
    return 'leaderboard-rank'
  }

  return (
    <main className="leaderboard-page">
      <header className="leaderboard-header">
        <button
          type="button"
          className="leaderboard-back"
          onClick={onBack}
          aria-label="Back to home"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="leaderboard-title">Leaderboard</h1>
      </header>

      <div className="leaderboard-hero">
        <div className="leaderboard-trophy" aria-hidden>
          <svg viewBox="0 0 24 24" fill="currentColor" className="leaderboard-trophy-icon">
            <path d="M12 2a2 2 0 0 1 2 2v1h2a2 2 0 0 1 2 2v1.17a4 4 0 0 1-1.17 2.83L16 11h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1.17A4 4 0 0 1 16 18.83V20h2v2H6v-2h2v-1.17A4 4 0 0 1 7.17 16H6a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h2l-.83-.83A4 4 0 0 1 6.17 8V6a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2h2zm0 2h-2v2h2V4zM8 6H6v1.17L6.83 8H8V6zm8 0h-2v2h1.17L18 7.17V6h-2zM8 12H6v1h2v-1zm10 0h-2v1h2v-1zm-8 4.83V18h4v-1.17A4 4 0 0 1 12 14a4 4 0 0 1-2 .83zM12 12a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
          </svg>
        </div>
        <p className="leaderboard-hero-text">Top players by wins</p>
      </div>

      <div className="leaderboard-controls" role="group" aria-label="Filter by difficulty">
        <span className="leaderboard-filter-label">Difficulty</span>
        <div className="leaderboard-filter-pills">
          {DIFFICULTY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={`leaderboard-filter-pill ${difficultyFilter === d ? 'leaderboard-filter-pill-active' : ''}`}
              onClick={() => setDifficultyFilter(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="leaderboard-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="leaderboard-loading">Loading…</p>
      ) : ranked.length === 0 ? (
        <p className="leaderboard-empty">No games yet. Play to appear here!</p>
      ) : (
        <ul className="leaderboard-list" role="list">
          {ranked.map((row, index) => (
            <li
              key={row.user_id}
              className={`leaderboard-card ${index < 3 ? 'leaderboard-card-podium' : ''}`}
            >
              <span className={getRankClass(index)}>
                {index < 3 ? (
                  <span className="leaderboard-medal" aria-hidden>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  index + 1
                )}
              </span>
              <div className="leaderboard-card-body">
                <span className="leaderboard-username">{row.username}</span>
                <div className="leaderboard-stats">
                  <div className="leaderboard-stat-item">
                    <span className="leaderboard-stat-label">Games Played</span>
                    <span className="leaderboard-stat-value">{row.totalGames}</span>
                  </div>
                  <div className="leaderboard-stat-item">
                    <span className="leaderboard-stat-label">Wins</span>
                    <span className="leaderboard-stat-value">{row.wins}</span>
                  </div>
                  <div className="leaderboard-stat-item">
                    <span className="leaderboard-stat-label">Win Rate</span>
                    <span className="leaderboard-stat-value">{row.winRate.toFixed(0)}%</span>
                  </div>
                  <div className="leaderboard-stat-item">
                    <span className="leaderboard-stat-label">Avg Guesses</span>
                    <span className="leaderboard-stat-value">
                      {row.avgGuesses != null ? row.avgGuesses.toFixed(1) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default LeaderboardPage
