# 🐍 SERPENT — Arcade Snake

<div align="center">

![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Play_Serpent_Now-8dff57?style=for-the-badge&logo=vercel&logoColor=black)](https://snake-game-sage-pi.vercel.app)

**A high-voltage, retro-futuristic Arcade Snake game with zero-latency mobile touch controls, unlockable skins, procedural audio synthesis, and interpolated 60/120 FPS canvas rendering.**

[🚀 **Play Live Game**](https://snake-game-sage-pi.vercel.app) • [🎮 Localhost Setup](#-quick-start) • [✨ Key Features](#-features) • [🕹️ Controls](#-controls) • [🎨 Themes & Skins](#-skins--themes)

</div>

---

## ✨ Features

- **⚡ Zero-Latency Touch & Tap Steering:**
  - **Tap-to-Steer:** Tap directly above, below, left, or right of the snake's head for instant directional turns.
  - **Micro-Swipe Gestures:** Continuous fluid swipe steering with a low 10px threshold.
  - **Virtual D-Pad Mode:** Optional tactile on-screen gamepad toggleable on all devices.
  - **Handheld Arcade Mode:** Turns your smartphone into a retro console with left-hand D-pad and right-hand action buttons when held in landscape.

- **🎨 4 Unlockable Retro Themes & Skins:**
  - 🟢 **Cyberpunk Neon** *(Default)* — High-voltage neon lime and dark emerald grid.
  - 🕹️ **Game Boy Classic** *(60 pts)* — Authentic 1989 4-shade greenish LCD pixel matrix.
  - 🌆 **Synthwave Horizon** *(150 pts)* — Neon magenta, electric cyan, and sunset violet.
  - 💻 **Matrix Terminal** *(300 pts)* — Digital rain and phosphor cyber green terminal.

- **🎮 3 Difficulty Tiers with Dynamic Score Multipliers:**
  - 🌿 **Chill:** 165ms tick (1× pts) — Relaxed practice stroll.
  - ⚡ **Classic:** 118ms tick (2× pts) — The standard arcade hunt.
  - 💀 **Insane:** 82ms tick (3× pts) — Pure reflex venom for seasoned players.

- **👁️ Smooth 60/120 FPS Interpolated Canvas Engine:**
  - High-performance sub-pixel motion interpolation.
  - Dynamic particle burst explosions and floating score popups.
  - Screen shake, death flashes, pulsing food rings, and CRT scanline vignette shaders.

- **🔊 Pure Web Audio API Sound Synthesizer:**
  - Zero external MP3/WAV dependencies. Real-time synthesized chiptune tones for eating, turns, pause, deaths, and high score celebrations.
  - Mobile audio auto-unlock on first user interaction.

- **💾 Local Persistence & Best Score Tracker:**
  - Saves your best scores and theme unlock progress in `localStorage`.

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Steer** | `↑` `↓` `←` `→` or `W` `A` `S` `D` | **Tap relative to snake head** or **Swipe** |
| **Pause / Resume** | `Space` or `P` | Tap the Pause button or HUD icon |
| **Restart Run** | `R` | Tap the Restart button |
| **Toggle Sound** | `M` | Tap the Speaker icon |
| **Fullscreen Zoom** | `F` | Tap the Zoom icon |
| **Cycle Skin / Theme** | `T` | Tap the Palette icon |
| **Toggle Virtual D-Pad** | — | Tap `D-Pad` / `Tap Mode` in the footer dock |

---

## 🎨 Skins & Themes

| Theme | Preview | Unlock Requirement |
| :--- | :--- | :--- |
| **Cyberpunk Neon** | `#8dff57` Lime / `#06110c` Dark Emerald | **Default (0 pts)** |
| **Game Boy Classic** | `#9bbc0f` / `#8bac0f` / `#0f380f` 4-Shade LCD | **60 pts High Score** |
| **Synthwave Horizon** | `#ff2a85` Magenta / `#00f0ff` Cyan / `#120924` Violet | **150 pts High Score** |
| **Matrix Terminal** | `#00ff66` Phosphor Green / `#020d06` Terminal Black | **300 pts High Score** |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `pnpm` or `yarn`

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/codewithabhiishek/Snake-Game.git

# 2. Enter directory
cd Snake-Game

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev
```

Open your browser and navigate to **`http://localhost:3000`**.

### Production Build

```bash
# Typecheck TypeScript
npm run typecheck

# Build optimized production bundle
npm run build
```

---

## 📂 Project Structure

```
Snake-Game/
├── public/
│   └── favicon.svg           # Scalable neon snake SVG favicon
├── src/
│   ├── game/
│   │   ├── audio.ts          # Web Audio API procedural sound synthesizer
│   │   ├── engine.ts         # Pure game simulation loop, grid physics & turns
│   │   ├── render.ts         # High-FPS canvas renderer & particle fx
│   │   └── themes.ts         # Theme registry for Cyberpunk, Game Boy, Synthwave & Matrix
│   ├── App.tsx               # Main UI, responsive layout, touch gestures & HUD
│   ├── index.css             # CRT scanlines, neon typography & glassmorphism
│   └── main.tsx              # React root mount
├── index.html                # HTML entry point with retro Google Fonts
├── package.json              # Project dependencies and build scripts
└── vite.config.js            # Vite build & server configuration
```

---

## 🛠️ Tech Stack

- **Framework:** React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + Vanilla CSS Custom Properties
- **Bundler:** Vite 6
- **Rendering:** HTML5 Canvas 2D API (Interpolated Physics)
- **Audio:** Web Audio API (Chiptune Oscillator Synthesis)
- **Typography:** Silkscreen & Space Grotesk via Google Fonts

---

## 👨‍💻 Creator

Built by **[Abhishek](https://github.com/codewithabhiishek)** · **SERPENT ARCADE © 2026** ⚡
