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

**Praegu:** puudub — Sidebar näitab `—`. Excel-loader tuleb hiljem.

**Tulevikus:** Exceli fail mappib iga korruse kihivalikute kombinatsiooni (karkassi variant × kihi olemasolu) punktideks. Vaja on:

1. Parser (`src/scoring/xlsxLoader.js`, kasuta `xlsx` NPM paketti või CSV-d).
2. Struktuur — arvatavasti lookup `{ [karkassId]: { [layerId]: n } }`, mida rakendatakse iga korruse peal ja summeeritakse.
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
