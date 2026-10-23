import './apiDocs.css'

const BASE_URL = 'https://europe-west1-puitmajaliit-game.cloudfunctions.net/api'
const SPA_BASE = 'https://puitmajaliit.netlify.app/api'

function Code({ children, lang }) {
  return (
    <pre className={`api-code${lang ? ` lang-${lang}` : ''}`}>
      <code>{children}</code>
    </pre>
  )
}

function Endpoint({ method, path, auth, children }) {
  const slug = `${method}-${path}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return (
    <section className="api-endpoint" id={slug}>
      <h3>
        <span className={`api-method api-method-${method.toLowerCase()}`}>{method}</span>
        <code>{path}</code>
      </h3>
      {auth && <p className="api-auth"><strong>Auth:</strong> {auth}</p>}
      {children}
    </section>
  )
}

export default function ApiDocs() {
  return (
    <div className="api-docs">
      <header className="api-head">
        <div className="api-head-inner">
          <a href="/" className="api-back">← Tagasi mängu</a>
          <h1>Puitmajaliit API</h1>
          <p className="api-sub">
            Virtuaalne mudeldaja — Woodhouse Academy integreerimise liides.
          </p>
        </div>
      </header>

      <main className="api-main">
        <nav className="api-toc" aria-label="Sisukord">
          <strong>Sisukord</strong>
          <ol>
            <li><a href="#baas-url">Baas-URL</a></li>
            <li><a href="#autentimine">Autentimine</a></li>
            <li><a href="#launch-flow">Launch flow</a></li>
            <li>
              Endpointid
              <ol>
                <li><a href="#get-api-health">GET /api/health</a></li>
                <li><a href="#post-api-game-results">POST /api/game/results</a></li>
                <li><a href="#get-api-academy-tasks">GET /api/academy/tasks</a></li>
                <li><a href="#get-api-academy-tasks-task-id-leaderboard">GET /api/academy/tasks/:task_id/leaderboard</a></li>
                <li><a href="#get-api-academy-users-email-results">GET /api/academy/users/:email/results</a></li>
                <li><a href="#post-api-admin-tasks">POST /api/admin/tasks</a></li>
                <li><a href="#delete-api-admin-tasks-id">DELETE /api/admin/tasks/:id</a></li>
              </ol>
            </li>
            <li><a href="#staatuskoodid">HTTP staatuskoodid</a></li>
            <li><a href="#secretid">Secretid</a></li>
          </ol>
        </nav>

        <article className="api-content">
          <section id="baas-url">
            <h2>Baas-URL</h2>
            <p><strong>Produktsioon (otse Cloud Functions):</strong></p>
            <Code>{BASE_URL}</Code>
            <p><strong>Produktsioon (Netlify same-origin proxy — SPA kasutab):</strong></p>
            <Code>{SPA_BASE}</Code>
            <p><strong>Emulaator (dev):</strong></p>
            <Code>http://localhost:5001/puitmajaliit-game/europe-west1/api</Code>
          </section>

          <section id="autentimine">
            <h2>Autentimine</h2>
            <p>
              Kaks sõltumatut skeemi, mõlemad <code>Authorization: Bearer &lt;token&gt;</code> päises.
            </p>

            <h3>1. Launch JWT — <code>/game/*</code> endpointid</h3>
            <ul>
              <li>Allkiri: <strong>HS256</strong>, shared secret <code>ACADEMY_JWT_SECRET</code>.</li>
              <li>Nõutud claim'id:
                <ul>
                  <li><code>iss</code> = <code>"woodhouse-academy"</code></li>
                  <li><code>aud</code> = <code>"virtuaalne-mudeldaja"</code></li>
                  <li><code>email</code> (string — serveris lowercase'itakse)</li>
                  <li><code>exp</code> (unix timestamp — soovitatud 5–15 min)</li>
                </ul>
              </li>
              <li>Valikulised claim'id: <code>name</code>, <code>return_url</code>, <code>iat</code>.</li>
            </ul>
            <p><strong>Payload näide:</strong></p>
            <Code lang="json">{`{
  "iss": "woodhouse-academy",
  "aud": "virtuaalne-mudeldaja",
  "email": "student@example.com",
  "name": "Mari Mets",
  "return_url": "https://academy.woodhouse.ee/mang/projekteeri",
  "iat": 1761148800,
  "exp": 1761149700
}`}</Code>

            <h3>2. M2M API Key — <code>/academy/*</code> + <code>/admin/*</code> endpointid</h3>
            <ul>
              <li>Staatiline Bearer token <code>ACADEMY_API_KEY</code>.</li>
              <li>Server-to-server kasutamiseks.</li>
              <li>Serveripool: constant-time string compare.</li>
              <li><strong>Mitte kunagi frontend koodis / brauseris.</strong></li>
            </ul>
          </section>

          <section id="launch-flow">
            <h2>Launch flow</h2>
            <ol>
              <li>Academy signib JWT kui kasutaja klõpsab "Asu projekteerima".</li>
              <li>Suuna brauser: <code>https://puitmajaliit.netlify.app/?launch_token=&lt;jwt&gt;</code>.</li>
              <li>Game SPA parsib tokeni, salvestab <code>sessionStorage</code>-isse, strip'ib URL'ist.</li>
              <li>SPA lisab <code>Authorization: Bearer &lt;jwt&gt;</code> iga <code>/api/game/*</code> päringu juurde.</li>
              <li>Server verifitseerib (<code>iss</code>, <code>aud</code>, <code>exp</code>, signature) iga päringu peal.</li>
              <li>Kui kasutaja lõpetab mängu → SPA POST-ib tulemuse <code>/api/game/results</code>-ile.</li>
              <li>Kui <code>return_url</code> tokenis → SPA kuvab tagasilingi.</li>
            </ol>
          </section>

          <h2 className="api-section-title">Endpointid</h2>

          <Endpoint method="GET" path="/api/health">
            <p>Health check. Auth puudub.</p>
            <p><strong>Response 200:</strong></p>
            <Code lang="json">{`{ "ok": true }`}</Code>
            <p><strong>curl:</strong></p>
            <Code lang="bash">{`curl ${BASE_URL}/health`}</Code>
          </Endpoint>

          <Endpoint method="POST" path="/api/game/results" auth="Bearer launch JWT">
            <p>Game SPA kutsub pärast ehitise esitamist.</p>
            <p><strong>Request body:</strong></p>
            <Code lang="json">{`{
  "task_id": "vm-001",
  "score": 140,
  "duration_seconds": 542,
  "finished_at": "2026-10-22T12:34:56.789Z",
  "floors_count": 10
}`}</Code>
            <table className="api-table">
              <thead>
                <tr><th>Väli</th><th>Tüüp</th><th>Nõutud</th><th>Kirjeldus</th></tr>
              </thead>
              <tbody>
                <tr><td><code>task_id</code></td><td>string</td><td>jah</td><td>Ülesande ID (nt <code>vm-001</code>)</td></tr>
                <tr><td><code>score</code></td><td>number</td><td>jah</td><td>0–150</td></tr>
                <tr><td><code>duration_seconds</code></td><td>number</td><td>jah</td><td>Ehitamise taimer sekundites</td></tr>
                <tr><td><code>finished_at</code></td><td>ISO8601</td><td>ei</td><td>Vaikimisi serveri <code>new Date()</code></td></tr>
                <tr><td><code>floors_count</code></td><td>number</td><td>ei</td><td>Ehitatud korruste arv</td></tr>
              </tbody>
            </table>
            <p><strong>Response 200:</strong></p>
            <Code lang="json">{`{
  "id": "AbCdEf123",
  "email": "student@example.com",
  "name": "Mari Mets",
  "task_id": "vm-001",
  "score": 140,
  "duration_seconds": 542,
  "floors_count": 10,
  "finished_at": "2026-10-22T12:34:56.789Z",
  "created_at": null
}`}</Code>
            <p><strong>Errorid:</strong></p>
            <ul>
              <li><code>400 bad_request</code> — puudu/vale <code>task_id</code>, <code>score</code>, <code>duration_seconds</code></li>
              <li><code>400 bad_finished_at</code> — mitte-parseeruv ISO</li>
              <li><code>401 missing_token</code> — Authorization päis puudub</li>
              <li><code>401 invalid_token</code> — JWT verify fail</li>
            </ul>
            <p><strong>curl:</strong></p>
            <Code lang="bash">{`curl -X POST ${BASE_URL}/game/results \\
  -H "Authorization: Bearer <launch_jwt>" \\
  -H "Content-Type: application/json" \\
  -d '{"task_id":"vm-001","score":140,"duration_seconds":542}'`}</Code>
          </Endpoint>

          <Endpoint method="GET" path="/api/academy/tasks" auth="Bearer ACADEMY_API_KEY">
            <p>Kõik aktiivsed ülesanded. Sorteeritud <code>sort_order ASC</code>, filtreeritud <code>is_active == true</code>.</p>
            <p><strong>Response 200:</strong></p>
            <Code lang="json">{`{
  "tasks": [
    {
      "id": "vm-001",
      "title": "Virtuaalne mudeldaja",
      "description": "Ehita puitmaja alt üles — kuni 10 korrust…",
      "image_url": "",
      "is_active": true,
      "sort_order": 1
    }
  ]
}`}</Code>
            <p><strong>Errorid:</strong> <code>401 invalid_api_key</code></p>
            <p><strong>curl:</strong></p>
            <Code lang="bash">{`curl -H "Authorization: Bearer <api_key>" \\
  ${BASE_URL}/academy/tasks`}</Code>
          </Endpoint>

          <Endpoint method="GET" path="/api/academy/tasks/:task_id/leaderboard" auth="Bearer ACADEMY_API_KEY">
            <p>Ühe ülesande TOP tulemus. Järjestus: <code>score DESC</code>, siis <code>duration_seconds ASC</code>.</p>
            <p><strong>Response 200 (tulemused olemas):</strong></p>
            <Code lang="json">{`{
  "task_id": "vm-001",
  "top_result": {
    "display_name": "Mari M.",
    "score": 150,
    "duration_seconds": 480
  }
}`}</Code>
            <p><strong>Response 200 (tulemusi pole):</strong></p>
            <Code lang="json">{`{ "task_id": "vm-001", "top_result": null }`}</Code>
            <p>
              <code>display_name</code> formaat: "Eesnimi P." (perekonnanime esimene täht). Üksikud nimed jäävad terveks.
            </p>
            <p><strong>Errorid:</strong> <code>401 invalid_api_key</code></p>
            <p><strong>curl:</strong></p>
            <Code lang="bash">{`curl -H "Authorization: Bearer <api_key>" \\
  ${BASE_URL}/academy/tasks/vm-001/leaderboard`}</Code>
          </Endpoint>

          <Endpoint method="GET" path="/api/academy/users/:email/results" auth="Bearer ACADEMY_API_KEY">
            <p>
              Konkreetse kasutaja parim + viimane tulemus per task. Email URL-encoded (nt <code>student%40example.com</code>). Server lowercase'ib.
            </p>
            <p><strong>Response 200:</strong></p>
            <Code lang="json">{`{
  "email": "student@example.com",
  "results": [
    {
      "task_id": "vm-001",
      "best_result": {
        "score": 150,
        "duration_seconds": 480,
        "finished_at": "2026-10-15T10:15:00.000Z"
      },
      "latest_result": {
        "score": 120,
        "duration_seconds": 601,
        "finished_at": "2026-10-16T09:40:00.000Z"
      }
    }
  ]
}`}</Code>
            <p>Kasutajal tulemusi pole: <code>{'{ "email": "...", "results": [] }'}</code></p>
            <p><strong>Errorid:</strong></p>
            <ul>
              <li><code>400 bad_email</code> — tühi email</li>
              <li><code>401 invalid_api_key</code></li>
            </ul>
            <p><strong>curl:</strong></p>
            <Code lang="bash">{`curl -H "Authorization: Bearer <api_key>" \\
  ${BASE_URL}/academy/users/student%40example.com/results`}</Code>
          </Endpoint>

          <Endpoint method="POST" path="/api/admin/tasks" auth="Bearer ACADEMY_API_KEY">
            <p>Loo / uuenda task (Firestore merge).</p>
            <p><strong>Request body:</strong></p>
            <Code lang="json">{`{
  "id": "vm-002",
  "title": "Teine ülesanne",
  "description": "…",
  "image_url": "https://…",
  "is_active": true,
  "sort_order": 2
}`}</Code>
            <table className="api-table">
              <thead>
                <tr><th>Väli</th><th>Tüüp</th><th>Nõutud</th><th>Default</th></tr>
              </thead>
              <tbody>
                <tr><td><code>id</code></td><td>string</td><td>jah</td><td>—</td></tr>
                <tr><td><code>title</code></td><td>string</td><td>jah</td><td>—</td></tr>
                <tr><td><code>description</code></td><td>string</td><td>ei</td><td><code>""</code></td></tr>
                <tr><td><code>image_url</code></td><td>string</td><td>ei</td><td><code>""</code></td></tr>
                <tr><td><code>is_active</code></td><td>boolean</td><td>ei</td><td><code>true</code></td></tr>
                <tr><td><code>sort_order</code></td><td>number</td><td>ei</td><td><code>1</code></td></tr>
              </tbody>
            </table>
            <p><strong>Response 200:</strong></p>
            <Code lang="json">{`{
  "id": "vm-002",
  "title": "Teine ülesanne",
  "description": "…",
  "image_url": "https://…",
  "is_active": true,
  "sort_order": 2
}`}</Code>
            <p><strong>Errorid:</strong></p>
            <ul>
              <li><code>400 bad_request</code> — puudu/vale <code>id</code> või <code>title</code></li>
              <li><code>401 invalid_api_key</code></li>
            </ul>
            <p><strong>curl:</strong></p>
            <Code lang="bash">{`curl -X POST ${BASE_URL}/admin/tasks \\
  -H "Authorization: Bearer <api_key>" \\
  -H "Content-Type: application/json" \\
  -d '{"id":"vm-002","title":"Teine ülesanne","sort_order":2}'`}</Code>
          </Endpoint>

          <Endpoint method="DELETE" path="/api/admin/tasks/:id" auth="Bearer ACADEMY_API_KEY">
            <p>Kustuta task.</p>
            <p><strong>Response 200:</strong></p>
            <Code lang="json">{`{ "id": "vm-002", "deleted": true }`}</Code>
            <p><strong>Errorid:</strong> <code>401 invalid_api_key</code></p>
            <p><strong>curl:</strong></p>
            <Code lang="bash">{`curl -X DELETE ${BASE_URL}/admin/tasks/vm-002 \\
  -H "Authorization: Bearer <api_key>"`}</Code>
          </Endpoint>

          <section id="staatuskoodid">
            <h2>HTTP staatuskoodid</h2>
            <table className="api-table">
              <thead>
                <tr><th>Kood</th><th>Tähendus</th></tr>
              </thead>
              <tbody>
                <tr><td>200</td><td>OK</td></tr>
                <tr><td>400</td><td><code>bad_request</code>, <code>bad_email</code>, <code>bad_finished_at</code> — vale payload</td></tr>
                <tr><td>401</td><td><code>missing_token</code>, <code>invalid_token</code>, <code>invalid_api_key</code> — auth fail</td></tr>
                <tr><td>500</td><td><code>internal</code> — serveri viga (logid: <code>firebase functions:log</code>)</td></tr>
              </tbody>
            </table>
            <p>Vearesponssid alati formaadis:</p>
            <Code lang="json">{`{ "error": "<code>" }`}</Code>
          </section>

          <section id="secretid">
            <h2>Secretid</h2>
            <p>Academy pool vajab:</p>
            <table className="api-table">
              <thead>
                <tr><th>Secret</th><th>Kasutus</th></tr>
              </thead>
              <tbody>
                <tr><td><code>ACADEMY_JWT_SECRET</code></td><td>JWT allkirjastamiseks (HS256, jagatud Game'iga)</td></tr>
                <tr><td><code>ACADEMY_API_KEY</code></td><td>Bearer võti server-to-server päringuteks</td></tr>
              </tbody>
            </table>
            <p>Secretid eraldi turvalise kanali kaudu — mitte avaldada repos ega chat'is.</p>
          </section>
        </article>
      </main>
    </div>
  )
}
