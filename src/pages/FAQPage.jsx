import { useState } from 'react'
import './FAQPage.css'

const FAQ_DATA = [
  {
    section: 'GAMEPLAY',
    items: [
      { q: 'How do I play WordWise?', a: 'Guess the hidden 5-letter word. You have up to 6 tries. After each guess, the color of the tiles will change to show how close your guess was to the word.' },
      { q: 'What does "Daily" mean?', a: 'The Daily mode gives everyone playing the same word to guess for that day. It refreshes every 24 hours.' },
      { q: 'What do the difficulty levels mean?', a: 'Easy uses very common words. Normal uses standard 5-letter words. Hard reduces your allowed guesses to 5. The toughest difficulty uses obscure words and gives you only 5 guesses.' },
      { q: 'What are Lives?', a: 'Lives are the number of guesses you have left. When you run out of lives, the game is over.' },
    ]
  },
  {
    section: 'ACCOUNT & SCORES',
    items: [
      { q: 'Do I need an account to play?', a: 'You can play the game without an account, but your scores won\'t be saved to the leaderboard unless you log in or sign up.' },
      { q: 'How is the Leaderboard ranked?', a: 'The leaderboard is ranked by the number of games won, and then by the fewest average guesses used.' },
      { q: 'My stats look wrong — what do I do?', a: 'Try refreshing the page or logging out and logging back in. If that doesn\'t work, please contact support.' },
    ]
  },
  {
    section: 'TIPS FOR KIDS',
    items: [
      { q: "I'm stuck — any hints?", a: 'Try using words with lots of vowels first, like "AUDIO" or "HOUSE". This can help you find which letters are in the word quickly.' },
      { q: 'Can parents play too?', a: 'Absolutely! WordWise is designed for everyone to enjoy, whether you\'re a kid learning new words or an adult looking for a quick puzzle.' },
    ]
  }
]

function FAQPage({ onBack }) {
  const [openIndex, setOpenIndex] = useState(null)

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <main className="faq-page">
      <div className="faq-container">
        <header className="faq-header">
          <button
            className="faq-back-icon"
            onClick={onBack}
            aria-label="Back to home"
          >
            ← Back
          </button>
          <h1 className="faq-title">FAQ</h1>
        </header>

        <section className="faq-legend">
          <div className="faq-legend-card faq-legend-card-green">
            <span className="faq-legend-emoji" aria-hidden="true">🟩</span>
            <div className="faq-legend-text">
              <h2 className="faq-legend-title">Green tile</h2>
              <p className="faq-legend-subtitle">Letter is in the correct spot</p>
            </div>
          </div>
          <div className="faq-legend-card faq-legend-card-yellow">
            <span className="faq-legend-emoji" aria-hidden="true">🟨</span>
            <div className="faq-legend-text">
              <h2 className="faq-legend-title">Yellow tile</h2>
              <p className="faq-legend-subtitle">Letter is in the word but wrong position</p>
            </div>
          </div>
          <div className="faq-legend-card faq-legend-card-dark">
            <span className="faq-legend-emoji" aria-hidden="true">⬛</span>
            <div className="faq-legend-text">
              <h2 className="faq-legend-title">Dark tile</h2>
              <p className="faq-legend-subtitle">Letter is not in the word at all</p>
            </div>
          </div>
        </section>

        <div className="faq-content">
          {FAQ_DATA.map((sectionGroup, sectionIdx) => (
            <section key={sectionGroup.section} className="faq-section" style={{ marginTop: sectionIdx > 0 ? '32px' : '32px' }}>
              <h3 className="faq-section-title">{sectionGroup.section}</h3>
              {sectionGroup.items.map((item, itemIdx) => {
                const globalIndex = `${sectionIdx}-${itemIdx}`
                const isOpen = openIndex === globalIndex
                
                return (
                  <div key={globalIndex} className="faq-accordion-item">
                    <button 
                      className="faq-accordion-header"
                      onClick={() => handleToggle(globalIndex)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <span className={`faq-accordion-icon ${isOpen ? 'open' : ''}`} aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </span>
                    </button>
                    <div className={`faq-accordion-content ${isOpen ? 'open' : ''}`}>
                      <div className="faq-accordion-inner">
                        <p className="faq-accordion-answer">{item.a}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}

export default FAQPage
