import { GAMES } from './config.js'

function formatLimit(ms) {
  if (!ms) return 'Ajalimiit puudub'
  const minutes = Math.round(ms / 60000)
  return `Ajalimiit: ${minutes} min`
}

export default function GameSelect({ onPick }) {
  return (
    <div className="intro-overlay" role="dialog" aria-modal="true" aria-labelledby="game-select-title">
      <div className="intro-card game-select-card">
        <header className="intro-head">
          <img src="/logo.png" alt="Woodhouse Academy" className="brand-logo intro-logo" />
          <div>
            <h1 id="game-select-title">Vali mäng</h1>
            <p className="intro-sub">Kaks ülesannet. Vali endale sobiv ja asu ehitama.</p>
          </div>
        </header>

        <section className="intro-body">
          <div className="game-grid">
            {GAMES.map((g) => (
              <article key={g.id} className="game-card">
                <header className="game-card-head">
                  <span className="game-badge">{g.timeLimitMs ? 'Ajaga' : 'Ilma ajata'}</span>
                  <h2>{g.title}</h2>
                  <span className="game-limit">{formatLimit(g.timeLimitMs)}</span>
                </header>
                <div className="game-card-body">
                  <p className="game-desc">{g.description}</p>
                  <div className="game-scoring">
                    <strong>Punktiarvestus</strong>
                    <p>{g.scoring}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg game-cta"
                  onClick={() => onPick(g.id)}
                >
                  Alusta →
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
