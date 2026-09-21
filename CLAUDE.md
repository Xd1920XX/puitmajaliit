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

**Stack:** React 19 + Vite 8 + React Three Fiber + Drei. Ei mingit Firebase'i, autentimist ega routingut — standalone üheleherakendus.

**Domeen:** puitmaja ehituse õpetuslik simulaator. Kasutaja ehitab **kuni 10 korrust** alt üles. Iga korrus koosneb 4 kihist mis lisatakse kindlas järjekorras. Iga korruse jaoks võib valida erineva karkassi variandi.

## Ehitusloogika

Ühe korruse **4 alamsammu** (linear gate — järgmine avaneb ainult siis kui eelmine tehtud):

1. **Karkass** — vali variant (`300`, `400`, `600`, `CLT`)
2. **Vahelaed** (`horisontaal`) — toggle
3. **Kips** — toggle
4. **Fassaad** — toggle

Korrus N+1 avaneb ainult siis kui korrus N on **täielikult valmis** (kõik 4 sammu). Kasutaja võib igal ajal minna tagasi ja mõnda tehtud korrust muuta (nt karkassi variandi vahetada).

**Parkla** on baseline, alati nähtav, ei muutu.

**Kasutaja ei pea 10-ni ehitama** — võib igal ajal peatuda. Renderdatakse ainult see mida kasutaja on ehitanud.

## Kihtide vertikaalne stack

Iga GLB = üks korrus. `HouseViewer` renderdab iga korruse `<group position={[0, i*FLOOR_HEIGHT, 0]}>`-i sees. `FLOOR_HEIGHT = 3.0m` (`config.js`).

**Sama GLB võib renderduda mitmes korruses** (nt CLT karkass korrustel 1, 2, 3). Seetõttu iga `Model` komponent teeb `scene.clone(true)` `useMemo`-s — three.js ei luba sama `Object3D`-l olla kaks parenti. Geomeetria ja materjalid on jagatud (clone deep-klooniib ainult scene graph), nii et mälukulu on väike.

Kui GLB origin pole korruse alumises pinnas (Y=0) või kõrgus pole 3.0m → visuaal ei stack'i õigesti. Kas paranda Blender export, või lisa per-model offset `HouseViewer.jsx:Floor`-is.

## Andmevoog

```
App.jsx (olek: { floors: [10x Floor], selectedFloorId })
  ├─ HouseViewer.jsx  (renderdab kõik floors iga oma Y-offsetiga, clone per instance)
  └─ Sidebar.jsx      (chip-navigaator 1..10 + valitud korruse 4 alamsammu paneel)
```

`Floor` olekukuju:
```js
{ id: 1..10,
  karkass: null | '300' | '400' | '600' | 'CLT',
  horisontaal: boolean,
  kips: boolean,
  fassaad: boolean }
```

`selectedFloorId` = kasutaja poolt valitud korrus (see mille alamsammud paneelis näidatakse). Vaikimisi 1.

## GLB failid

```
public/GLB/
  Parkla.glb                    # baseline site — always visible
  Karkass_300.glb               # karkassi variandid (üks per korrus)
  Karkass_400.glb
  Karkass_600.glb
  Karkass_CLT.glb
  Horisontaalkonst.glb          # vahelaed
  Kips_2kihiline.glb            # sisemine kipsplaat
  Fassaad.glb                   # välimine fassaad
```

URL-id + variandid: `src/config.js` (`PARKLA_URL`, `KARKASS_VARIANTS`, `LAYERS`, `FLOOR_STEPS`, `MAX_FLOORS`, `FLOOR_HEIGHT`).

`HouseViewer.jsx` allservas preload'itakse kõik GLB-d et togglid ei stall'iks võrgu peale.

## Sidebar UX

- **Chip-navigaator** ülal: 10 nuppu (1..10). Tehtud rohelised, aktiivne oranži border'iga, lukustatud pooltuhmid. Klõps hüppab sinna korrusele. Prev/next nooled kõrval.
- **Korruse paneel**: näitab valitud korruse 4 alamsammu järjekorras. Hilisemad sammud `disabled` kuni eelmine on tehtud.
- Kasutaja saab minna tagasi ühelegi tehtud korrusele ja muuta valikuid (nt karkassi variant).

## Brändi tokenid

Kõik värvid + fondid on `src/theme.css` `:root` all CSS custom property'idena. Komponendid loevad ainult neid — mitte hardcoded hex-koode. Kui vaja brändi kohandada, muuda ainult `theme.css`.

Fondid tulevad Google Fonts CDN-ist (`index.html`). Aino ja Etelka (Woodhouse Academy originaalid) on tasulised — Inter (body) + Fraunces (headings) on lähim vaba paar.

## Skoor

**Praegu:** puudub — Sidebar näitab `—`. Excel-loader tuleb hiljem.

**Tulevikus:** Exceli fail mappib iga korruse kihivalikute kombinatsiooni (karkassi variant × kihi olemasolu) punktideks. Vaja on:

1. Parser (`src/scoring/xlsxLoader.js`, kasuta `xlsx` NPM paketti või CSV-d).
2. Struktuur — arvatavasti lookup `{ [karkassId]: { horisontaal: n, kips: n, fassaad: n } }`, mida rakendatakse iga korruse peal ja summeeritakse.
3. Uus `useMemo` `App.jsx`-is mis arvutab kogutulemi `floors`-ist.

Ära tee kihilist state managerit (Redux, Zustand) — üks `useState` `App.jsx`-is piisab.

## Failistruktuur

| Fail                        | Roll                                                                    |
|-----------------------------|-------------------------------------------------------------------------|
| `index.html`                | Vite entry, Google Fonts link, `<div id="root">`                        |
| `vite.config.js`            | Port 5174 override                                                      |
| `src/main.jsx`              | React root mount + globaalsete CSS-ide import                           |
| `src/App.jsx`               | Rakenduse root, floors + selectedFloorId olek, layout                   |
| `src/App.css`               | Layout + stepper/variant/layer/chip-navigaator stiilid                  |
| `src/theme.css`             | Brändi tokenid, base typography reset                                   |
| `src/HouseViewer.jsx`       | R3F Canvas, mitme GLB clone-based render Y-offsetiga, preload           |
| `src/Sidebar.jsx`           | Chip-navigaator + valitud korruse alamsammude paneel                    |
| `src/config.js`             | GLB URL-id, variandid, layers, FLOOR_STEPS, MAX_FLOORS, FLOOR_HEIGHT    |
| `public/GLB/*.glb`          | Kihtide 3D-mudelid                                                      |

## Uue kihi lisamine (per-floor toggle)

1. Aseta GLB `public/GLB/`-i.
2. Lisa kirje `LAYERS`-i (`config.js`).
3. Lisa vastav `FLOOR_STEPS`-i kirje (`kind: 'toggle'`) õigesse järjekorda.
4. Lisa vaikeväärtus `false` `App.jsx:initialFloors` iga korruse objekti ja `buildAll` funktsiooni.
5. Lisa render `HouseViewer.jsx:Floor`-is.

## Karkassi variandi lisamine

Ainult `config.js:KARKASS_VARIANTS`. Kõik ülejäänu (Sidebar variandi radio group, HouseViewer valik) loeb sealt automaatselt.

## Korruste arvu muutmine

Muuda `config.js:MAX_FLOORS`. Sidebar chip-grid on hardcoded `repeat(10, 1fr)` `App.css`-is — muuda kui arv ei ole 10.

## Korrusekõrguse muutmine

Muuda `config.js:FLOOR_HEIGHT`. Kaamera positsioon ja `OrbitControls.target` `HouseViewer.jsx`-is arvutavad selle põhjal — võib vajada käsitsi kohandust suuremate väärtuste jaoks.

## Uue nupu / paneeli lisamine

Stiili paneb `App.css`-i, mitte inline. Kasuta olemasolevaid CSS-tokene (`--brand-*`, `--radius`, `--shadow-*`). Kui vajad uut väärtust, lisa `theme.css`-i.
