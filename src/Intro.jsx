const REQUIRED_MATERIALS = [
  {
    icon: '▬',
    label: 'Põrand',
    what: 'Põrandakonstruktsioon moodustab iga korruse aluse, lisatakse alati esimesena enne karkassi püstitamist.',
    when: 'Alumise korruse põrand käivitab mängu taimeri.',
  },
  {
    icon: '▦',
    label: 'Konstruktsioon',
    what: 'Kandev konstruktsioon. 300 / 400 / 600 mm puitkarkass — number tähistab postide sammu seinas. CLT (ristkihtliimpuit) on massiivpuidust element, mis täidab nii kandvat kui jäigastavat funktsiooni.',
    when: 'Põranda järel — enne kõiki ülejäänud kihte.',
  },
  {
    icon: '◫',
    label: 'Puitkarkassil jäikusseinad',
    what: 'OSB plaadid naelutatakse puitkarkassi peale, muutes seina piisavalt jäigaks, et võtta vastu tuulekoormust. Naelutussamm 50 / 70 / 100 mm — mida väiksem, seda tugevam.',
    when: 'Konstruktsiooni järel. CLT element seda ei vaja.',
  },
  {
    icon: '≋',
    label: 'Isolatsioon',
    what: 'Üks nupp lisab korraga puitkarkassil siseseinte ja välisseinte isolatsiooni. CLT-elemendid soojustatakse väljastpoolt — nähtav alles fassaadiga.',
    when: 'Peale jäikusseinte, enne kipsplaate.',
  },
  {
    icon: '▭',
    label: 'Kipsplaadid',
    what: '1 / 2 / 3 kihti — sõltuvalt hoone tuleohutusnõuetest. Mida rohkem kihte, seda vastupidavam tulekahjule. Vale valik loetakse ala- või üledimensioneerituks.',
    when: 'Isolatsiooni järel — katab seina seestpoolt.',
  },
  {
    icon: '▌',
    label: 'Fassaad',
    what: 'Välimine kate — kaitseb välisseina konstruktsioone ilmastikumõjude eest ning annab ehitisele visuaalse ilme.',
    when: 'Peale kipsplaate, enne trepikoda.',
  },
  {
    icon: '↗',
    label: 'Trepikoda',
    what: 'Trepikoja segment lisatakse igale korrusele. 1. korrusel maapinna segment, ülejäänutel korduv segment.',
    when: 'Peale fassaadi — lisada igal korrusel.',
  },
  {
    icon: '═',
    label: 'Lagi',
    what: 'Laekonstruktsioon sulgeb korruse. Koos ülemise korruse põrandaga moodustub korrusvahelagi.',
    when: 'Viimane kohustuslik samm — vajalik enne järgmise korruse ehitamist.',
  },
]

const OPTIONAL_MATERIALS = [
  {
    icon: '◰',
    label: 'Rõdu',
    what: 'Rõdu konstruktsioon. Saab hiljem korruste kaupa eemaldada.',
    when: 'Peale trepikoda, enne lage — ainult kui korrusel on rõdu.',
  },
  {
    icon: '🏠',
    label: 'Katus',
    what: 'Lõpetab ehitise. Pärast katuse paigaldust rohkem korruseid lisada ei saa.',
    when: 'Ainult 10. korrusele — kõik eelnevad korrused peavad olema valmis.',
  },
]

const ORDER_SEQUENCE = [
  { label: 'Põrand' },
  { label: 'Konstruktsioon' },
  { label: 'Jäikus' },
  { label: 'Isolatsioon' },
  { label: 'Kipsplaadid' },
  { label: 'Fassaad' },
  { label: 'Trepikoda' },
  { label: 'Rõdu', optional: true },
  { label: 'Lagi' },
  { label: 'Katus', optional: true, terminal: true },
]

function MaterialCard({ icon, label, what, when }) {
  return (
    <div className="material">
      <span className="material-icon" aria-hidden>{icon}</span>
      <div>
        <strong>{label}</strong>
        <p>{what}</p>
        <p className="material-when">
          <span className="material-when-tag">Millal:</span> {when}
        </p>
      </div>
    </div>
  )
}

export default function Intro({ onStart, game = null, onBack = null, backLabel = 'Pöördu tagasi' }) {
  return (
    <div className="intro-overlay" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="intro-card">
        <header className="intro-head">
          <img src="/logo.png" alt="Woodhouse Academy" className="brand-logo intro-logo" />
          <div>
            <h1 id="intro-title">{game?.title ?? 'Puitmaja ehitamise simulaator'}</h1>
            <p className="intro-sub">{game?.short ?? 'Ehita puitmaja alt üles — kuni 10 korrust.'}</p>
          </div>
        </header>

        <section className="intro-body">
          {game && (
            <div className="intro-task" role="note">
              <strong>Ülesanne</strong>
              <p>{game.description}</p>
              <p className="intro-task-scoring">{game.scoring}</p>
            </div>
          )}
          <p className="intro-lead">
            Iga korrus koosneb kihtidest, mis lisatakse kindlas järjekorras. Vali igale korrusele sobivad materjalid, kinnita korrus ja liigu edasi. Kui paned katuse peale, on ehitis valmis ja saad selle esitada.
          </p>

          <h2>Ehitamise järjekord</h2>
          <div className="order-strip" aria-label="Kihtide järjekord korruse ehitamisel">
            {ORDER_SEQUENCE.map((o, i) => (
              <span key={o.label} className="order-item-wrap">
                <span
                  className={`order-item ${o.optional ? 'is-optional' : ''} ${o.terminal ? 'is-terminal' : ''}`}
                  title={o.optional ? 'Valikuline samm' : 'Kohustuslik samm'}
                >
                  {o.label}
                </span>
                {i < ORDER_SEQUENCE.length - 1 && <span className="order-arrow" aria-hidden>→</span>}
              </span>
            ))}
          </div>
          <p className="order-legend">
            <span className="legend-dot is-required" /> kohustuslik
            <span className="legend-dot is-optional" /> valikuline
            <span className="legend-dot is-terminal" /> lõpetab ehitise
          </p>

          <h2>Kohustuslikud materjalid</h2>
          <div className="material-grid">
            {REQUIRED_MATERIALS.map((m) => (
              <MaterialCard key={m.label} {...m} />
            ))}
          </div>

          <h2>Valikulised</h2>
          <div className="material-grid">
            {OPTIONAL_MATERIALS.map((m) => (
              <MaterialCard key={m.label} {...m} />
            ))}
          </div>

          <div className="intro-tips">
            <strong>Nipid</strong>
            <ul>
              <li>← / → nooleklahvid korruste vahetamiseks</li>
              <li>1–9 kiireks hüppeks konkreetsele korrusele</li>
              <li>Taimer käivitub siis, kui lisad esimese põranda</li>
            </ul>
          </div>
        </section>

        <footer className="intro-foot">
          {onBack && (
            <button type="button" className="btn btn-ghost btn-lg intro-back" onClick={onBack}>
              ← {backLabel}
            </button>
          )}
          <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>
            Alusta →
          </button>
        </footer>
      </div>
    </div>
  )
}
