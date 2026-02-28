import './GameOverModal.css'
import CustomButton from './CustomButton'

function GameOverModal({ isOpen, hasWon, word, score, onPlayAgain, onGoHome }) {
  if (!isOpen) return null

  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <h2 className="game-over-title">
          {hasWon ? '🎉 You Won!' : '😢 Game Over'}
        </h2>
        <p className="game-over-word">The word was: <strong>{word}</strong></p>
        {hasWon && <p className="game-over-score">Score: {score}</p>}
        <div className="game-over-actions">
          <CustomButton variant="primary" fullWidth onClick={onPlayAgain}>
            Play Again
          </CustomButton>
          <CustomButton variant="secondary" fullWidth onClick={onGoHome}>
            Back to Home
          </CustomButton>
        </div>
      </div>
    </div>
  )
}

export default GameOverModal
