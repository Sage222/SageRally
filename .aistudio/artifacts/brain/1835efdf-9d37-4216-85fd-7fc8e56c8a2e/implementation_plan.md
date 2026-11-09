# Apex Rally GP — 3D Isometric Arcade Combat Racer

Apex Rally GP is a 3D isometric/top-down arcade combat racer inspired by *GeneRally 2* and *R.C. Pro-Am*, built with Three.js and WebGL. It combines stylized low-poly 3D diorama circuits—complete with elevation hills, jump ramps, banked corners, and multi-terrain surfaces—with dynamic weather physics, R.C. Pro-Am-style forward weapons and oil slicks, and local couch co-op with native Xbox controller support.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and product choices reflect your confirmed preferences and define how the 3D engine, track geometry, and multiplayer systems will be constructed:

- **Confirmed Decision 1 — Engine & Asset Pipeline**: Playable 3D WebGL game built using Three.js with procedural low-poly modular 3D meshes (`ExtrudeGeometry`, `TubeGeometry`, `LatheGeometry`, and `InstancedMesh` diorama props), physically based materials (`MeshStandardMaterial` + `RoomEnvironment` IBL), and real-time directional shadow mapping.
- **Confirmed Decision 2 — Camera Choreography**: Shared zoom-adaptive overhead isometric camera (like *GeneRally 2*) that smoothly tracks the bounding centroid of all active human players, dynamically adjusting altitude and field of view so no local player is left behind while preserving full track readability.
- **Confirmed Decision 3 — Visual Art Direction**: Clean low-poly stylized dioramas inspired by *GeneRally 2*—vibrant motorsport liveries, red-and-white kerbs, sculpted terrain elevation, pine/deciduous instanced foliage, grandstands, and crisp daytime/weather lighting.
- **Default Choice — Local Co-Op & Input Mapping**: Up to 4 cars on track (1–4 local human players via Xbox Gamepad API + Keyboard, with AI drivers filling remaining grid slots) and a live **Controller & Co-Op Lobby** that detects connected Xbox controllers, displays stick/trigger telemetry, and supports rumble feedback via the Gamepad Haptic Actuator API.

---

## 1. Overview & Core Concept

- **What It Does**: Delivers a high-energy, 60 FPS top-down/isometric 3D racing experience where 1 to 4 local players (plus AI rivals) battle across large multi-surface 3D circuits featuring hills, jumps, banked corners, dynamic weather (Clear, Rain, Snow), forward-firing twin autocannons, and deployable oil slick hazards.
- **Target Audience / Persona**: Fans of classic arcade/isometric racers (*GeneRally 2*, *R.C. Pro-Am*, *Super Off Road*, *Circuit Superstars*) looking for tactile vehicle weight, visible suspension/drift physics, and couch multiplayer with gamepads.
- **Key Value**: Brings the charm of a tabletop motorsport diorama together with genuine 3D surface normal physics (banked camber grip, airborne jump arcs, surface traction modifiers, and weather slip angles) and instant plug-and-play Xbox controller co-op.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Pre-Race Diorama Paddock & Co-Op Lobby**:
   - The 3D circuit renders live in the background with an orbiting showcase camera while players configure the race from a sleek, unobstructed overlay.
   - **Track Selection**: Choose from 3 distinct large-scale 3D diorama circuits:
     - *pinewood GP Circuit*: Sweeping banked asphalt hairpins, dirt rally shortcut, double jump crest, and stadium grandstands.
     - *Alpine Switchback Pass*: High-elevation hill climbs, steep camber turns, icy bridge crossing, and mud pit hazards.
     - *Industrial Pro-Am Arena*: High-speed figure-8 crossover jump, oil refinery hazards, gravel chicanes, and turbo boost strips.
   - **Weather & Surface Condition**: Toggle between **Dry & Sunny**, **Heavy Rain** (wet specular road reflections, raindrop particles, puddles, -28% tire lateral grip), and **Blizzard Snow** (snowfall particles, frosted road banks, -45% lateral grip, longer braking distances).
   - **Couch Co-Op & Xbox Controller Assignment**: Up to 4 player slots. Pressing **A** on any connected Xbox controller (or keyboard bindings WASD / Arrow Keys) binds that controller to a player slot, lets them pick their car class/livery, and tests trigger throttle and rumble. Unassigned slots default to competitive AI drivers.

2. **Active Race & Combat Loop**:
   - **3-2-1 Gantry Light Countdown**: Synchronized 3D starting gantry lights and Web Audio synthesized engine revving.
   - **Terrain, Elevation & Camber Physics**:
     - Driving up hills slows acceleration slightly under gravity; cresting jump ramps launches the vehicle airborne with pitch/roll kinematics and landing suspension compression plus dust/spark particles.
     - Banked corners tilt the road cross-section normal so taking the high line at speed uses the banking to hold tighter cornering speed without sliding out.
     - Off-road terrain (grass, deep mud, gravel, water puddles) applies immediate surface drag and wheel-spin particles.
   - **R.C. Pro-Am Weapon System**:
     - **Forward Twin Autocannon (`RB` / `X` on Xbox Controller, `Space` / `Right Shift` on Keyboard)**: Fires high-velocity kinetic rounds straight ahead along the vehicle's heading vector. Hitting a rival car triggers metallic sparks, temporary engine sputter (50% top speed reduction for 1.8s), and knockback impulse.
     - **Rear Oil Slick Dispenser (`LB` / `B` on Xbox Controller, `E` / `Enter` on Keyboard)**: Drops a persistent glossy black oil pool on the track surface behind the car. Any vehicle driving over an oil slick loses steering traction and enters a 360-degree spin-out with tire smoke.
     - **Track Pickups**: Rotating low-poly **Ammo Crates** (replenish forward rounds & oil charges) and **Chevron Boost Pads** embedded in the track.

3. **Post-Race Podium & Telemetry Summary**:
   - Displays final standings, best lap times, total weapon hits, spin-outs caused, and instant **Rematch** or **Next Track** actions.

### Visual Identity & Theme

- **Aesthetic Direction**: Tactile Motorsport Diorama meets Precision Racing Telemetry—clean low-poly 3D environments with warm sunlight or atmospheric storm fog, paired with a razor-sharp dark obsidian HUD that keeps the center viewport 100% clear.
- **Color Palette & Mood**:
  - `--background`: `#0B0F17` (Deep Carbon Obsidian for HUD chrome)
  - `--surface`: `rgba(15, 23, 42, 0.82)` (Solid dark slate HUD surfaces—no `backdrop-filter` over active WebGL to guarantee zero GPU stall)
  - `--primary`: `#F59E0B` (Motorsport Amber Gold for primary CTAs, lap leaders, and active selections)
  - `--accent`: `#06B6D4` (Telemetry Cyan for boost/ammo bars and controller connection badges)
  - `--danger`: `#EF4444` (Racing Red for weapon hits, hazard warnings, and kerbs)
  - **3D World Palette**: Crisp emerald turf (`#2E6F40`), slate asphalt (`#2B303A`), warm clay dirt (`#A46434`), racing kerb red/white (`#E11D48` / `#F8FAFC`), and player liveries (Crimson `#EF4444`, Electric Blue `#3B82F6`, Solar Yellow `#EAB308`, Emerald `#10B981`).
- **Typography & Hierarchy**:
  - *Display / Headers*: `Chakra Petch` (600/700) for high-speed motorsport headers, countdowns, and standings.
  - *Body & Controls*: `Plus Jakarta Sans` (400/600) for clean readability in menus and controller prompts.
  - *Telemetry & Lap Timers*: `JetBrains Mono` (`tabular-nums`) for millisecond lap timers, speeds, ammo counters, and RPM readouts.
- **Component Styling & Ergonomic Layout**:
  - Compact top telemetry bar showing per-player cards (Position, Lap `1/3`, Speed `KM/H`, Gun Ammo count, Oil Slick charges, and Xbox Controller icon).
  - Collapsible bottom control dock (`▾ Hide Controls` / `H` key) for camera angle presets (Isometric Zoom, High Overhead, Tight Action), weather quick-switch, audio mute, and pause/setup modal toggle.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Procedural Ribbon Spline Mesh for 3D Elevation & Banked Turns**:
  - *Chosen Approach*: Construct tracks from a closed 3D Catmull-Rom spline where every control node defines `(x, y, z)` elevation, `width`, `bankAngle` (roll in radians), and `surfaceType`. Generate a custom indexed `BufferGeometry` ribbon mesh for the road, raised 3D red/white kerbs, jump ramps, and surrounding terrain heightmap skirt.
  - *Why*: Standard flat 2D planes cannot represent true *GeneRally 2* hills, jumps, or banked corners. A custom parametric ribbon mesh gives exact height and surface normal queries at any `(x, z)` coordinate in $O(1)$ spatial lookup time, ensuring rock-solid 60 FPS physics for 4+ cars and projectiles.
  - *Alternatives Considered*: Static external `.glb` files (rejected due to lack of parametric normal/banking lookup and external asset dependencies) or heavy rigid-body triangle mesh physics engines (rejected due to jitter on high-speed arcade transitions).

- **Decision 2 — Composite 8-Part Low-Poly Vehicles with Suspension Tilt**:
  - *Chosen Approach*: Build each race car as a hierarchical `THREE.Group` with 8 distinct low-poly sub-meshes (sculpted chassis hull, cockpit canopy, rear wing spoiler, twin hood autocannon barrels, rear diffuser/exhaust, and 4 independent wheels with tire treads and alloy rims) plus a soft grounding shadow decal.
  - *Why*: Separating the chassis body from the wheel assembly allows visual suspension pitch (nose dive on braking, squat on acceleration), body roll in banked corners, and front-wheel steering angles, making the vehicles feel genuinely physical like *GeneRally 2*.

- **Decision 3 — Native HTML5 Gamepad API Polling with Deadzone & Rumble**:
  - *Chosen Approach*: Poll `navigator.getGamepads()` directly inside the 60 Hz simulation loop using standard Xbox controller mappings (`axes[0]` left stick steering, `buttons[7]` RT analog throttle, `buttons[6]` LT brake/reverse, `buttons[0]`/`buttons[5]` Fire Guns, `buttons[1]`/`buttons[4]` Drop Oil Slick) with configurable radial deadzones (`0.14`) and dual-rumble haptic feedback on weapon hits, jumps, and off-road rumble strips.
  - *Why*: Direct frame-loop polling eliminates React state latency and supports up to 4 simultaneous Xbox controllers seamlessly alongside 2 local keyboard layouts.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        APEX RALLY GP APPLICATION ROOT                        │
├──────────────────────────────────────┬───────────────────────────────────────┤
│      3D WEBGL ENGINE (Three.js)      │       REACT TELEMETRY & UI LAYER      │
│  ┌────────────────────────────────┐  │  ┌─────────────────────────────────┐  │
│  │  Scene & Studio Lighting Rig   │  │  │  Top Telemetry HUD Strip        │  │
│  │  • RoomEnvironment PMREM IBL   │  │  │  • P1–P4 Speed, Lap, Position   │  │
│  │  • Warm Sun DirectionalShadow  │  │  │  • Gun Ammo & Oil Slick Gauges  │  │
│  │  • Hemisphere Sky/Ground Fill  │  │  └─────────────────────────────────┘  │
│  └───────────────┬────────────────┘  │  ┌─────────────────────────────────┐  │
│                  ▼                   │  │  Pre-Race Paddock & Co-Op Modal │  │
│  ┌────────────────────────────────┐  │  │  • Track & Weather Selector     │  │
│  │  Parametric 3D Track Builder   │  │  │  • Xbox Controller Bind & Test  │  │
│  │  • Spline Elevation & Banking  │  │  │  • AI Difficulty & Laps Config  │  │
│  │  • Multi-Terrain Zones & Ramps │  │  └─────────────────────────────────┘  │
│  │  • Instanced Trees, Rocks, Pit │  │  ┌─────────────────────────────────┐  │
│  └───────────────┬────────────────┘  │  │  Collapsible Bottom Dock (H)    │  │
│                  ▼                   │  │  • Camera Zoom Preset Switcher  │  │
│  ┌────────────────────────────────┐  │  │  • Weather & Time-of-Day Toggle │  │
│  │  60Hz Arcade Physics & Combat  │◄─┼──┤  • Web Audio Synth Engine SFX   │  │
│  │  • 8-Part Vehicle Kinematics   │  │  └─────────────────────────────────┘  │
│  │  • Weather & Surface Traction  │  │  ┌─────────────────────────────────┐  │
│  │  • Autocannon & Oil Slick Pool │  │  │  Post-Race Podium & Standings   │  │
│  │  • Shared Zoom-Adaptive Camera │  │  │  • Lap Records & Combat Stats   │  │
│  └───────────────▲────────────────┘  │  └─────────────────────────────────┘  │
│                  │                   │                                       │
│  ┌───────────────┴────────────────┐  │                                       │
│  │  Multi-Input & AI Driver Bus   │  │                                       │
│  │  • Xbox Gamepad API + Haptics  │  │                                       │
│  │  • Keyboard (WASD + Arrows)    │  │                                       │
│  │  • Racing Line & Combat AI     │  │                                       │
│  └────────────────────────────────┘  │                                       │
└──────────────────────────────────────┴───────────────────────────────────────┘
```

### Data Model & State

- **`TrackDefinition`**:
  - `id`, `name`, `subtitle`, `lengthMeters`, `defaultWeather`
  - `splineNodes`: Array of `{ position: Vector3, width: number, bankAngle: number, surface: 'asphalt' | 'dirt' | 'ice' | 'jump_ramp' | 'boost', kerbLeft: boolean, kerbRight: boolean }`
  - `hazards`: Pre-placed mud pits, water puddles, and ammo pickup coordinates along the spline parameter $t \in [0, 1)$.
- **`VehicleState` (4 Cars on Grid)**:
  - Spatial kinematics: `position: Vector3`, `velocity: Vector3`, `heading: number`, `angularVelocity: number`, `pitch: number`, `roll: number`, `isAirborne: boolean`, `groundNormal: Vector3`.
  - Gameplay & Combat: `playerIndex`, `controlType: 'gamepad' | 'keyboard_wasd' | 'keyboard_arrows' | 'ai'`, `gamepadIndex: number | null`, `gunAmmo: number`, `oilAmmo: number`, `spinOutTimer: number`, `damageSlowTimer: number`, `boostTimer: number`, `lap: number`, `checkpointIndex: number`, `lapTimes: number[]`.
- **`WeatherPreset` (`clear` | `rain` | `snow`)**:
  - Modifies global lateral tire grip multiplier (`1.0` dry, `0.72` rain, `0.55` snow), braking efficiency, road material roughness/metalness, fog density, and active 3D particle emitters.
- **`Projectile & Hazard Pool`**:
  - Pre-allocated object pools for forward kinetic tracer rounds (speed `65 u/s`, collision radius `1.1m`), persistent track oil slick decals (`radius: 2.2m`, triggers spin-out state on contact), and tire/exhaust/spark particle bursts.

### Interactive Component & State Mapping

- **Paddock & Controller Setup Modal**:
  - Listens to `gamepadconnected` / `gamepaddisconnected` and real-time button presses so players can join/leave slots with a single button press, switch between 3 circuits, pick weather conditions, and launch the race countdown.
- **Shared Zoom-Adaptive Camera Controller**:
  - Every frame, computes the 3D bounding box of all active human vehicles (or Player 1 if solo with AI). Smoothly damps (`THREE.MathUtils.damp`) the camera look-at target toward the centroid and adjusts camera distance along the isometric vector `(0, 1.15, 0.85)` so all human players stay framed within a safe 80% viewport margin even when separated on large tracks.
- **Procedural Web Audio Synthesizer**:
  - Uses Web Audio API oscillators and noise buffers to generate pitch-modulated engine RPM hums, tire screech on high slip angles, rapid staccato autocannon fire, oil slick splat/spin-out audio, and boost pad whooshes with zero external audio file dependencies.
