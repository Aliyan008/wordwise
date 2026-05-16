import './WordLogo.css'

function WordLogo() {
  return (
    <div className="word-logo">
      <div className="word-logo-tiles" aria-hidden>
        <div className="word-logo-tile word-logo-tile-large">W</div>
        <div className="word-logo-tile word-logo-tile-small">W</div>
      </div>
      <div className="word-logo-text">
        <span className="word-logo-word">WORD</span>
        <span className="word-logo-wise">WISE</span>
      </div>
    </div>
  )
}

export default WordLogo
