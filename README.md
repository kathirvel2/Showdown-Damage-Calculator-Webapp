# Showdown-Damage-Calculator-Webapp
# Pokémon Damage Calculator

A polished, self-contained web app version of the official [Smogon Damage Calculator](https://github.com/smogon/damage-calc). It runs the **exact `@smogon/calc` engine** (all 9 generations of game data) bundled directly into the page, wrapped in a modern UI with animated sprites, custom searchable dropdowns, and live battle visualizations.

![Pokémon Damage Calculator](preview.png)

---

## ✨ Features

### Accurate, official calculations
- Powered by the real **`@smogon/calc`** library — the same engine behind Smogon's own calculator
- Damage min–max rolls, percentages, and KO chances
- The canonical result string, e.g. *"252 Atk Garchomp Earthquake vs. 252 HP / 252+ Def Toxapex: 176-210 (57.8 - 69%) -- guaranteed 2HKO"*
- Type effectiveness (super effective / not very effective / immune) computed from the in-engine type chart
- Supports **Generations 1–9** and both **Singles** and **Doubles**

### Rich, searchable UI
- **Custom dropdowns everywhere** with instant search/filter and keyboard navigation (↑/↓, Enter, Esc):
  - **Pokémon** — each option shows a mini sprite + type dots
  - **Moves** — type badge, category icon, and base power shown inline
  - **Abilities, Items, Natures** (natures show their +/− stat), **Tera type**, **Status**, **Weather**, **Terrain**, **Generation**, **Game type**
- **Animated sprites** from Pokémon Showdown (back sprite for the attacker, front for the defender) with automatic fallback to static / HOME sprites for newer Pokémon

### Full battle configuration
- Per Pokémon: **level, nature, ability, item, status, Tera type** (Gen 9), **EVs, IVs, and stat boosts** with live computed stats
- **4 move slots** for the attacker
- **Field conditions:** weather, terrain, gravity
- **Side conditions:** Reflect, Light Screen, Aurora Veil, Tailwind, Helping Hand (per side)

### Quality-of-life extras
- **⇄ Swap** attacker and defender (including their side conditions)
- **🎲 Random** Pokémon picker on each side
- **Damage-roll sparkline** visualizing all 16 individual rolls per move
- **📋 Copy** the official calc string to the clipboard
- **Clear EVs** chip and toast notifications
- **Animated battle stage** with attack lunge, hit shake/flash, and a draining HP bar
- **Dark mode** (auto-detects your OS preference)
- **Responsive** from 400 px mobile up to desktop

---

## 🚀 Usage

This is a static web app — no server or build step required to run it.

1. Open `index.html` in any modern browser (or open the exported `pokemon_damage_calculator.html` artifact directly).
2. Pick an **attacker** and **defender**, configure their sets, add moves, and the damage results update live.
3. Click a move card or move slot to replay the attack animation and update the defender's HP bar.

> **Note:** The damage engine is fully offline (bundled locally). An internet connection is only needed to load Pokémon **sprites** and the Tailwind CSS runtime.

---

## 📁 Project structure

```
pokecalc/
├── index.html              # Page shell — loads Tailwind, styles, the engine, and the app
├── styles.css              # All styling: type colors, animations, comboboxes, mobile rules
├── app.js                  # Application logic: state, UI rendering, combobox engine, calc wiring
└── smogon-calc.bundle.js   # The official @smogon/calc library bundled for the browser (all gens)
```

---

## 🛠 Tech stack

| Concern              | Choice                                                        |
|----------------------|---------------------------------------------------------------|
| Damage logic         | [`@smogon/calc`](https://www.npmjs.com/package/@smogon/calc) v0.11 (bundled with esbuild) |
| UI rendering         | Vanilla JavaScript (no framework)                             |
| Styling              | [Tailwind CSS](https://tailwindcss.com) (browser runtime) + custom CSS |
| Sprites              | [Pokémon Showdown](https://play.pokemonshowdown.com/sprites/) sprite sets |

---

## 🙏 Credits & licensing

- **Damage engine:** [smogon/damage-calc](https://github.com/smogon/damage-calc) (`@smogon/calc`) — MIT License
- **Sprites:** Pokémon Showdown
- Pokémon and all related names are trademarks of Nintendo / Game Freak / The Pokémon Company. This project is a fan-made tool and is not affiliated with or endorsed by them.

See `DOCUMENTATION.md` for technical/architecture details and instructions on rebuilding the engine bundle.
