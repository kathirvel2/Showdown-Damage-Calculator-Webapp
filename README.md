# Pokémon Damage Calculator

A modern, feature-rich web implementation of the official **Smogon Damage Calculator**, powered by the authentic **`@smogon/calc`** engine. This project combines the exact battle mechanics used by Smogon with a clean, responsive interface, animated battle visuals, and an intuitive user experience for competitive Pokémon players.

> **Live Demo:** https://showdown-damage-calculator-webapp.onrender.com

---

## 📖 Overview

The **Pokémon Damage Calculator** is a completely client-side web application designed to accurately simulate Pokémon battles and calculate damage across every main-series generation.

Built around the official **`@smogon/calc`** library, the calculator supports **Generations I–IX**, Singles and Doubles formats, Terastallization, weather, terrain, status conditions, stat boosts, and numerous battle mechanics while remaining lightweight and easy to use.

Unlike traditional calculators, this project emphasizes both **accuracy** and **user experience**, offering searchable dropdowns, animated sprites, live stat updates, damage visualizations, and an interface optimized for both desktop and mobile devices.

Since everything runs directly in the browser, **no backend server is required**. Damage calculations are performed locally, providing instant results and allowing the application to function offline (excluding external sprite loading).

---

# ✨ Features

## 🎯 Accurate Battle Calculations

* Uses the official **`@smogon/calc`** engine
* Supports **Generations I–IX**
* Singles and Doubles battle formats
* Official Smogon damage calculation logic
* Accurate damage ranges and percentages
* Guaranteed OHKO, 2HKO, 3HKO and KO chance calculations
* Type effectiveness calculations
* Critical hits
* STAB and Terastallization
* Weather and terrain modifiers
* Burn, status, abilities and held item effects

---

## 🎮 Battle Configuration

Configure nearly every battle parameter:

### Pokémon

* Species
* Level
* Ability
* Held Item
* Nature
* Tera Type
* Status Condition

### Stats

* EVs
* IVs
* Stat Boosts
* Live stat calculation

### Field Conditions

* Weather
* Terrain
* Gravity

### Side Conditions

* Reflect
* Light Screen
* Aurora Veil
* Tailwind
* Helping Hand

---

## 🔍 Modern User Interface

Designed to be fast and intuitive.

### Searchable Dropdowns

* Pokémon
* Moves
* Abilities
* Items
* Natures
* Tera Types
* Status Conditions
* Weather
* Terrain
* Generation
* Battle Format

Each dropdown includes:

* Instant search
* Keyboard navigation
* Type indicators
* Category icons
* Power information
* Pokémon sprites

---

## 🎨 Interactive Battle Experience

* Animated Pokémon Showdown sprites
* Front and back battle sprites
* Smooth attack animations
* HP bar animation
* Damage flash effects
* Damage roll sparkline visualization
* Live stat updates
* Responsive layout
* Automatic Dark Mode

---

## ⚡ Quality of Life Features

* Swap attacker and defender
* Random Pokémon generator
* Copy official damage result
* One-click EV reset
* Toast notifications
* Mobile-friendly interface
* Keyboard shortcuts
* Responsive design

---

# 🚀 Getting Started

No installation or build process is required.

Simply clone the repository and open **index.html** in any modern web browser.

```bash
git clone https://github.com/kathirvel2/Showdown-Damage-Calculator-Webapp.git
cd Showdown-Damage-Calculator-Webapp
```

Open:

```
index.html
```

or visit the live deployment:

**https://showdown-damage-calculator-webapp.onrender.com**

---

# 📁 Project Structure

```
Showdown-Damage-Calculator-Webapp
│
├── index.html
├── styles.css
├── app.js
├── smogon-calc.bundle.js
├── DOCUMENTATION.md
├── LICENSE
└── README.md
```

| File                      | Description                                          |
| ------------------------- | ---------------------------------------------------- |
| **index.html**            | Main application entry point                         |
| **styles.css**            | UI styling, animations and responsive layout         |
| **app.js**                | Application logic and state management               |
| **smogon-calc.bundle.js** | Browser bundle of the official `@smogon/calc` engine |
| **DOCUMENTATION.md**      | Technical documentation and architecture             |

---

# 🛠 Technology Stack

| Component     | Technology          |
| ------------- | ------------------- |
| Frontend      | HTML5               |
| Styling       | CSS3 + Tailwind CSS |
| Logic         | Vanilla JavaScript  |
| Damage Engine | `@smogon/calc`      |
| Bundler       | esbuild             |
| Sprites       | Pokémon Showdown    |
| Deployment    | Render Static Sites |

---

# 🌟 Highlights

* ✅ 100% Client-side
* ✅ No backend required
* ✅ Accurate Smogon calculations
* ✅ Fully responsive
* ✅ Mobile friendly
* ✅ Modern searchable interface
* ✅ Animated battle simulation
* ✅ Dark Mode support
* ✅ Fast and lightweight

---

# 📚 Documentation

Technical implementation details are available in:

```
DOCUMENTATION.md
```

It includes:

* Architecture overview
* State management
* Damage engine integration
* Rendering pipeline
* Sprite handling
* Build process
* Developer notes

---

# 🤝 Contributing

Contributions are welcome.

If you'd like to improve the project:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a Pull Request.

Bug reports and feature requests are always appreciated.

---

# 📄 License

This project is licensed under the **MIT License**.

See the **LICENSE** file for more information.

---

# Credits

### Smogon

The damage calculation engine is powered by the excellent **`@smogon/calc`** project maintained by the Smogon community.

### Pokémon

Pokémon, Pokémon character names, game mechanics, artwork, and related intellectual property are trademarks and copyrights of Nintendo, Game Freak, and The Pokémon Company.

This project is an independent fan-made application created for educational and competitive gameplay purposes and is **not affiliated with, endorsed by, or sponsored by Nintendo, Game Freak, The Pokémon Company, or Smogon.**
