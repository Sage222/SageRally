import * as THREE from 'three';
import { SurfaceType, TrackDefinition, TrackId } from '../types/game';

export interface BakedTrackSample {
  t: number;
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
  width: number;
  bankAngle: number;
  surface: SurfaceType;
  kerbLeft: boolean;
  kerbRight: boolean;
  isTunnel: boolean;
}

export interface BakedTrack {
  definition: TrackDefinition;
  curve: THREE.CatmullRomCurve3;
  samples: BakedTrackSample[];
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}

export interface TrackSurfaceQueryResult {
  closestIndex: number;
  t: number;
  groundY: number;
  lateralDist: number;
  normalizedLateral: number;
  surface: SurfaceType;
  bankAngle: number;
  tangentX: number;
  tangentY: number;
  tangentZ: number;
  upX: number;
  upY: number;
  upZ: number;
  onRoad: boolean;
  isTunnel: boolean;
}

export const TRACK_DEFINITIONS: Record<TrackId, TrackDefinition> = {
  // 1. GENE-RALLY INSPIRED GRAND PRIX & COUNTRYSIDE FARM VALLEY (~5,880m)
  pinewood_gp: {
    id: 'pinewood_gp',
    name: 'GeneRally Forest GP',
    subtitle: 'Countryside Farms, Windmill Valley, Pine Tunnel & Double Jump',
    inspiration: 'GeneRally 2',
    biome: 'forest_valley',
    lengthMeters: 5880,
    defaultWeather: 'clear',
    difficulty: 'Circuit',
    description:
      'A classic GeneRally countryside Grand Prix circuit winding past red-barn farms, spinning Dutch windmills, a floodlit main-straight stadium, an elevated Pine Mountain rock tunnel, two straightaway jump crests, and infield dirt farm-road switchbacks.',
    scenerySeed: 101,
    nodes: [
      // South Main Start/Finish Stadium Straight into South-East Chicane
      { x: -135, y: 0.5, z: 155, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -65, y: 0.5, z: 155, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: -5, y: 0.5, z: 155, width: 15.0, bankAngle: -0.14, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      // South-East Farmstead S-Chicane
      { x: 45, y: 0.8, z: 122, width: 15.0, bankAngle: 0.22, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 95, y: 0.8, z: 162, width: 15.0, bankAngle: -0.24, surface: 'boost', kerbLeft: true, kerbRight: true },
      { x: 155, y: 1.5, z: 148, width: 15.5, bankAngle: -0.26, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // East Ridge Winding Switchbacks (Right-Left-Right technical climb past windmills)
      { x: 215, y: 3.2, z: 105, width: 15.5, bankAngle: -0.30, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 170, y: 5.0, z: 50, width: 15.0, bankAngle: 0.26, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 225, y: 7.2, z: 0, width: 15.5, bankAngle: -0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 185, y: 9.8, z: -50, width: 15.0, bankAngle: 0.20, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // North-East Mountain Climb & Rock Tunnel
      { x: 215, y: 12.5, z: -100, width: 14.5, bankAngle: -0.22, surface: 'asphalt', isTunnel: true },
      { x: 185, y: 14.0, z: -150, width: 14.5, bankAngle: -0.20, surface: 'asphalt', isTunnel: true },
      { x: 130, y: 12.8, z: -172, width: 14.5, bankAngle: -0.14, surface: 'asphalt', isTunnel: true },

      // North Straightaway Jump #1 (Collinear along Z = -172 from +75 to -35)
      { x: 75, y: 9.5, z: -172, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 20, y: 10.8, z: -172, width: 15.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -35, y: 5.2, z: -172, width: 16.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },

      // North-West Forest Chicane & Hairpin Complex
      { x: -85, y: 4.2, z: -140, width: 15.5, bankAngle: 0.24, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -140, y: 3.5, z: -180, width: 15.5, bankAngle: -0.26, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -205, y: 2.2, z: -150, width: 15.5, bankAngle: -0.30, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -220, y: 0.5, z: -95, width: 15.5, bankAngle: -0.26, surface: 'dirt', kerbLeft: true, kerbRight: true },

      // Infield Country Farm Dirt Switchbacks & Valley Basin (y = -2.8m)
      { x: -155, y: -2.2, z: -65, width: 15.5, bankAngle: 0.26, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -185, y: -2.8, z: -10, width: 15.5, bankAngle: -0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -115, y: -2.5, z: 15, width: 15.0, bankAngle: 0.22, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -55, y: -1.2, z: -35, width: 15.0, bankAngle: -0.26, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 15, y: 1.2, z: -15, width: 15.0, bankAngle: 0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 45, y: 2.5, z: 35, width: 15.0, bankAngle: 0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },

      // Infield Return Straight (Collinear along Z = 72 from -15 to -130 for Second Jump)
      { x: -15, y: 2.5, z: 72, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -70, y: 3.8, z: 72, width: 15.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -130, y: 0.5, z: 72, width: 16.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },

      // South-West Double-Apex Hairpin back onto Main Straight
      { x: -195, y: 0.6, z: 58, width: 15.5, bankAngle: -0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -225, y: 0.8, z: 108, width: 16.0, bankAngle: -0.32, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -195, y: 0.5, z: 148, width: 15.5, bankAngle: -0.22, surface: 'asphalt', kerbLeft: true, kerbRight: true },
    ],
    hazards: [
      { t: 0.08, lateralOffset: 0.32, type: 'rough_ground', radius: 3.8 },
      { t: 0.16, lateralOffset: -0.34, type: 'water_puddle', radius: 3.4 },
      { t: 0.24, lateralOffset: 0.28, type: 'rough_ground', radius: 3.9 },
      { t: 0.33, lateralOffset: -0.32, type: 'mud_pit', radius: 3.6 },
      { t: 0.49, lateralOffset: -0.30, type: 'water_puddle', radius: 3.4 },
      { t: 0.56, lateralOffset: 0.34, type: 'rough_ground', radius: 4.0 },
      { t: 0.64, lateralOffset: -0.26, type: 'mud_pit', radius: 3.8 },
      { t: 0.71, lateralOffset: 0.30, type: 'rough_ground', radius: 4.1 },
      { t: 0.78, lateralOffset: -0.32, type: 'mud_pit', radius: 3.7 },
      { t: 0.89, lateralOffset: 0.34, type: 'water_puddle', radius: 3.4 },
      { t: 0.94, lateralOffset: -0.28, type: 'rough_ground', radius: 3.8 },
    ],
    grandstands: [
      { x: -75, y: 0.5, z: 176, rotationY: Math.PI },
      { x: -15, y: 0.5, z: 176, rotationY: Math.PI },
      { x: 248, y: 5.5, z: 25, rotationY: -Math.PI / 2 },
    ],
    mountains: [
      { x: 185, z: -135, radius: 75, height: 28 },
      { x: 120, z: -215, radius: 68, height: 24 },
      { x: -245, z: -150, radius: 65, height: 20 },
    ],
    sceneryProps: [
      { type: 'stadium', x: -110, z: 188, rotationY: Math.PI, scale: 1.05 },
      { type: 'pit_building', x: -60, z: 126, rotationY: 0, scale: 1.0 },
      { type: 'farm', x: 92, z: 98, rotationY: -0.4, scale: 1.1 },
      { type: 'windmill', x: 128, z: 85, rotationY: -0.6, scale: 1.15 },
      { type: 'farm', x: -108, z: -92, rotationY: 0.8, scale: 1.05 },
      { type: 'windmill', x: -145, z: 32, rotationY: 1.2, scale: 1.1 },
      { type: 'windmill', x: 132, z: 22, rotationY: -1.4, scale: 1.15 },
      { type: 'farm', x: 82, z: -65, rotationY: -2.2, scale: 1.0 },
      { type: 'windmill', x: -45, z: -115, rotationY: 0.3, scale: 1.1 },
      { type: 'alpine_chalet', x: -175, z: -118, rotationY: 0.9, scale: 1.0 },
      { type: 'alpine_chalet', x: 22, z: -135, rotationY: 0.1, scale: 1.05 },
      { type: 'stadium', x: -252, z: 95, rotationY: Math.PI / 2, scale: 0.95 },
    ],
  },

  // 2. R.C. PRO-AM CHAMPIONSHIP COLOSSEUM & CLOVERLEAF (~6,240m)
  pro_am_circuit: {
    id: 'pro_am_circuit',
    name: 'R.C. Pro-Am Championship',
    subtitle: 'Colosseum Cloverleaf, Banked Carousel, Overpass Tunnel & Slalom',
    inspiration: 'R.C. Pro-Am',
    biome: 'neon_stadium',
    lengthMeters: 6240,
    defaultWeather: 'rain',
    difficulty: 'Pro-Am',
    description:
      'High-speed R.C. Pro-Am championship tarmac complex with a cloverleaf infield loop, floodlit mega-stadiums, Pit Control towers, steep 21-degree banked carousels, an overpass tunnel, and a 6-corner West Coast slalom.',
    scenerySeed: 202,
    nodes: [
      // South Championship Straight into Deep Cloverleaf Infield Hairpin
      { x: -145, y: 0.5, z: 166, width: 15.5, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -65, y: 0.5, z: 166, width: 15.5, bankAngle: 0, surface: 'boost', kerbLeft: true, kerbRight: true },
      { x: 5, y: 0.8, z: 162, width: 15.5, bankAngle: -0.24, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      // Deep Infield Cloverleaf Dive (cuts sharply North-West then loops South-East)
      { x: 28, y: 1.8, z: 92, width: 15.5, bankAngle: -0.32, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 95, y: 2.2, z: 58, width: 15.5, bankAngle: 0.32, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 148, y: 1.6, z: 142, width: 16.0, bankAngle: -0.30, surface: 'boost', kerbLeft: true, kerbRight: true },

      // East Steep 21-Degree Banked Carousel Bowl
      { x: 222, y: 3.8, z: 118, width: 16.5, bankAngle: -0.36, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 235, y: 5.8, z: 45, width: 16.5, bankAngle: -0.36, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 185, y: 4.5, z: -12, width: 15.5, bankAngle: -0.26, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // Diagonal Mid-Field Straightaway Jump #1 (Collinear along Z = -18 from +125 to 0)
      { x: 125, y: 3.2, z: -18, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 65, y: 4.9, z: -18, width: 15.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: 0, y: 0.8, z: -18, width: 16.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },

      // Central Corkscrew S-Bends & North Climb
      { x: -68, y: -2.0, z: 18, width: 15.5, bankAngle: -0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -128, y: -2.6, z: -28, width: 15.5, bankAngle: 0.30, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -85, y: 1.2, z: -88, width: 15.5, bankAngle: 0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -10, y: 4.8, z: -72, width: 15.5, bankAngle: -0.26, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 52, y: 7.8, z: -122, width: 15.0, bankAngle: 0.26, surface: 'boost', kerbLeft: true, kerbRight: true },
      { x: 138, y: 11.0, z: -108, width: 15.5, bankAngle: -0.24, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // North-East Mountain Climb & Overpass Tunnel
      { x: 202, y: 13.5, z: -140, width: 15.0, bankAngle: -0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 175, y: 14.5, z: -188, width: 15.0, bankAngle: -0.22, surface: 'asphalt', isTunnel: true },
      { x: 95, y: 13.5, z: -195, width: 15.0, bankAngle: 0, surface: 'asphalt', isTunnel: true },
      { x: 15, y: 11.0, z: -195, width: 15.0, bankAngle: 0, surface: 'asphalt', isTunnel: true },

      // North-West Straightaway Jump #2 (Collinear along Z = -195 from -45 to -165)
      { x: -45, y: 9.0, z: -195, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -105, y: 10.2, z: -195, width: 15.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -165, y: 4.5, z: -195, width: 16.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },

      // West Coast 6-Corner Technical Slalom
      { x: -222, y: 3.5, z: -158, width: 15.5, bankAngle: -0.30, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -172, y: 2.2, z: -105, width: 15.5, bankAngle: 0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -232, y: 1.2, z: -45, width: 15.5, bankAngle: -0.30, surface: 'boost', kerbLeft: true, kerbRight: true },
      { x: -170, y: 0.6, z: 18, width: 15.5, bankAngle: 0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -232, y: 0.5, z: 78, width: 15.5, bankAngle: -0.30, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -202, y: 0.8, z: 142, width: 16.0, bankAngle: -0.32, surface: 'asphalt', kerbLeft: true, kerbRight: true },
    ],
    hazards: [
      { t: 0.09, lateralOffset: -0.34, type: 'rough_ground', radius: 3.8 },
      { t: 0.16, lateralOffset: 0.32, type: 'water_puddle', radius: 3.5 },
      { t: 0.23, lateralOffset: -0.28, type: 'rough_ground', radius: 3.8 },
      { t: 0.36, lateralOffset: 0.32, type: 'mud_pit', radius: 3.6 },
      { t: 0.44, lateralOffset: -0.26, type: 'water_puddle', radius: 3.8 },
      { t: 0.52, lateralOffset: 0.30, type: 'rough_ground', radius: 4.0 },
      { t: 0.60, lateralOffset: -0.32, type: 'mud_pit', radius: 3.6 },
      { t: 0.78, lateralOffset: 0.34, type: 'rough_ground', radius: 3.9 },
      { t: 0.85, lateralOffset: -0.30, type: 'water_puddle', radius: 3.6 },
      { t: 0.92, lateralOffset: 0.28, type: 'rough_ground', radius: 3.8 },
    ],
    grandstands: [
      { x: -85, y: 0.5, z: 186, rotationY: Math.PI },
      { x: -15, y: 0.5, z: 186, rotationY: Math.PI },
      { x: -254, y: 0.5, z: 65, rotationY: Math.PI / 2 },
    ],
    mountains: [
      { x: 110, z: -195, radius: 80, height: 26 },
      { x: 238, z: -155, radius: 65, height: 22 },
      { x: -145, z: -145, radius: 50, height: 18 },
    ],
    sceneryProps: [
      { type: 'stadium', x: 75, z: 122, rotationY: 0.4, scale: 1.15 },
      { type: 'stadium', x: -125, z: 196, rotationY: Math.PI, scale: 1.1 },
      { type: 'stadium', x: 262, z: 75, rotationY: -Math.PI / 2, scale: 1.05 },
      { type: 'pit_building', x: -75, z: 136, rotationY: 0, scale: 1.1 },
      { type: 'pit_building', x: 65, z: 18, rotationY: 0, scale: 1.0 },
      { type: 'modern_turbine', x: 185, z: -65, rotationY: -0.8, scale: 1.15 },
      { type: 'modern_turbine', x: -25, z: -135, rotationY: 0.4, scale: 1.15 },
      { type: 'modern_turbine', x: -255, z: -95, rotationY: 1.2, scale: 1.15 },
      { type: 'modern_turbine', x: -255, z: -10, rotationY: 1.2, scale: 1.15 },
      { type: 'industrial_plant', x: -125, z: 68, rotationY: 0.5, scale: 1.05 },
      { type: 'industrial_plant', x: 105, z: -148, rotationY: -0.3, scale: 1.0 },
    ],
  },

  // 3. SUPER OFF ROAD "IRONMAN" BAJA DESERT & TRIPLE-JUMP STADIUM (~5,920m)
  ironman_baja: {
    id: 'ironman_baja',
    name: 'Ironman Baja Stadium',
    subtitle: 'Red-Rock Desert Ranches, Triple Tabletop Jumps, Whoops & Stadium Bowl',
    inspiration: 'Super Off Road',
    biome: 'desert_canyon',
    lengthMeters: 5920,
    defaultWeather: 'clear',
    difficulty: 'Ironman',
    description:
      'Tribute to Ivan "Ironman" Stewart’s Super Off Road: a wide sun-baked red-rock Baja stadium & desert canyon packed with 3 straightaway tabletop jumps, deep rhythm whoops, desert ranches, spinning water windmills, and floodlit stadium bowls.',
    scenerySeed: 303,
    nodes: [
      // Stadium Start Straight & Tabletop Jump #1 (Collinear along Z = 155 from -140 to +70)
      { x: -140, y: 0.5, z: 155, width: 16.5, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -65, y: 0.5, z: 155, width: 16.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: 10, y: 2.0, z: 155, width: 16.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: 70, y: 0.3, z: 155, width: 17.5, bankAngle: 0, surface: 'dirt', kerbLeft: false, kerbRight: false },

      // South-East Baja Berm S-Hook & Arroyo Dip
      { x: 138, y: -1.8, z: 122, width: 17.0, bankAngle: 0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 198, y: 3.8, z: 148, width: 17.0, bankAngle: -0.35, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 232, y: 5.4, z: 92, width: 17.0, bankAngle: -0.35, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 172, y: 2.8, z: 45, width: 16.5, bankAngle: 0.30, surface: 'dirt', kerbLeft: true, kerbRight: true },

      // East Rhythm Section Whoops & Canyon Climb
      { x: 228, y: -2.8, z: -5, width: 16.5, bankAngle: -0.30, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 178, y: 3.8, z: -55, width: 16.5, bankAngle: 0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 228, y: -3.0, z: -105, width: 16.5, bankAngle: -0.30, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 202, y: 6.8, z: -158, width: 16.5, bankAngle: -0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },

      // North Red-Rock Canyon Tunnel
      { x: 140, y: 11.5, z: -185, width: 15.5, bankAngle: -0.15, surface: 'dirt', isTunnel: true },
      { x: 65, y: 13.0, z: -185, width: 15.5, bankAngle: 0, surface: 'dirt', isTunnel: true },
      { x: -10, y: 11.5, z: -185, width: 15.5, bankAngle: 0, surface: 'dirt', isTunnel: true },

      // North Straightaway Tabletop Launch #2 (Collinear along Z = -185 from -60 to -170)
      { x: -60, y: 9.5, z: -185, width: 16.0, bankAngle: 0, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -115, y: 10.8, z: -185, width: 16.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -170, y: 4.2, z: -185, width: 17.5, bankAngle: 0, surface: 'dirt', kerbLeft: false, kerbRight: false },

      // North-West Berm into Desert Ranch Oasis Switchbacks
      { x: -224, y: 2.5, z: -140, width: 17.0, bankAngle: -0.34, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -172, y: -1.4, z: -88, width: 16.5, bankAngle: 0.30, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -222, y: -2.8, z: -32, width: 16.5, bankAngle: -0.32, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -135, y: -3.4, z: -12, width: 16.5, bankAngle: 0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -62, y: 1.4, z: -68, width: 16.5, bankAngle: -0.30, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 18, y: 3.2, z: -32, width: 16.5, bankAngle: 0.30, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 58, y: 2.4, z: 24, width: 16.5, bankAngle: 0.30, surface: 'boost', kerbLeft: true, kerbRight: true },

      // Infield Straightaway Tabletop Jump #3 (Collinear along Z = 76 from +5 to -125)
      { x: 5, y: 1.2, z: 76, width: 16.5, bankAngle: 0, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -58, y: 2.8, z: 76, width: 16.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -125, y: -1.2, z: 76, width: 17.5, bankAngle: 0, surface: 'dirt', kerbLeft: false, kerbRight: false },

      // West Stadium Hairpin Return
      { x: -205, y: 0.2, z: 62, width: 17.0, bankAngle: -0.32, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -226, y: 0.8, z: 112, width: 17.0, bankAngle: -0.35, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -195, y: 0.5, z: 148, width: 16.5, bankAngle: -0.22, surface: 'asphalt', kerbLeft: true, kerbRight: true },
    ],
    hazards: [
      { t: 0.14, lateralOffset: -0.32, type: 'rough_ground', radius: 4.2 },
      { t: 0.21, lateralOffset: 0.30, type: 'mud_pit', radius: 4.0 },
      { t: 0.29, lateralOffset: -0.28, type: 'rough_ground', radius: 4.0 },
      { t: 0.36, lateralOffset: 0.28, type: 'water_puddle', radius: 3.8 },
      { t: 0.55, lateralOffset: -0.32, type: 'rough_ground', radius: 4.2 },
      { t: 0.62, lateralOffset: 0.30, type: 'mud_pit', radius: 4.2 },
      { t: 0.69, lateralOffset: -0.28, type: 'rough_ground', radius: 4.0 },
      { t: 0.76, lateralOffset: 0.32, type: 'mud_pit', radius: 4.0 },
      { t: 0.84, lateralOffset: -0.26, type: 'rough_ground', radius: 4.2 },
      { t: 0.91, lateralOffset: 0.30, type: 'mud_pit', radius: 4.0 },
    ],
    grandstands: [
      { x: -85, y: 0.5, z: 180, rotationY: Math.PI },
      { x: -5, y: 0.5, z: 180, rotationY: Math.PI },
      { x: 254, y: 5.0, z: 90, rotationY: -Math.PI / 2 },
    ],
    mountains: [
      { x: 65, z: -185, radius: 85, height: 28 },
      { x: -25, z: -230, radius: 70, height: 24 },
      { x: -245, z: -165, radius: 65, height: 22 },
    ],
    sceneryProps: [
      { type: 'stadium', x: -125, z: 192, rotationY: Math.PI, scale: 1.15 },
      { type: 'stadium', x: 55, z: 192, rotationY: Math.PI, scale: 1.1 },
      { type: 'stadium', x: -258, z: 92, rotationY: Math.PI / 2, scale: 1.05 },
      { type: 'farm', x: -95, z: 25, rotationY: 0.4, scale: 1.15 },
      { type: 'windmill', x: -125, z: 32, rotationY: 0.6, scale: 1.2 },
      { type: 'farm', x: 118, z: -5, rotationY: -0.9, scale: 1.1 },
      { type: 'windmill', x: 138, z: -38, rotationY: -1.1, scale: 1.2 },
      { type: 'windmill', x: -115, z: -125, rotationY: 0.8, scale: 1.2 },
      { type: 'farm', x: -15, z: -122, rotationY: 0.2, scale: 1.05 },
      { type: 'windmill', x: 105, z: 75, rotationY: -0.5, scale: 1.15 },
      { type: 'pit_building', x: -65, z: 122, rotationY: 0, scale: 1.05 },
    ],
  },

  // 4. ALPINE GLACIER SWITCHBACKS & VILLAGE CHALETS (~6,480m)
  alpine_pass: {
    id: 'alpine_pass',
    name: 'Alpine Glacier Switchbacks',
    subtitle: 'Alpine Chalet Village, 17m Summit Climb, Ice Tunnel & Frozen Lake',
    inspiration: 'GeneRally + Rally',
    biome: 'alpine_glacier',
    lengthMeters: 6480,
    defaultWeather: 'snow',
    difficulty: 'Alpine',
    description:
      'High-altitude alpine rally ascending past timber ski chalets and mountain windmills to a 17.5-meter glacier tunnel, launching off a steep ski-jump crest, and drifting across a wide frozen glacial lake basin.',
    scenerySeed: 404,
    nodes: [
      // Alpine Ski Village Straight into South-East Slalom Esses
      { x: -140, y: 0.5, z: 165, width: 14.5, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -65, y: 0.5, z: 165, width: 14.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: 5, y: 0.6, z: 165, width: 14.5, bankAngle: -0.18, surface: 'boost', kerbLeft: true, kerbRight: true },
      { x: 65, y: 1.2, z: 132, width: 15.0, bankAngle: 0.24, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 125, y: 2.0, z: 168, width: 15.0, bankAngle: -0.26, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // East Mountain Serpentine Ascent (Tight switchbacks climbing from y = 2m to y = 17.5m)
      { x: 198, y: 4.8, z: 135, width: 14.5, bankAngle: -0.32, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 234, y: 7.6, z: 80, width: 14.5, bankAngle: -0.30, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 172, y: 10.4, z: 25, width: 14.5, bankAngle: 0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 234, y: 13.5, z: -30, width: 14.5, bankAngle: -0.30, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 178, y: 15.8, z: -85, width: 14.5, bankAngle: 0.26, surface: 'ice', kerbLeft: true, kerbRight: true },
      { x: 218, y: 17.0, z: -135, width: 14.5, bankAngle: -0.28, surface: 'ice', kerbLeft: true, kerbRight: true },

      // Summit Glacier Ice Tunnel (17.5m elevation)
      { x: 155, y: 17.5, z: -178, width: 14.5, bankAngle: -0.15, surface: 'ice', isTunnel: true },
      { x: 75, y: 17.5, z: -190, width: 14.5, bankAngle: 0, surface: 'ice', isTunnel: true },
      { x: 0, y: 16.0, z: -190, width: 14.5, bankAngle: 0, surface: 'ice', isTunnel: true },

      // Straightaway Alpine Ski-Jump (Collinear along Z = -190 from -55 to -165)
      { x: -55, y: 13.8, z: -190, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -105, y: 15.0, z: -190, width: 15.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -165, y: 7.2, z: -190, width: 16.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },

      // West Switchback Hairpins descending into the Wide Frozen Glacial Lake
      { x: -222, y: 5.2, z: -152, width: 15.0, bankAngle: -0.30, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -212, y: 2.5, z: -88, width: 15.0, bankAngle: -0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -125, y: 0.5, z: -55, width: 15.5, bankAngle: 0.30, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -168, y: -1.5, z: 2, width: 15.5, bankAngle: -0.30, surface: 'ice', kerbLeft: true, kerbRight: true },
      // Wide Frozen Glacial Lake Drift Sector (y = -3.4m)
      { x: -85, y: -3.2, z: -28, width: 16.5, bankAngle: 0.28, surface: 'ice', kerbLeft: true, kerbRight: true },
      { x: -18, y: -3.4, z: -92, width: 16.5, bankAngle: -0.28, surface: 'ice', kerbLeft: true, kerbRight: true },
      { x: 58, y: -3.4, z: -45, width: 16.5, bankAngle: 0.30, surface: 'ice', kerbLeft: true, kerbRight: true },
      { x: 42, y: -1.8, z: 28, width: 15.5, bankAngle: 0.26, surface: 'dirt', kerbLeft: true, kerbRight: true },

      // Valley Floor Straight with Jump #2 (Collinear along Z = 65 from -25 to -150)
      { x: -25, y: 0.5, z: 65, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -85, y: 2.2, z: 65, width: 15.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -150, y: -1.0, z: 65, width: 16.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },

      // South-West Alpine Village Hairpin Complex
      { x: -218, y: 0.2, z: 95, width: 15.5, bankAngle: -0.30, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -200, y: 0.5, z: 150, width: 15.0, bankAngle: -0.24, surface: 'asphalt', kerbLeft: true, kerbRight: true },
    ],
    hazards: [
      { t: 0.10, lateralOffset: 0.32, type: 'rough_ground', radius: 3.8 },
      { t: 0.18, lateralOffset: -0.30, type: 'water_puddle', radius: 3.5 },
      { t: 0.26, lateralOffset: 0.30, type: 'rough_ground', radius: 3.8 },
      { t: 0.35, lateralOffset: -0.28, type: 'water_puddle', radius: 3.6 },
      { t: 0.54, lateralOffset: 0.32, type: 'rough_ground', radius: 4.0 },
      { t: 0.62, lateralOffset: -0.28, type: 'mud_pit', radius: 3.8 },
      { t: 0.69, lateralOffset: 0.30, type: 'rough_ground', radius: 3.9 },
      { t: 0.76, lateralOffset: -0.30, type: 'water_puddle', radius: 3.8 },
      { t: 0.84, lateralOffset: 0.32, type: 'mud_pit', radius: 3.6 },
      { t: 0.93, lateralOffset: -0.30, type: 'rough_ground', radius: 3.8 },
    ],
    grandstands: [
      { x: -75, y: 0.5, z: 185, rotationY: Math.PI },
      { x: -5, y: 0.5, z: 185, rotationY: Math.PI },
    ],
    mountains: [
      { x: 80, z: -190, radius: 92, height: 32 },
      { x: 205, z: -165, radius: 75, height: 28 },
      { x: -160, z: -125, radius: 60, height: 22 },
      { x: 115, z: 45, radius: 65, height: 24 },
    ],
    sceneryProps: [
      { type: 'alpine_chalet', x: -115, z: 132, rotationY: 0.2, scale: 1.15 },
      { type: 'alpine_chalet', x: -42, z: 128, rotationY: -0.3, scale: 1.1 },
      { type: 'alpine_chalet', x: 32, z: 102, rotationY: 0.5, scale: 1.1 },
      { type: 'alpine_chalet', x: 135, z: 112, rotationY: -0.7, scale: 1.15 },
      { type: 'alpine_chalet', x: -175, z: 122, rotationY: 0.8, scale: 1.1 },
      { type: 'alpine_chalet', x: -95, z: -135, rotationY: 0.4, scale: 1.15 },
      { type: 'stadium', x: -125, z: 196, rotationY: Math.PI, scale: 1.05 },
      { type: 'pit_building', x: -80, z: 134, rotationY: 0, scale: 1.0 },
      { type: 'windmill', x: 128, z: -12, rotationY: -1.1, scale: 1.15 },
      { type: 'modern_turbine', x: 135, z: -115, rotationY: -0.6, scale: 1.15 },
      { type: 'farm', x: -115, z: 24, rotationY: 0.9, scale: 1.05 },
    ],
  },

  // 5. THUNDER VALLEY ENDURANCE, WIND FARM RIDGE & TWIN VIADUCTS (~6,420m)
  thunder_valley: {
    id: 'thunder_valley',
    name: 'Thunder Valley Endurance',
    subtitle: 'Windmill Ridge, Twin Viaduct Tunnels, Industrial Gorge & Banking',
    inspiration: 'R.C. Pro-Am + Off Road',
    biome: 'industrial_gorge',
    lengthMeters: 6420,
    defaultWeather: 'clear',
    difficulty: 'Endurance',
    description:
      'Grand Prix finale combining banked speedway sweepers, a 6-turbine Windmill Ridge, Industrial Power Plants, twin mountain viaduct tunnels, a deep -3.8m canyon gorge switchback complex, and two straightaway launch ramps.',
    scenerySeed: 505,
    nodes: [
      // South Speedway Straight into Bus-Stop Chicane
      { x: -145, y: 0.5, z: 162, width: 15.5, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -70, y: 0.5, z: 162, width: 15.5, bankAngle: 0, surface: 'boost', kerbLeft: true, kerbRight: true },
      { x: 0, y: 0.6, z: 162, width: 15.5, bankAngle: -0.18, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 60, y: 1.2, z: 126, width: 15.5, bankAngle: 0.26, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 120, y: 1.5, z: 166, width: 15.5, bankAngle: -0.26, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 180, y: 2.5, z: 145, width: 16.0, bankAngle: -0.30, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // East Banked Speedway Turn & Viaduct Tunnel #1
      { x: 225, y: 5.0, z: 95, width: 16.0, bankAngle: -0.32, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 230, y: 8.5, z: 25, width: 15.5, bankAngle: -0.22, surface: 'asphalt', isTunnel: true },
      { x: 230, y: 11.0, z: -50, width: 15.5, bankAngle: -0.15, surface: 'asphalt', isTunnel: true },
      { x: 215, y: 12.5, z: -125, width: 15.5, bankAngle: -0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // North Straightaway Jump #1 (Collinear along Z = -180 from +150 to +15)
      { x: 150, y: 11.5, z: -180, width: 15.5, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 85, y: 12.8, z: -180, width: 16.0, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: 15, y: 6.5, z: -180, width: 17.0, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },

      // North-Central Wind-Farm Ridge S-Chicane before Tunnel #2
      { x: -45, y: 5.5, z: -142, width: 15.5, bankAngle: 0.26, surface: 'boost', kerbLeft: true, kerbRight: true },
      { x: -110, y: 6.0, z: -185, width: 15.5, bankAngle: -0.26, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -170, y: 7.2, z: -175, width: 15.5, bankAngle: -0.26, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // North-West Mountain Viaduct Tunnel #2
      { x: -215, y: 8.0, z: -135, width: 15.0, bankAngle: -0.26, surface: 'asphalt', isTunnel: true },
      { x: -225, y: 6.5, z: -65, width: 15.0, bankAngle: -0.22, surface: 'asphalt', isTunnel: true },

      // Deep Canyon Gorge Winding Switchbacks (dropping to y = -3.8m)
      { x: -170, y: -1.4, z: -15, width: 15.5, bankAngle: 0.26, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -125, y: -3.5, z: -68, width: 16.0, bankAngle: -0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -55, y: -3.8, z: -20, width: 16.0, bankAngle: 0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 15, y: -3.2, z: -65, width: 16.0, bankAngle: -0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 80, y: -0.8, z: -15, width: 15.5, bankAngle: 0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 85, y: 2.5, z: 45, width: 15.5, bankAngle: 0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },

      // Infield Straightaway Jump #2 (Collinear along Z = 72 from +20 to -115)
      { x: 20, y: 2.8, z: 72, width: 15.5, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -45, y: 4.2, z: 72, width: 16.0, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -115, y: 0.5, z: 72, width: 17.0, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },

      // South-West S-Hook & Banked Bowl back to Start
      { x: -175, y: 0.5, z: 48, width: 15.5, bankAngle: -0.26, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -225, y: 1.0, z: 105, width: 16.5, bankAngle: -0.32, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -200, y: 0.5, z: 152, width: 15.5, bankAngle: -0.22, surface: 'asphalt', kerbLeft: true, kerbRight: true },
    ],
    hazards: [
      { t: 0.08, lateralOffset: -0.32, type: 'rough_ground', radius: 3.9 },
      { t: 0.15, lateralOffset: 0.34, type: 'water_puddle', radius: 3.6 },
      { t: 0.22, lateralOffset: -0.28, type: 'rough_ground', radius: 3.8 },
      { t: 0.42, lateralOffset: 0.32, type: 'rough_ground', radius: 4.0 },
      { t: 0.48, lateralOffset: -0.30, type: 'water_puddle', radius: 3.6 },
      { t: 0.62, lateralOffset: 0.28, type: 'mud_pit', radius: 4.0 },
      { t: 0.68, lateralOffset: -0.30, type: 'rough_ground', radius: 4.2 },
      { t: 0.74, lateralOffset: 0.28, type: 'mud_pit', radius: 4.0 },
      { t: 0.81, lateralOffset: -0.32, type: 'rough_ground', radius: 4.0 },
      { t: 0.90, lateralOffset: 0.30, type: 'water_puddle', radius: 3.5 },
      { t: 0.95, lateralOffset: -0.28, type: 'rough_ground', radius: 3.8 },
    ],
    grandstands: [
      { x: -80, y: 0.5, z: 182, rotationY: Math.PI },
      { x: -10, y: 0.5, z: 182, rotationY: Math.PI },
    ],
    mountains: [
      { x: 235, z: -5, radius: 75, height: 26 },
      { x: -225, z: -110, radius: 75, height: 25 },
      { x: -55, z: -115, radius: 55, height: 20 },
    ],
    sceneryProps: [
      { type: 'stadium', x: -122, z: 194, rotationY: Math.PI, scale: 1.15 },
      { type: 'stadium', x: -255, z: 105, rotationY: Math.PI / 2, scale: 1.05 },
      { type: 'pit_building', x: -65, z: 128, rotationY: 0, scale: 1.05 },
      { type: 'industrial_plant', x: 162, z: 58, rotationY: -0.8, scale: 1.1 },
      { type: 'industrial_plant', x: 152, z: -78, rotationY: -1.2, scale: 1.1 },
      { type: 'industrial_plant', x: -145, z: -122, rotationY: 0.6, scale: 1.05 },
      { type: 'modern_turbine', x: 120, z: -215, rotationY: 0.2, scale: 1.2 },
      { type: 'modern_turbine', x: 45, z: -215, rotationY: 0.2, scale: 1.2 },
      { type: 'modern_turbine', x: -35, z: -215, rotationY: 0.2, scale: 1.2 },
      { type: 'modern_turbine', x: -115, z: -218, rotationY: 0.2, scale: 1.2 },
      { type: 'windmill', x: 138, z: 105, rotationY: -0.5, scale: 1.15 },
      { type: 'farm', x: -115, z: 22, rotationY: 0.4, scale: 1.05 },
      { type: 'windmill', x: -145, z: 28, rotationY: 0.7, scale: 1.15 },
    ],
  },
};

export const TRACK_ORDER: TrackId[] = [
  'pinewood_gp',
  'pro_am_circuit',
  'ironman_baja',
  'alpine_pass',
  'thunder_valley',
];

const _worldUp = new THREE.Vector3(0, 1, 0);

/**
 * Precomputes 1,440 dense 3D spline samples for the 400%-longer circuits.
 */
export function bakeTrack(def: TrackDefinition, resolution: number = 1440): BakedTrack {
  const points = def.nodes.map((n) => new THREE.Vector3(n.x, n.y, n.z));
  const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.45);

  const samples: BakedTrackSample[] = [];
  const nodeCount = def.nodes.length;

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < resolution; i++) {
    const t = i / resolution;
    const pos = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();

    const floatIdx = t * nodeCount;
    const idx0 = Math.floor(floatIdx) % nodeCount;
    const idx1 = (idx0 + 1) % nodeCount;
    const frac = floatIdx - Math.floor(floatIdx);
    const smoothFrac = frac * frac * (3 - 2 * frac);

    const n0 = def.nodes[idx0];
    const n1 = def.nodes[idx1];

    const width = THREE.MathUtils.lerp(n0.width, n1.width, smoothFrac);
    const bankAngle = THREE.MathUtils.lerp(n0.bankAngle, n1.bankAngle, smoothFrac);
    const surface = frac < 0.5 ? n0.surface : n1.surface;
    const kerbLeft = Boolean(frac < 0.5 ? n0.kerbLeft : n1.kerbLeft);
    const kerbRight = Boolean(frac < 0.5 ? n0.kerbRight : n1.kerbRight);
    const isTunnel = Boolean(frac < 0.5 ? n0.isTunnel : n1.isTunnel);

    // Base horizontal right vector: tangent x worldUp
    const flatRight = new THREE.Vector3().crossVectors(tangent, _worldUp).normalize();
    const baseUp = new THREE.Vector3().crossVectors(flatRight, tangent).normalize();

    // Apply banking rotation around the forward tangent axis
    const bankQuat = new THREE.Quaternion().setFromAxisAngle(tangent, bankAngle);
    const right = flatRight.clone().applyQuaternion(bankQuat).normalize();
    const up = baseUp.clone().applyQuaternion(bankQuat).normalize();

    if (pos.x < minX) minX = pos.x;
    if (pos.x > maxX) maxX = pos.x;
    if (pos.z < minZ) minZ = pos.z;
    if (pos.z > maxZ) maxZ = pos.z;

    samples.push({
      t,
      position: pos,
      tangent,
      right,
      up,
      width,
      bankAngle,
      surface,
      kerbLeft,
      kerbRight,
      isTunnel,
    });
  }

  return {
    definition: def,
    curve,
    samples,
    bounds: { minX, maxX, minZ, maxZ },
  };
}

/**
 * Zero-allocation surface & elevation lookup for any (x, z) world coordinate.
 */
export function queryTrackSurface(
  x: number,
  z: number,
  baked: BakedTrack,
  outResult: TrackSurfaceQueryResult,
  hintIndex: number = -1
): void {
  const samples = baked.samples;
  const len = samples.length;

  let bestIdx = 0;
  let bestDistSq = Infinity;

  if (hintIndex >= 0 && hintIndex < len) {
    // Local search window of ±65 samples first
    const windowSize = 65;
    for (let offset = -windowSize; offset <= windowSize; offset++) {
      const idx = (hintIndex + offset + len) % len;
      const s = samples[idx];
      const dx = x - s.position.x;
      const dz = z - s.position.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestIdx = idx;
      }
    }
  }

  // Fallback to full scan if far from hint
  if (bestDistSq > 220) {
    for (let i = 0; i < len; i++) {
      const s = samples[i];
      const dx = x - s.position.x;
      const dz = z - s.position.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestIdx = i;
      }
    }
  }

  const s = samples[bestIdx];
  const dx = x - s.position.x;
  const dz = z - s.position.z;

  const lateralDist = dx * s.right.x + dz * s.right.z;
  const halfWidth = s.width * 0.5;
  const normalizedLateral = lateralDist / halfWidth;
  const onRoad = Math.abs(normalizedLateral) <= 1.08;

  if (onRoad) {
    const bankedY = s.position.y + lateralDist * s.right.y;
    outResult.closestIndex = bestIdx;
    outResult.t = s.t;
    outResult.groundY = bankedY;
    outResult.lateralDist = lateralDist;
    outResult.normalizedLateral = normalizedLateral;
    outResult.surface = s.surface;
    outResult.bankAngle = s.bankAngle;
    outResult.tangentX = s.tangent.x;
    outResult.tangentY = s.tangent.y;
    outResult.tangentZ = s.tangent.z;
    outResult.upX = s.up.x;
    outResult.upY = s.up.y;
    outResult.upZ = s.up.z;
    outResult.onRoad = true;
    outResult.isTunnel = s.isTunnel;
  } else {
    const edgeLateral = Math.sign(lateralDist) * halfWidth;
    const edgeY = s.position.y + edgeLateral * s.right.y;
    const excessDist = Math.abs(lateralDist) - halfWidth;
    const blend = Math.min(1, excessDist / 16.0);
    const turfBaseY = 0.35 * Math.sin(x * 0.03) * Math.cos(z * 0.03);
    const groundY = THREE.MathUtils.lerp(edgeY, turfBaseY, blend);

    outResult.closestIndex = bestIdx;
    outResult.t = s.t;
    outResult.groundY = groundY;
    outResult.lateralDist = lateralDist;
    outResult.normalizedLateral = normalizedLateral;
    outResult.surface = 'grass';
    outResult.bankAngle = s.bankAngle * (1 - blend);
    outResult.tangentX = s.tangent.x;
    outResult.tangentY = s.tangent.y;
    outResult.tangentZ = s.tangent.z;
    outResult.upX = THREE.MathUtils.lerp(s.up.x, 0, blend);
    outResult.upY = THREE.MathUtils.lerp(s.up.y, 1, blend);
    outResult.upZ = THREE.MathUtils.lerp(s.up.z, 0, blend);
    outResult.onRoad = false;
    outResult.isTunnel = false;
  }
}
