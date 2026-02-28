import './LandingPage.css'
import CustomButton from '../components/CustomButton'

function LandingPage({ onNavigate }) {
  return (
    <main className="landing">
      <section className="landing-card">
        <header className="landing-header">
          <div className="title-group">
            <h1 className="app-title">
              <span className="title-tile">W</span>
              <span className="title-text">ord</span>
              <span className="title-tile">W</span>
              <span className="title-text">ise</span>
            </h1>
          </div>
        </header>

        <section className="landing-main">
          <div className="actions">
            <CustomButton 
              variant="primary" 
              fullWidth
              onClick={() => onNavigate?.('game')}
            >
              Play
            </CustomButton>

            <div className="button-pair">
              <CustomButton 
                variant="primary"
                onClick={() => onNavigate?.('leaderboard')}
              >
                Leaderboard
              </CustomButton>
              <CustomButton 
                variant="primary"
                onClick={() => onNavigate?.('settings')}
              >
                Settings
              </CustomButton>
            </div>

            <CustomButton 
              variant="ghost" 
              fullWidth
              onClick={() => onNavigate?.('faq')}
            >
              FAQ
            </CustomButton>
          </div>
        </section>

        <section className="landing-preview">
          <div className="preview-tiles">
            <div className="preview-tile">W</div>
            <div className="preview-tile">O</div>
            <div className="preview-tile preview-tile-correct">R</div>
            <div className="preview-tile">D</div>
          </div>
          <p className="landing-footer-text">Made for kids who love words.</p>
        </section>
      </section>
    </main>
  )
}

export default LandingPage

