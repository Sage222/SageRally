# Sage Rally

**Sage Rally** is a 3D top-down/isometric arcade combat racing game built with **Three.js (WebGL 2)**, **React 19**, **TypeScript**, and **Web Audio API**. Inspired by classic arcade and overhead racers including ***GeneRally 2***, ***R.C. Pro-Am***, and ***Ivan "Ironman" Stewart's Super Off Road***, it features sculpted 3D diorama circuits, multi-surface physics, randomized dynamic weather, tactical per-lap weapons & nitro boosts, slipstream drafting, and 1–4 player couch co-op with Xbox controller support.

---

## Key Features

### 1. Game Modes & Grand Prix Leaderboard
- **Grand Prix Cup (All 5 Tracks)**: Compete across all 5 endurance circuits in sequence (`3 Laps` per race). Drivers earn Championship Points after each round:
  - **1st Place**: `10 PTS`
  - **2nd Place**: `6 PTS`
  - **3rd Place**: `4 PTS`
  - **4th Place**: `2 PTS`
  - **Fastest Lap Bonus**: `+1 PT`
- **Persistent Hall of Fame Leaderboard**: Completed Grand Prix championships and fastest lap records are stored in `localStorage` and viewable directly from the Title Screen.
- **Single Track Race**: Jump directly into any of the 5 circuits for a 3-lap quick race.
- **Randomized Weather & Starting Grid**: Every race start automatically randomizes both the weather conditions (`Clear`, `Rain`, or `Snow`) and the 4-car starting grid order (`P1–P4`).

---

### 2. Five 3D Endurance Circuits
All 5 circuits are built using continuous 3D Catmull-Rom splines (`600` baked samples per circuit) with smooth elevation changes, banked turns, valley dips, mountain tunnels, and collinear straightaway jumps:

| Round | Circuit | Length | Inspiration | Signature Features |
| :--- | :--- | :--- | :--- | :--- |
| **01** | **Pinewood Forest GP** | `2,240m` | *GeneRally 2* Classic | Mountain tunnel pass, banked hairpins, valley dips, and twin straightaway jumps |
| **02** | **Pro-Am Thunder Stadium** | `2,380m` | *R.C. Pro-Am* | High-speed banked asphalt bowl, stadium tunnel, oil/water hazards, and turbo straightaways |
| **03** | **Ironman Baja Canyon** | `2,460m` | *Super Off Road* | Rhythm whoop dips, red-rock canyon tunnel, mud bog hazards, and tabletop jumps |
| **04** | **Alpine Glacier Pass** | `2,520m` | *GeneRally* Snow Rally | High-altitude glacier climb, ice hairpins, mountain tunnel, and downhill valley jump |
| **05** | **Thunder Valley Speedway** | `2,640m` | Pro-Am Endurance Finale | Mixed asphalt/dirt/ice circuit with twin mountain tunnels, steep banked bowls, and valley jumps |

---

### 3. Per-Lap Tactical Weapons, Nitro & Slipstream
Every car's loadout is automatically refreshed each time it crosses the start/finish line to begin a new lap:
- **Forward Twin Autocannons (`3 Shots / Lap`)**: Fires high-velocity projectiles straight ahead. Hitting a rival reduces their top speed by `42%` for `1.9s`.
- **Rear Oil Slicks (`2 Drops / Lap`)**: Deploys a persistent oil hazard on the road behind your car. Rivals that drive over an oil slick spin out for `1.1s`.
- **Nitro Boost (`3 Boosts / Lap`)**: Grants an immediate `1.32x` top speed and high-thrust acceleration surge for `1.65s` with twin exhaust flames.
- **Slipstream Drafting (`+15% Speed`)**: Following within `4m–28m` inside a rival's forward wake charges the Slipstream meter, boosting top speed by up to `+15%` and acceleration by `+22%` with aerodynamic wind-streak particles.

---

### 4. Competitive Pack Balancing & Physics
- **Surface & Weather Grip**:
  - **Surfaces**: Asphalt (`100%` grip), Dirt (`78%` grip), Grass (`70%` grip), Mud (`55%` grip), Ice/Puddles (`42%` grip).
  - **Weather**: Dry Sun (`100%` grip), Storm Rain (`76%` grip), Alpine Snow (`58%` grip).
- **Car-to-Car Collision Penalty (`-10%` Speed for `4s`)**: When two cars collide on track, both vehicles suffer a `10%` top speed and acceleration penalty for `4.0 seconds`.
- **Front-Car & Last-Place Pacing**:
  - **1st Place (Leader)**: `-5%` speed penalty (`0.95x`) after the initial 4-second grid launch so leaders cannot run away uncontested.
  - **4th Place (Last Place)**: `+10%` catch-up speed boost (`1.10x`) to keep every race competitive.
- **Sector-Paced & Overtaking AI**: Computer-controlled (`Sage AI`) drivers hold their weapons during the opening `8 seconds` and start/finish straight, ration their Guns, Oil Slicks, and Nitro across three distinct track sectors per lap, and actively steer into open lanes to overtake slower traffic cleanly.

---

## Controls (1–4 Player Couch Co-Op)

| Action | Player 1 (Keyboard WASD) | Player 2 (Keyboard Arrows) | Xbox / Gamepad (1–4 Pads) |
| :--- | :--- | :--- | :--- |
| **Throttle / Accelerate** | `W` (or `Up Arrow` in 1P mode) | `Up Arrow` | `RT` (Right Trigger) |
| **Brake / Reverse** | `S` (or `Down Arrow` in 1P mode) | `Down Arrow` | `LT` (Left Trigger) |
| **Steer Left / Right** | `A` / `D` (or `Left` / `Right` in 1P) | `Left Arrow` / `Right Arrow` | `Left Stick` or `D-Pad` |
| **Fire Gun (`3 / Lap`)** | `Space` or `F` | `Right Shift` or `/` | `A`, `X`, or `RB` |
| **Drop Oil (`2 / Lap`)** | `E` or `Q` | `Enter` or `.` | `B` or `LB` |
| **Nitro Boost (`3 / Lap`)** | `Left Shift`, `C`, or `N` | `Right Ctrl` or `M` | `Y` or `L3` |
| **Reset Car to Track** | `R` | — | — |
| **Toggle Bottom Dock** | `H` | `H` | — |
| **Pause / Resume** | `Esc` | `Esc` | — |

---

## Project Structure

```text
├── index.html                  # HTML entry point & Google Fonts (Chakra Petch, Plus Jakarta Sans, JetBrains Mono)
├── metadata.json               # Application metadata
├── package.json                # Dependencies (Three.js, React 19, Tailwind CSS, Lucide Icons)
└── src/
    ├── main.tsx                # React DOM root mount
    ├── index.css               # Tailwind CSS imports & font variables
    ├── App.tsx                 # Title Screen, Grand Prix state machine, Leaderboard, and live Telemetry HUD
    ├── audio/
    │   └── soundEngine.ts      # Procedural Web Audio API synthesizer (engine RPM, gunfire, hits, oil spin-outs, boost)
    ├── components/
    │   └── RaceViewport.tsx    # Full-screen Three.js WebGL 2 renderer, 60Hz vehicle physics, AI, and zoom-adaptive camera
    ├── game/
    │   ├── inputManager.ts     # Unified Keyboard + HTML5 Gamepad API polling with deadzones & dual-motor haptic rumble
    │   ├── models.ts           # Procedural 3D low-poly race cars, terrain table, mountain peaks, tunnels, kerbs & trees
    │   └── tracks.ts           # 5 endurance circuit spline definitions, 3D surface spatial queries, and banking math
    └── types/
        └── game.ts             # Shared TypeScript interfaces for tracks, vehicles, telemetry, and gamepads
```

---

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Type-check and build for production**:
   ```bash
   npm run lint
   npm run build
   ```
