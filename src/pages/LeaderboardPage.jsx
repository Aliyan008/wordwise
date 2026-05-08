import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { authService } from '../services/authService'
import CustomDropdown from '../components/CustomDropdown'
import './LeaderboardPage.css'

const LEADERBOARD_CACHE_KEY = 'wordwise_leaderboard_cache'
const LEADERBOARD_PROFILES_CACHE_KEY = 'wordwise_leaderboard_profiles_cache'
const CACHE_MAX_AGE_MS = 60 * 60 * 1000 // 1 hour
const GAMES_SELECT = 'id, user_id, username, difficulty, won, guesses_used, max_guesses, last_updatedat'

const DIFFICULTY_OPTIONS = ['All', 'Easy', 'Normal', 'Hard', "you ain't that tuff 🥀"]
const RANK_BY_OPTIONS = [
  { id: 'wins', label: 'Wins' },
  { id: 'winRate', label: 'Win %' },
]

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

// One-time cleanup of the previous-format cache key so users don't carry
// stale avatar-only data after the schema change.
try {
  localStorage.removeItem('wordwise_leaderboard_avatars_cache')
} catch {
  // ignore
}

function getProfilesCache() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_PROFILES_CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data.profiles !== 'object' || !data.lastFetchTimestamp) return null
    return data
  } catch {
    return null
  }
}

function setProfilesCache(profiles, lastFetchTimestamp) {
  try {
    localStorage.setItem(
      LEADERBOARD_PROFILES_CACHE_KEY,
      JSON.stringify({ profiles, lastFetchTimestamp }),
    )
  } catch {
    // ignore
  }
}

// Minimum total games required to be ranked when sorting by win rate.
// Prevents a 1-of-1 player (100%) from beating a player with many games.
const MIN_GAMES_FOR_WIN_RATE = 5

function aggregateByPlayer(games, difficultyFilter, rankBy) {
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

  // Tie-breakers (same in both modes for stable, meaningful order):
  //   primary: chosen metric (rankBy)
  //   secondary: the other metric
  //   tertiary: avgGuesses ascending (lower is better; null = worst)
  //   quaternary: totalGames descending (more games = stronger sample)
  const compareAvg = (a, b) => {
    const av = a.avgGuesses == null ? Infinity : a.avgGuesses
    const bv = b.avgGuesses == null ? Infinity : b.avgGuesses
    return av - bv
  }

  return Object.values(byUserId)
    .map((p) => ({
      ...p,
      winRate: p.totalGames > 0 ? (p.wins / p.totalGames) * 100 : 0,
      avgGuesses: p.wins > 0 ? p.guessesSum / p.wins : null,
    }))
    .filter((p) => {
      if (p.wins < 1) return false
      if (rankBy === 'winRate' && p.totalGames < MIN_GAMES_FOR_WIN_RATE) return false
      return true
    })
    .sort((a, b) => {
      if (rankBy === 'winRate') {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate
        if (b.wins !== a.wins) return b.wins - a.wins
        const avgCmp = compareAvg(a, b)
        if (avgCmp !== 0) return avgCmp
        return b.totalGames - a.totalGames
      }
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.winRate !== a.winRate) return b.winRate - a.winRate
      const avgCmp = compareAvg(a, b)
      if (avgCmp !== 0) return avgCmp
      return b.totalGames - a.totalGames
    })
}

function LeaderboardPage({ onBack }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [difficultyFilter, setDifficultyFilter] = useState('All')
  const [rankBy, setRankBy] = useState('wins')
  const [profiles, setProfiles] = useState(() => {
    const cached = getProfilesCache()
    return cached ? cached.profiles : {}
  })

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

  // Fetch latest username + avatar_url from profiles for the unique user_ids
  // on the leaderboard. Source of truth = profiles, not the denormalized
  // username stored in games (which can be stale after a username change).
  // Uses its own cache so we only re-fetch when stale.
  useEffect(() => {
    if (games.length === 0) return
    let mounted = true

    const userIds = Array.from(
      new Set(games.map((g) => g.user_id).filter(Boolean)),
    )
    if (userIds.length === 0) return

    const cached = getProfilesCache()
    const ageMs = cached
      ? Date.now() - new Date(cached.lastFetchTimestamp).getTime()
      : Infinity
    const cachedProfiles = cached ? cached.profiles : {}
    const missingIds = userIds.filter((id) => !(id in cachedProfiles))

    // Fresh cache and no new users -> skip
    if (ageMs < CACHE_MAX_AGE_MS && missingIds.length === 0) {
      if (cached) setProfiles(cachedProfiles)
      return
    }

    const idsToFetch =
      ageMs < CACHE_MAX_AGE_MS ? missingIds : userIds

    authService.getProfilesByIds(idsToFetch).then(({ data, error: err }) => {
      if (!mounted || err || !data) return
      const next = { ...cachedProfiles }
      for (const row of data) {
        next[row.id] = {
          username: row.username || null,
          avatar_url: row.avatar_url || null,
        }
      }
      // Mark fetched users we didn't get a row back for as resolved-null
      for (const id of idsToFetch) {
        if (!(id in next)) next[id] = { username: null, avatar_url: null }
      }
      setProfiles(next)
      setProfilesCache(next, new Date().toISOString())
    })

    return () => {
      mounted = false
    }
  }, [games])

  const ranked = aggregateByPlayer(games, difficultyFilter, rankBy)

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
        <p className="leaderboard-hero-text">
          Top players by {rankBy === 'winRate' ? 'win %' : 'wins'}
        </p>
      </div>

      <div className="leaderboard-filters">
        <CustomDropdown
          label="Difficulty"
          ariaLabel="Filter by difficulty"
          value={difficultyFilter}
          onChange={setDifficultyFilter}
          options={DIFFICULTY_OPTIONS.map((d) => ({ value: d, label: d }))}
        />
        <CustomDropdown
          label="Rank by"
          ariaLabel="Rank by metric"
          value={rankBy}
          onChange={setRankBy}
          options={RANK_BY_OPTIONS.map((opt) => ({ value: opt.id, label: opt.label }))}
        />
      </div>

      {error && (
        <p className="leaderboard-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="leaderboard-loading">Loading…</p>
      ) : games.length === 0 ? (
        <p className="leaderboard-empty">No games yet. Play to appear here!</p>
      ) : ranked.length === 0 ? (
        <p className="leaderboard-empty">
          {rankBy === 'winRate'
            ? `No qualifying players yet. Players need at least ${MIN_GAMES_FOR_WIN_RATE} games to be ranked by Win %.`
            : 'No players with a win yet for this filter. Win a game to join the board!'}
        </p>
      ) : (
        <div className="leaderboard-board">
          <div className="leaderboard-table-header" role="row" aria-label="Column headings">
            <span className="leaderboard-th leaderboard-th-rank">Rank</span>
            <span className="leaderboard-th leaderboard-th-player">Player</span>
            <span className="leaderboard-th leaderboard-th-stat">Games</span>
            <span className="leaderboard-th leaderboard-th-stat">Wins</span>
            <span className="leaderboard-th leaderboard-th-stat">Win %</span>
            <span className="leaderboard-th leaderboard-th-stat">Avg</span>
          </div>
          <ul className="leaderboard-list" role="list">
            {ranked.map((row, index) => {
              const isFirst = index === 0;
              const liveProfile = profiles[row.user_id] || {};
              const displayName = liveProfile.username || row.username;
              const avatarUrl = liveProfile.avatar_url || null;
              const initial = displayName ? displayName[0].toUpperCase() : '?';

              return (
                <li
                  key={row.user_id}
                  className={`leaderboard-card leaderboard-row-grid ${isFirst ? 'leaderboard-card-first' : ''}`}
                >
                  <div className="leaderboard-rank-container">
                    <span className={getRankClass(index)}>
                      {index < 3 ? (
                        <span className="leaderboard-medal" aria-hidden>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        index + 1
                      )}
                    </span>
                  </div>

                  <div className="leaderboard-player-cell">
                    <div className={`leaderboard-avatar ${isFirst ? 'leaderboard-avatar-first' : ''}`}>
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={`${displayName} avatar`}
                          className="leaderboard-avatar-image"
                        />
                      ) : (
                        <span aria-hidden>{initial}</span>
                      )}
                    </div>
                    <span className="leaderboard-username">{displayName}</span>
                  </div>

                  <span className="leaderboard-stat-value leaderboard-stat-numeric">{row.totalGames}</span>
                  <span className="leaderboard-stat-value leaderboard-stat-numeric">{row.wins}</span>
                  <span className="leaderboard-stat-value leaderboard-stat-numeric">
                    {row.winRate.toFixed(0)}%
                  </span>
                  <span className="leaderboard-stat-value leaderboard-stat-numeric">
                    {row.avgGuesses != null ? row.avgGuesses.toFixed(1) : '—'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </main>
  )
}

export default LeaderboardPage
