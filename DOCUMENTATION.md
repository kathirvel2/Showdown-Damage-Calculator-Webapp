# Technical Documentation

In-depth reference for how the Pokémon Damage Calculator is built, how the pieces fit together, and how to extend or rebuild it.

---

## 1. Architecture overview

The app is a **single-page, framework-free** web app. Everything is driven by one global `state` object and a `render()` function that rewrites the DOM from that state. There is no virtual DOM and no reactivity library — every meaningful change calls `render()` (rebuilds the UI) and/or `renderResults()` (recomputes damage).

```
┌─────────────────────────────────────────────────────────┐
│ index.html                                                │
│   • Tailwind runtime  • styles.css                        │
│   • smogon-calc.bundle.js  (window.SmogonCalc)            │
│   • app.js                                                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────┐
        │ state  (single source of truth)    │
        │   genNum, gameType, field, sides,  │
        │   atk{…}, def{…}                    │
        └───────────────────────────────────┘
            │                         ▲
   render() │                         │ user events (wire())
            ▼                         │
        DOM (#app)  ───────────────────┘
            │
   renderResults() → calcMove() → @smogon/calc → result cards
```

### Key globals (in `app.js`)
- `C` / `SmogonCalc` — the bundled engine namespace (`calculate`, `Generations`, `Pokemon`, `Move`, `Field`, `Side`, `TYPE_CHART`, …)
- `state` — all user-editable data (see §3)
- `GEN` — the current `Generations.get(state.genNum)` object
- `DATA` — cached, per-generation lookup data and pre-built combobox item lists
- `activeMove` — index (0–3) of the move currently visualized on the battle stage

---

## 2. The damage engine bundle

`@smogon/calc` ships as **CommonJS** modules (using `require`/`exports`), which browsers can't load directly. To make it usable as a plain `<script>`, it is bundled into a single browser global.

### How the bundle was produced
```bash
npm install @smogon/calc
# entry.js:  module.exports = require('@smogon/calc');
npx esbuild entry.js \
  --bundle \
  --format=iife \
  --global-name=SmogonCalc \
  --minify \
  --outfile=smogon-calc.bundle.js
```
This yields `window.SmogonCalc` exposing the full API, including all generation data (~469 KB minified). No network calls are made for calculations.

### Rebuilding / upgrading
1. `npm install @smogon/calc@latest`
2. Re-run the esbuild command above.
3. Replace `smogon-calc.bundle.js` and re-test.

### Core calculation call
```js
const gen = Generations.get(9);
const result = calculate(
  gen,
  new Pokemon(gen, 'Garchomp', { nature:'Jolly', evs:{atk:252}, /* … */ }),
  new Pokemon(gen, 'Toxapex',  { evs:{hp:252, def:252}, /* … */ }),
  new Move(gen, 'Earthquake'),
  new Field({ /* weather, terrain, sides … */ })
);
result.range();      // [min, max] damage
result.desc();       // human-readable calc string
result.kochance();   // { text, n, chance }
result.damage;       // array of the 16 individual rolls
```

> ⚠️ **Gotcha:** `result.desc()` *throws* when total damage is 0 (e.g. a Ground move vs a Flying type). The app guards every `desc()`/`kochance()` call in `try/catch` and treats a max roll of 0 as "immune".

---

## 3. State model

```js
state = {
  genNum: 9,                       // 1–9
  gameType: "Singles",             // "Singles" | "Doubles"
  field: { weather, terrain, isGravity },
  sides: {
    atk: { isReflect, isLightScreen, isAuroraVeil, isTailwind, isHelpingHand },
    def: { …same… }
  },
  atk: mkMon(...),                 // attacker (see below)
  def: mkMon(...),                 // defender
}

// each Pokémon:
{
  species, level, nature, ability, item, status,
  teraType, terastallized,
  evs:  {hp,atk,def,spa,spd,spe},
  ivs:  {hp,atk,def,spa,spd,spe},
  boosts:{atk,def,spa,spd,spe},    // -6 … +6
  moves: ["…","…","…","…"]         // attacker uses all 4; defender's are unused
}
```

`buildMon(side)` converts a state Pokémon into a `@smogon/calc` `Pokemon` instance; `buildField()` builds the `Field` from `state.field` + `state.sides`.

---

## 4. The combobox engine

All `<select>`/datalist inputs are replaced by a custom searchable dropdown. It lives entirely in `app.js`.

### Pieces
- **`comboTrigger(type, side, slot, opts)`** — returns the HTML for the clickable trigger button. The trigger carries `data-ctype`, `data-side`, `data-slot` so the engine knows what it controls.
- **`comboConfig(type)`** — returns `{ items(side), ph }` where `items` is a function producing the option list and `ph` is the search placeholder (or `null` to hide the search box for short lists).
- **`openComboFor(trigger)`** — builds a floating `.combo-pop` panel appended to `<body>` (so it escapes the app's re-render), wires search + keyboard nav + click-outside, and positions it (flips upward near the viewport bottom).
- **`curComboValue` / `applyComboValue`** — read/write the value for a given combobox type into `state`.
- **`closeCombo()`** — removes the popup and detaches listeners. **Called on every selection** so the dropdown closes immediately.

### Option item shape
```js
{ value: "Earthquake",
  search: "earthquake",                 // lowercased; matched via .includes(query)
  html: "<span class='type-badge …'>…</span>…"  // rich row markup
}
```

### Performance
Per-generation option lists (`DATA.ci.species`, `DATA.ci.moves`, …) are **built once in `loadGen()`** and cached. Move/species/nature metadata is read straight off the engine's data objects (`.type`, `.category`, `.basePower`, `.types`, nature `.plus/.minus`) — no `new Move(...)` per option. The dropdown only renders the first **80** filtered matches to stay snappy.

### Adding a new dropdown type
1. Add a `case` in `comboConfig()` returning the item list.
2. Add the field in `curComboValue()` and `applyComboValue()`.
3. Emit a `comboTrigger("yourtype", …)` in the relevant render function.

---

## 5. Sprites

Sprites come from Pokémon Showdown. Species display names are converted to Showdown sprite IDs by **splitting on the first hyphen** into base + forme and stripping non-alphanumerics from each:

```
"Charizard-Mega-X"   → "charizard-megax"
"Landorus-Therian"   → "landorus-therian"
"Great Tusk"         → "greattusk"
"Mr. Mime"           → "mrmime"
```

`spriteCandidates(name, back)` returns an ordered fallback list. The `<img onerror>` handler walks the list until one loads:
- **Front (defender):** `ani/` (animated GIF) → `gen5/` → `dex/` → `home/`
- **Back (attacker):** `ani-back/` → `gen5-back/` → `ani/` → `gen5/` → `dex/`

Newer Pokémon (Gen 9 paradox mons, etc.) have no BW-style animation, so they gracefully fall back to the static `gen5`/`dex` PNGs.

---

## 6. Rendering & results

- **`render()`** rebuilds the whole UI: header, field bar, the two Pokémon panels, the swap button, the battle stage, and an empty results container. It then calls `wire()` (re-attach events) and `updateSprites()`.
- **`renderResults()`** computes all four attacker moves via `calcMove()` and renders a result card for each (type/category badges, damage numbers, %, KO chance, type effectiveness pill, roll sparkline, and the official desc string + copy button). It also updates the battle-stage HP bar for the active move.
- **`calcMove(name)`** is the bridge to the engine. It first checks `GEN.moves.get(tid(name))` — if the move doesn't exist in the current generation it returns `{ error: "not available in Gen N" }` instead of letting the engine throw.

### Animations (CSS, in `styles.css`)
- `floaty` — idle sprite bob
- `attack-right` / `lungeRight` — attacker lunge
- `shake` + `hitflash` — defender reaction
- `.hp-fill` width/color transition — HP drain

---

## 7. Known constraints & notes

- **Clipboard:** `navigator.clipboard` is blocked in sandboxed iframes, so `copyText()` falls back to a hidden `<textarea>` + `document.execCommand('copy')`.
- **Gen switching:** if the current species/move doesn't exist in the newly selected generation, species fall back to the first available species and missing moves show a clean "not available" note.
- **Re-render cost:** every edit triggers a full `render()`. This is simple and fast enough for this app's size; if the UI grows, consider scoping updates to changed panels.
- **Learnset filtering:** the move dropdown currently lists *all* moves for the generation, not only the moves a given Pokémon can legally learn (a possible future enhancement).

---

## 8. Possible enhancements

- Import/export Pokémon Showdown paste format
- Shareable URL that encodes the full calc setup
- Reverse calc ("what EVs survive this hit?") and speed-tie checker
- Legal-moves-only filter in the move dropdown
- Multi-target / side-by-side matchup comparison

