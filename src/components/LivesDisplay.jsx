import { Heart } from 'lucide-react'
import './LivesDisplay.css'

function LivesDisplay({ lives, maxLives }) {
  return (
    <div className="lives-display">
      <span className="lives-label">Lives:</span>
      <div className="lives-hearts">
        {Array.from({ length: maxLives }).map((_, index) => {
          const isAlive = index < lives
          return (
            <Heart
              key={index}
              size={24}
              className={`heart ${isAlive ? 'heart-full' : 'heart-empty'}`}
              color={isAlive ? 'var(--ww-orange)' : 'rgba(255,255,255,0.2)'}
              fill={isAlive ? 'var(--ww-orange)' : 'none'}
              strokeWidth={isAlive ? 2 : 1.75}
              aria-hidden
            />
          )
        })}
      </div>
      <span className="lives-count">{lives}/{maxLives}</span>
    </div>
  )
}

export default LivesDisplay
