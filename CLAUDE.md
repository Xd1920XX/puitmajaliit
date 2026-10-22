# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Käsud

```bash
yarn install
yarn dev        # Vite dev server → http://localhost:5174
yarn build      # produktsiooni build → dist/
yarn preview    # preview produktsiooni build
```

Port 5174 määratud `vite.config.js`-is (mitte Vite default 5173). Lint / test — pole seadistatud.

## Reegel: keel

**Kogu kasutajale nähtav tekst peab olema eesti keeles.** Sh UI-stringid, veateated, tootenimed, brändielemendid. Koodikommentaarid võivad olla inglise keeles (arendaja-jaoks).

## Arhitektuur

**Stack:** React 19 + Vite 8 + React Three Fiber + Drei frontendi poolel. **Firebase (Firestore + Cloud Functions v2)** backendi poolel — ainult Academy integreerimiseks (tulemuste salvestus + Academy API). Pole routingut — SPA on ikka üheleherakendus.

**Domeen:** puitmaja ehituse õpetuslik simulaator. Kasutaja ehitab **kuni 10 korrust** alt üles. Iga korrus koosneb mitmest kihist, mis lisatakse kindlas järjekorras. Iga korruse jaoks võib valida erineva karkassi variandi.

## Ehitusloogika

Ühe korruse alamsammud (linear gate — järgmine kohustuslik samm avaneb ainult siis kui eelmine kohustuslik tehtud; valikulised sammud ei blokeeri järgnevaid):

1. **Põrand** — toggle (kohustuslik, esimene)
2. **Karkass** — variant (`300`, `400`, `600`, `CLT`) — kohustuslik
3. **Jäikusseinad OSB** — toggle (kohustuslik)
4. **Soojustusvill** — toggle (kohustuslik)
5. **Soojustus (vannituba)** — toggle (valikuline)
6. **Kips** — toggle (kohustuslik)
7. **Rõdu** — toggle (valikuline)
8. **Fassaad** — toggle (kohustuslik)
9. **Lagi** — toggle (kohustuslik, sulgeb korruse)
10. **Katus** — toggle (valikuline, tavaliselt ülemisel korrusel)

Täpne loetelu + metadata: `src/config.js:FLOOR_STEPS`. Valikuline samm on märgitud `optional: true` lipuga.

Korrus loetakse valmis kui kõik **mittevalikulised** sammud on tehtud. Korrus N+1 avaneb ainult siis kui korrus N on valmis. Kasutaja võib igal ajal minna tagasi ja muuta valikuid.

**Baseline** (alati nähtav): maa-alune parkla, maapinna parkla, maapinna rõdu — kolm GLB-d, `BASELINE_URLS`.

**Trepikoda** on automaatne — pole kasutaja valik. Floor 1 saab `Trepikoda_1K.glb` (maapinna segment), floor 2..10 saavad `Trepikoda_2K.glb` igaüks. Renderdub kui korrusel on vähemalt üks samm tehtud (`isFloorStarted`).

**Kasutaja ei pea 10-ni ehitama** — võib igal ajal peatuda.

## Kihtide vertikaalne stack

Iga GLB = üks korrus (välja arvatud baseline + trepikoda, vt allpool). `HouseViewer` renderdab iga korruse `<group position={[0, i*FLOOR_HEIGHT, 0]}>`-i sees. `FLOOR_HEIGHT = 3.0m` (`config.js`).

**Sama GLB võib renderduda mitmes korruses** (nt CLT karkass korrustel 1, 2, 3). Seetõttu iga `Model` komponent teeb `scene.clone(true)` `useMemo`-s — three.js ei luba sama `Object3D`-l olla kaks parenti. Geomeetria ja materjalid on jagatud (clone deep-klooniib ainult scene graph), nii et mälukulu on väike.

**Trepikoda 2K eriloogika:** Trepikoda_2K GLB geomeetria on 1 korruse võrra origin-ist kõrgemal. Seetõttu renderdatakse upper-floor trepikoda sees-grupis offset `-FLOOR_HEIGHT`, et visuaal langeks õige korruse peale. Vt `HouseViewer.jsx:Floor`.

Kui mõni teine GLB origin pole korruse alumises pinnas (Y=0) või kõrgus pole 3.0m → visuaal ei stack'i õigesti. Kas paranda Blender export, või lisa per-model offset.

## Andmevoog

```
App.jsx (olek: { floors: [10x Floor], selectedFloorId })
  ├─ HouseViewer.jsx  (renderdab baseline + kõik floors Y-offsetiga, clone per instance)
  └─ Sidebar.jsx      (chip-navigaator 1..10 + valitud korruse alamsammude paneel)
```

`Floor` olekukuju tuletub `FLOOR_STEPS`-ist automaatselt (`App.jsx:emptyFloor`):
```js
{ id: 1..10,
  porand: boolean,
  karkass: null | '300' | '400' | '600' | 'CLT',
  jaikus: boolean,
  soojustus: boolean,
  soojustus_vannituba: boolean,
  kips: boolean,
  rodu: boolean,
  fassaad: boolean,
  lagi: boolean,
  katus: boolean }
```

`selectedFloorId` = kasutaja poolt valitud korrus (see mille alamsammud paneelis näidatakse). Vaikimisi 1.

## GLB failid

```
public/GLB/
  Parkla.glb                   # baseline — maa-alune parkla
  Maapind_Parkla.glb           # baseline — maapinna parkla
  Rodu_Maapinnal.glb           # baseline — maapinna rõdu
  Karkass_300.glb              # karkassi variandid (üks per korrus)
  Karkass_400.glb
  Karkass_600.glb
  Karkass_CLT.glb
  Trepikoda_1K.glb             # trepikoja maapinna segment (floor 1)
  Trepikoda_2K.glb             # trepikoja korduv segment (floor 2+, offset -FLOOR_HEIGHT)
  Jaikusseinad_OSB.glb
  Soojustusvill.glb
  Soojustusvill_Vannituba.glb
  Kips_2kihiline.glb
  Porand.glb
  Lagi.glb
  Rodu.glb
  Fassaad.glb
  Katused.glb
```

URL-id + variandid: `src/config.js` (`BASELINE_URLS`, `KARKASS_VARIANTS`, `TREPIKODA_GROUND_URL`, `TREPIKODA_UPPER_URL`, `LAYERS`, `FLOOR_STEPS`, `MAX_FLOORS`, `FLOOR_HEIGHT`).

`HouseViewer.jsx` allservas preload'itakse kõik GLB-d et togglid ei stall'iks võrgu peale.

## Sidebar UX

- **Chip-navigaator** ülal: 10 nuppu (1..10). Tehtud rohelised, aktiivne oranži border'iga, lukustatud pooltuhmid. Klõps hüppab sinna korrusele. Prev/next nooled kõrval.
- **Korruse paneel**: näitab valitud korruse alamsammud järjekorras. Hilisemad kohustuslikud sammud `disabled` kuni eelmine kohustuslik tehtud; valikulised ei luku järgnevaid.
- Valikuline samm on märgitud "· valikuline" sildiga + katkendjoonega border'iga (`.step.is-optional`).
- Kasutaja saab minna tagasi ühelegi tehtud korrusele ja muuta valikuid.

## Brändi tokenid

Kõik värvid + fondid on `src/theme.css` `:root` all CSS custom property'idena. Komponendid loevad ainult neid — mitte hardcoded hex-koode. Kui vaja brändi kohandada, muuda ainult `theme.css`.

Fondid tulevad Google Fonts CDN-ist (`index.html`). Aino ja Etelka (Woodhouse Academy originaalid) on tasulised — Inter (body) + Fraunces (headings) on lähim vaba paar.

## Skoor

Punktid tulevad `src/scoring.js`-ist. Karkass + OSB tabelid per korrus (vt failis). Max 150 (10 × 15). `evaluateGame(floors)` tagastab `{ total, perFloor, message }` — kus `message` on üks lõppteavitus prioriteedi järgi. Sidebar + submit modal kasutavad seda otse. Punktide tabeli muutmiseks muuda ainult `scoring.js`-i.

## Academy integratsioon

MVP skoop:
- Game = see repo (mäng + Firebase backend).
- Academy = eraldi süsteem, mis kasutab game API-t.
- Launch flow: Academy signib HS256 JWT ja suunab kasutaja `?launch_token=<jwt>`-ga mängu.
- Game kuvab kasutaja (email + name) üleval `AcademyBar`-is; võimaldab tagasilinki.
- Mängu lõpus (ehitis esitatud) → POST tulemus `/api/game/results` kaudu Firebase Functions-i, mis verifitseerib JWT ja kirjutab Firestore'i `results/` kollektsiooni.
- Academy backend päri API-t Bearer API-key-ga: `GET /api/academy/tasks`, `/academy/tasks/{id}/leaderboard`, `/academy/users/{email}/results`.

### Failistruktuur (Academy)

```
src/academy/
  config.js         # VITE_API_BASE, TASK_ID, DEFAULT_RETURN_URL
  launchToken.js    # URL-param parse + sessionStorage; decode-only (verify on server)
  api.js            # submitResult() → POST /api/game/results
  AcademyBar.jsx    # top-bar nimi + email + "Tagasi Academy'sse" nupp
  academy.css      # bar + submit status
functions/
  index.js          # Express app Firebase Functions v2-s
  package.json
firebase.json       # hosting rewrites /api/** → api fn (region europe-west1)
firestore.rules     # kõik client access deny — kõik läbi Functions
firestore.indexes.json
scripts/
  seed-task.js      # tasks/vm-001 initial seed
  mint-launch-token.js  # testimine: mint JWT dev secrete'iga
```

### JWT formaat (Academy ↔ Game)

- Allkiri: HS256 shared secret `ACADEMY_JWT_SECRET`.
- `iss`: `woodhouse-academy`
- `aud`: `virtuaalne-mudeldaja`
- Payload: `{ email, name, return_url, iat, exp }`
- Soovitatud kehtivusaeg: 5–15 min (SPA hoiab tokeni ainult sessionStorage'is, mitte localStorage).

### Secrets

Produktsioonis:
```
firebase functions:secrets:set ACADEMY_JWT_SECRET
firebase functions:secrets:set ACADEMY_API_KEY
```
Kohalik emulaator: `functions/.env.local` (vt `functions/.env.example`).

### Frontend env

`.env.local` (Vite):
```
VITE_API_BASE=/api                       # või täielik Functions URL
VITE_TASK_ID=vm-001
VITE_ACADEMY_RETURN_URL=https://...
```

Kui `VITE_API_BASE` on tühi → mäng töötab anonüümselt (ei submit midagi, confirm-modal näitab "Anonüümne mäng").

### Praegune deploy olek

- **Firebase projekt:** `puitmajaliit-game`
- **Firestore:** europe-west1 region, `(default)` database
- **Cloud Functions URL:** `https://europe-west1-puitmajaliit-game.cloudfunctions.net/api`
- **Secretid Secret Manager'is:** `ACADEMY_JWT_SECRET`, `ACADEMY_API_KEY`
- **SPA host:** Netlify (vt `netlify.toml`); `/api/**` proxy'tud Cloud Functionsile.

### Käsud (Firebase backend)

```bash
cd functions && yarn install           # või npm install
firebase login                          # ühekordne

# Emulaator (dev)
cd functions && yarn serve

# Deploy järjekorras
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
# Hosting EI deploy'ta — kasutame Netlifyt frontendile.

# Seed/update task (admin endpoint, API_KEY-ga)
API_KEY=$(firebase functions:secrets:access ACADEMY_API_KEY)
curl -X POST https://europe-west1-puitmajaliit-game.cloudfunctions.net/api/admin/tasks \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id":"vm-001","title":"Virtuaalne mudeldaja","description":"…","is_active":true,"sort_order":1}'

# Mint test launch token kohalikult (dev)
cd functions && ACADEMY_JWT_SECRET=dev-secret \
  GAME_URL=http://localhost:5174 \
  node scripts/mint-launch-token.js student@example.com "Mari Mets"

# Mint test token päris JWT secretiga
cd functions && ACADEMY_JWT_SECRET=$(firebase functions:secrets:access ACADEMY_JWT_SECRET) \
  GAME_URL=https://<netlify-site>.netlify.app \
  node scripts/mint-launch-token.js student@example.com "Mari Mets"
```

### Netlify deploy

**Esimene seadistus:**
1. Push repo GitHubi.
2. Netlify UI → "Add new site" → "Import existing project" → vali repo.
3. Build command + publish dir tulevad `netlify.toml`-ist automaatselt.
4. Deploy. URL'iks saad `<site>.netlify.app` (saad custom domaini seada).

Env'id (`.env.production`) commititakse koos repoga — Netlify loeb automaatselt. Override Netlify UI → Site settings → Environment variables kui vaja.

**Redirect flow:**
- Brauser → `GET https://<site>.netlify.app/api/game/results`
- Netlify edge → proxy → `https://europe-west1-puitmajaliit-game.cloudfunctions.net/api/game/results`
- Vastus tagasi same-origin ilma CORS'ita.

**Headerid:** `netlify.toml` seadistab turva-headerid (X-Frame-Options jne) + agresiivse cache GLB-dele + /assets'ile.

### Firestore skeem

```
tasks/{taskId}        { title, description, image_url, is_active, sort_order }
results/{autoId}      { email, name, task_id, score, duration_seconds,
                        floors_count, finished_at (ISO), created_at (ts) }
```

Kõik client access on `firestore.rules`-is keelatud — Admin SDK Functions'i sees möödub rules'ist.

### Vastutuse jaotus

- Game SPA (Netlify): ainult POST /api/game/results (user Bearer = launch JWT).
- Game Functions (Firebase): JWT verify, Firestore write + Academy read endpoints + admin task CRUD.
- Academy SPA/backend: mäng-vaate renderdus, launch JWT allkirjastamine, Academy API päringud oma Bearer API-key-ga.

### Admin endpointid

Mõlemad kasutavad `ACADEMY_API_KEY`-d (sama mis Academy read'id). Piirang: võtme leke = atacker saab tasks muuta. Produktsioonis tasuks eraldi `ADMIN_API_KEY` lisada.

- `POST /api/admin/tasks` — loo/uuenda task (merge). Body `{id, title, description?, image_url?, is_active?, sort_order?}`.
- `DELETE /api/admin/tasks/:id` — kustuta task.

## Failistruktuur

| Fail                        | Roll                                                                    |
|-----------------------------|-------------------------------------------------------------------------|
| `index.html`                | Vite entry, Google Fonts link, `<div id="root">`                        |
| `vite.config.js`            | Port 5174 override                                                      |
| `src/main.jsx`              | React root mount + globaalsete CSS-ide import                           |
| `src/App.jsx`               | Rakenduse root, floors + selectedFloorId olek, layout                   |
| `src/App.css`               | Layout + stepper/variant/layer/chip-navigaator stiilid                  |
| `src/theme.css`             | Brändi tokenid, base typography reset                                   |
| `src/HouseViewer.jsx`       | R3F Canvas, mitme GLB clone-based render Y-offsetiga, trepikoda-auto, preload |
| `src/Sidebar.jsx`           | Chip-navigaator + valitud korruse alamsammude paneel                    |
| `src/config.js`             | GLB URL-id, variandid, layers, FLOOR_STEPS, MAX_FLOORS, FLOOR_HEIGHT    |
| `public/GLB/*.glb`          | Kihtide 3D-mudelid                                                      |

## Uue kihi lisamine (per-floor toggle)

1. Aseta GLB `public/GLB/`-i.
2. Lisa kirje `LAYERS`-i (`config.js`).
3. Lisa vastav `FLOOR_STEPS`-i kirje (`kind: 'toggle'`) õigesse järjekorda. Vajadusel `optional: true`.
4. Floor olek + Sidebar + HouseViewer render on data-driven FLOOR_STEPS-ist — midagi muud muuta pole vaja.

## Karkassi variandi lisamine

Ainult `config.js:KARKASS_VARIANTS`. Kõik ülejäänu (Sidebar variandi radio group, HouseViewer valik) loeb sealt automaatselt.

## Uue variandi grupi lisamine (nt alternatiivne per-korrus valik)

1. Loo variantide massiiv `config.js`-is (nt `KATUS_VARIANTS = [...]`).
2. Lisa `FLOOR_STEPS`-i uus kirje `{ kind: 'variant', variants: KATUS_VARIANTS, ... }`.
3. Sidebar `VariantGrid` ja HouseViewer `variantUrl` käituvad sellega automaatselt.

## Korruste arvu muutmine

Muuda `config.js:MAX_FLOORS`. Sidebar chip-grid on hardcoded `repeat(10, 1fr)` `App.css`-is — muuda kui arv ei ole 10.

## Korrusekõrguse muutmine

Muuda `config.js:FLOOR_HEIGHT`. Kaamera positsioon ja `OrbitControls.target` `HouseViewer.jsx`-is arvutavad selle põhjal — võib vajada käsitsi kohandust suuremate väärtuste jaoks. Trepikoda 2K offset kasutab samuti seda konstanti.

## Uue nupu / paneeli lisamine

Stiili paneb `App.css`-i, mitte inline. Kasuta olemasolevaid CSS-tokene (`--brand-*`, `--radius`, `--shadow-*`). Kui vajad uut väärtust, lisa `theme.css`-i.
