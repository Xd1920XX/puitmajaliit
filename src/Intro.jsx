const REQUIRED_MATERIALS = [
  {
    icon: '▬',
    label: 'Põrand',
    what: 'Põrandakonstruktsioon.',
    when: 'Lisada esimesena iga korruse puhul.',
  },
  {
    icon: '▦',
    label: 'Konstruktsioon',
    what: 'Kandev konstruktsioon. Vali 300 / 400 / 600 mm puitkarkass või CLT paneel.',
    when: 'Põranda järel — enne kõiki ülejäänud kihte.',
  },
  {
    icon: '◫',
    label: 'Jäikusseinad OSB',
    what: 'OSB plaadid karkassi peale. Vali naelutussamm: 50 / 70 / 100 mm.',
    when: 'Konstruktsiooni järel — ainult puitkarkassi puhul. CLT paneel ei vaja.',
  },
  {
    icon: '≋',
    label: 'Isolatsioon',
    what: 'Üks nupp — sisaldab seina + vannitoa mineraalvilla. Siseseintes täidab eelkõige akustilise isolatsiooni eesmärke. CLT puhul ainult vannituba.',
    when: 'Peale jäikusseinte, enne kipsplaate.',
  },
  {
    icon: '▭',
    label: 'Kipsplaadid',
    what: 'Isolatsioonile järgnevad kipsplaadid, mis võivad olla kas 1-s, 2-s või 3-s kihis. Rohkem kihte = parem tulekindlus.',
    when: 'Isolatsiooni järel — katab seina seestpoolt.',
  },
  {
    icon: '▌',
    label: 'Fassaad',
    what: 'Välimine kate — kaitseb seinad ilmastiku eest.',
    when: 'Peale kipsplaate, enne trepikoda.',
  },
  {
    icon: '↗',
    label: 'Trepikoda',
    what: 'Trepikoja segment — 1K maapinnal, 2K ülemistel korrustel.',
    when: 'Peale fassaadi — lisada igal korrusel.',
  },
  {
    icon: '═',
    label: 'Lagi',
    what: 'Laekonstruktsioon — sulgeb korruse.',
    when: 'Viimane kohustuslik samm — vajalik enne järgmise korruse ehitamist.',
  },
]

const OPTIONAL_MATERIALS = [
  {
    icon: '◰',
    label: 'Rõdu',
    what: 'Välisrõdu konstruktsioon.',
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

export default function Intro({ onStart }) {
  return (
    <div className="intro-overlay" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="intro-card">
        <header className="intro-head">
          <img src="/logo.png" alt="Woodhouse Academy" className="brand-logo intro-logo" />
          <div>
            <h1 id="intro-title">Puitmaja ehitamise simulaator</h1>
            <p className="intro-sub">Ehita puitmaja alt üles — kuni 10 korrust.</p>
          </div>
        </header>

        <section className="intro-body">
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
              <li>Taimer käivitub kui vajutad "Alusta"</li>
            </ul>
          </div>
        </section>

        <footer className="intro-foot">
          <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>
            Alusta →
          </button>
        </footer>
      </div>
    </div>
  )
}
