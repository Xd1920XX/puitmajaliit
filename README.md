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
