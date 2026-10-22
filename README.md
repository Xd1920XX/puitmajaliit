# Puitmajaliit

Puitmaja ehitussimulaator. Õpilane ehitab 10-korruselise puitmaja alt üles, valides igale korrusele materjali. Punktide arvutus tuleb Exceli failist (hiljem).

## Käivitamine

```bash
yarn install
yarn dev        # http://localhost:5174
yarn build      # produktsiooni build → dist/
yarn preview    # preview build
```

## Struktuur

```
public/
  house.glb              # 3D majamudel (aseta siia)
src/
  main.jsx               # React entry
  App.jsx                # Rakenduse root, olekuhaldus (korrused + skoor)
  App.css                # Layout + komponentide stiilid
  theme.css              # Brändi tokenid (värvid, fondid, radiused)
  HouseViewer.jsx        # R3F canvas + GLB laadimine + korruste nähtavus
  Sidebar.jsx            # Parem paneel: korruste nupud + materjalivalik
  config.js              # GLB URL, korruste arv, mesh-nimemustrid, materjalid
```

## 3D-mudel

`config.js:FLOOR_NODE_PATTERNS` proovib järgemööda mustreid:

1. `Korrus_1..10`
2. `Floor_1..10`
3. `Level_1..10`
4. `korrus1..10`

Esimene muster mis leiab kõik 10 mesh-nodet võidab. Kui mudel kasutab teistsugust nimetust, lisa muster massiivi.

Iga korrus on omaette mesh-node — nähtavust juhitakse `node.visible = true/false`, GLB ise laaditakse üks kord.

## Bränd

Värvid + fondid pärit Woodhouse Academy CSS-ist:

| Token                    | Väärtus     |
|--------------------------|-------------|
| `--brand-green`          | `#2e6347`   |
| `--brand-green-dark`     | `#1d4432`   |
| `--brand-cream`          | `#fbecc7`   |
| `--brand-cream-light`    | `#fff9e8`   |
| `--brand-accent`         | `#ff9c00`   |
| `--brand-ink`            | `#323334`   |
| `--brand-muted`          | `#665e52`   |
| `--font-body`            | Inter       |
| `--font-display`         | Fraunces    |

Aino/Etelka (originaalid) on tasulised — Inter + Fraunces (Google Fonts) on visuaalselt lähedased vabad asendajad.

## Olekumudel

`App.jsx` hoiab `floors` massiivi:

```js
[{ id: 1, built: false, materialId: null }, …]
```

- `toggle(id)` — lülita korruse ehitamine sisse/välja. Kui välja lülitatakse, tühjendab ka materjali.
- `setMaterial(id, materialId)` — määra korruse materjal.
- `reset()` / `buildAll()` — nupud sidebar allservas.

`builtFloors` (Set) läheb `HouseViewer`-isse ja mappib GLB mesh-nodede nähtavusele.

## Skoor (placeholder)

Praegu 1 punkt iga ehitatud korruse eest millel on materjal valitud. Excel-loader (tuleb) asendab loogika: iga materjalivalik iga korruse kohta annab omakaaluga punktid.

## Järgmised sammud

- [ ] Excel-punktitabeli parser (materjal × korrus → punktid).
- [ ] Materjalikataloogi laiendus (`config.js:MATERIALS`) päris andmetega.
- [ ] `house.glb` asendus päris mudeliga + `FLOOR_NODE_PATTERNS` kontroll.
- [ ] Lõpuekraan (kokkuvõte + soovitused).

## Woodhouse Academy integratsioon

MVP toetab Academy launch flow'd + skoori sünkroniseerimist Firebase'i kaudu. Täispilt + käsud: vt `CLAUDE.md` → "Academy integratsioon".

### Praegune seadistus

| Komponent | Väärtus |
|---|---|
| Firebase projekt | `puitmajaliit-game` |
| Cloud Functions URL | `https://europe-west1-puitmajaliit-game.cloudfunctions.net/api` |
| Frontend host | Netlify (vt `netlify.toml`) |
| Firestore region | europe-west1 |
| Secret: JWT | Secret Manager `ACADEMY_JWT_SECRET` |
| Secret: API key | Secret Manager `ACADEMY_API_KEY` |
| Seeditud ülesanne | `tasks/vm-001` |

### Kohalik dev

```bash
yarn install
yarn dev        # http://localhost:5174

# Emulaator (eraldi terminal)
cd functions && yarn install && yarn serve

# Mint test launch URL
cd functions && ACADEMY_JWT_SECRET=dev-secret \
  GAME_URL=http://localhost:5174 \
  node scripts/mint-launch-token.js student@example.com "Mari Mets"
# → ava väljund URL brauseris
```

### Netlify deploy

1. Push repo GitHubi.
2. Netlify → "Add new site" → "Import existing project" → vali repo.
3. Build command + publish dir tulevad `netlify.toml`-ist automaatselt (`yarn install && yarn build` → `dist/`).
4. Deploy. Env'id (`.env.production`) commititakse koos repoga.

**Redirect:** Netlify proxyb `/api/**` → `https://europe-west1-puitmajaliit-game.cloudfunctions.net/api/:splat` same-origin'ina.

### Backend deploy (muudatuste korral)

```bash
cd functions && yarn install
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
```

### Baas-URL

Produktsioon (Firebase Hosting rewrite):
```
https://<project-id>.web.app/api
```
Või otse Cloud Functions:
```
https://europe-west1-<project-id>.cloudfunctions.net/api
```
Emulaator:
```
http://localhost:5001/<project-id>/europe-west1/api
```

### Autentimine

Kaks sõltumatut skeemi, mõlemad `Authorization: Bearer <token>` päises.

**1. Launch JWT** (`/game/*` endpoint'id)
- Signib: Academy backend, HS256 shared secret `ACADEMY_JWT_SECRET`.
- Nõutud claim'id:
  - `iss` = `"woodhouse-academy"`
  - `aud` = `"virtuaalne-mudeldaja"`
  - `email` (string, lowercase'itakse serveris)
  - `exp` (unix timestamp, soovitatud 5–15 min alates `iat`-ist)
- Valikulised claim'id:
  - `name` (string, kui puudub → kasutab email)
  - `return_url` (string, Game kasutab "Tagasi Academy'sse" nupus)
  - `iat` (unix timestamp)

Näide (JWT payload):
```json
{
  "iss": "woodhouse-academy",
  "aud": "virtuaalne-mudeldaja",
  "email": "student@example.com",
  "name": "Mari Mets",
  "return_url": "https://academy.woodhouse.ee/mang/projekteeri",
  "iat": 1761148800,
  "exp": 1761149700
}
```

Launch flow:
1. Academy signib JWT kui kasutaja klõpsab "Asu projekteerima".
2. Academy suunab brauseri: `https://<game>/?launch_token=<jwt>` (uues tabis või samas).
3. Game SPA parsib tokeni, salvestab `sessionStorage`-isse, strip'ib URL'ist.
4. Game SPA lisab Bearer päise iga `/api/game/*` päringu juurde.
5. Server verifitseerib JWT iga päringu peal (`iss`, `aud`, `exp`, signature).

**2. M2M API Key** (`/academy/*` endpoint'id)
- Staatiline Bearer token `ACADEMY_API_KEY`.
- Jagatud Academy backendi env'is.
- Serverpool: constant-time string compare.
- MITTE kunagi avaldada frontend koodis.

---

### POST `/api/game/results`

Mäng salvestab tulemuse pärast katuse paigaldust.

**Auth:** Bearer launch JWT

**Request body:**
```json
{
  "task_id": "vm-001",
  "score": 140,
  "duration_seconds": 542,
  "finished_at": "2026-10-22T12:34:56.789Z",
  "floors_count": 10
}
```

| Väli | Tüüp | Nõutud | Kirjeldus |
|---|---|---|---|
| `task_id` | string | jah | Ülesande ID (nt `vm-001`) |
| `score` | number | jah | 0–150 (vt `src/scoring.js`) |
| `duration_seconds` | number | jah | Taimer ehitamiseks |
| `finished_at` | ISO8601 string | ei | Vaikimisi serveri `new Date()` |
| `floors_count` | number | ei | Mitu korrust ehitatud |

**Response 200:**
```json
{
  "id": "AbCdEf123",
  "email": "student@example.com",
  "name": "Mari Mets",
  "task_id": "vm-001",
  "score": 140,
  "duration_seconds": 542,
  "floors_count": 10,
  "finished_at": "2026-10-22T12:34:56.789Z",
  "created_at": null
}
```

**Error vastused:**
- `400 bad_request` — puudu/vale `task_id`, `score`, `duration_seconds`
- `400 bad_finished_at` — mitte-parseeruv ISO string
- `401 missing_token` — puudub `Authorization` päis
- `401 invalid_token` — JWT verify fail (signature/iss/aud/exp)

**curl:**
```bash
curl -X POST https://<base>/api/game/results \
  -H "Authorization: Bearer <launch_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"task_id":"vm-001","score":140,"duration_seconds":542}'
```

---

### GET `/api/academy/tasks`

Kõik aktiivsed ülesanded.

**Auth:** Bearer `ACADEMY_API_KEY`

**Response 200:**
```json
{
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
}
```

Sorteeritud `sort_order` järgi. Filtreeritud `is_active == true`.

**Error vastused:**
- `401 invalid_api_key`

**curl:**
```bash
curl -H "Authorization: Bearer <api_key>" \
  https://<base>/api/academy/tasks
```

---

### GET `/api/academy/tasks/:task_id/leaderboard`

Ühe ülesande TOP tulemus.

**Auth:** Bearer `ACADEMY_API_KEY`

**Response 200 (tulemused olemas):**
```json
{
  "task_id": "vm-001",
  "top_result": {
    "display_name": "Mari M.",
    "score": 150,
    "duration_seconds": 480
  }
}
```

**Response 200 (tulemusi pole):**
```json
{ "task_id": "vm-001", "top_result": null }
```

`display_name` genereeritakse formaadis "Eesnimi P." (perekonnanime esimene täht). Üksikud nimed jäävad terveks.

Järjestus: `score DESC`, `duration_seconds ASC`.

**Error vastused:**
- `401 invalid_api_key`

**curl:**
```bash
curl -H "Authorization: Bearer <api_key>" \
  https://<base>/api/academy/tasks/vm-001/leaderboard
```

---

### GET `/api/academy/users/:email/results`

Konkreetse kasutaja parim + viimane tulemus per task.

**Auth:** Bearer `ACADEMY_API_KEY`

Email URL-encoded (nt `student%40example.com`). Server lowercase'ib.

**Response 200:**
```json
{
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
}
```

Kui kasutajal tulemusi pole: `{ "email": "...", "results": [] }`.

**Error vastused:**
- `400 bad_email` — tühi email
- `401 invalid_api_key`

**curl:**
```bash
curl -H "Authorization: Bearer <api_key>" \
  https://<base>/api/academy/users/student%40example.com/results
```

---

### HTTP staatuskoodid kokkuvõttes

| Kood | Tähendus |
|---|---|
| 200 | OK |
| 400 | `bad_request`, `bad_email`, `bad_finished_at` — vale payload |
| 401 | `missing_token`, `invalid_token`, `invalid_api_key` — auth fail |
| 500 | `internal` — serveri viga (vt logid: `firebase functions:log`) |

Vearesponssid alati formaadis:
```json
{ "error": "<code>" }
```

---

### Admin-vaade (Firebase Console)

Firestore kirjed on Admin SDK alt kirjutatud — client access on `firestore.rules` all keelatud. Vaata/muuda andmeid Firebase Console'is või Admin SDK skriptidega (vt `scripts/seed-task.js` näide).

Lisa / muuda ülesanne:
```js
// scripts/seed-task.js stiilis
await db.collection('tasks').doc('vm-002').set({
  title: 'Teine ülesanne',
  description: '…',
  image_url: 'https://…',
  is_active: true,
  sort_order: 2,
}, { merge: true })
```
