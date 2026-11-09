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
  // 1. GENE-RALLY INSPIRED GRAND PRIX & FOREST MOUNTAIN CIRCUIT (~5,680m)
  pinewood_gp: {
    id: 'pinewood_gp',
    name: 'GeneRally Forest GP',
    subtitle: 'Pine Mountain Tunnel, Valley Dip & Straightaway Double Jump',
    inspiration: 'GeneRally 2',
    lengthMeters: 5680,
    defaultWeather: 'clear',
    difficulty: 'Circuit',
    description:
      'A massive 4x-scale GeneRally Grand Prix tour featuring a long stadium main straight, sweeping banked bowl corners, an elevated Pine Mountain climb through a rock tunnel, a straightaway jump crest, and an infield dirt rally valley dip.',
    scenerySeed: 101,
    nodes: [
      // South Main Stadium Straight (Collinear along Z = 150, moving +X from -140 to +140)
      { x: -140, y: 0.5, z: 150, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -70, y: 0.5, z: 150, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: 0, y: 0.5, z: 150, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: 70, y: 0.5, z: 150, width: 15.0, bankAngle: 0, surface: 'boost', kerbLeft: true, kerbRight: true },
      { x: 140, y: 0.8, z: 150, width: 15.0, bankAngle: -0.10, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // South-East Banked Sweeper climbing into East Ridge
      { x: 195, y: 2.8, z: 120, width: 15.5, bankAngle: -0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 220, y: 5.5, z: 60, width: 15.5, bankAngle: -0.30, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 220, y: 9.0, z: -10, width: 15.0, bankAngle: -0.18, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // North-East Mountain Climb & Rock Tunnel
      { x: 205, y: 12.5, z: -80, width: 14.5, bankAngle: -0.15, surface: 'asphalt', isTunnel: true },
      { x: 175, y: 14.0, z: -135, width: 14.5, bankAngle: -0.15, surface: 'asphalt', isTunnel: true },
      { x: 125, y: 12.8, z: -165, width: 14.5, bankAngle: -0.12, surface: 'asphalt', isTunnel: true },

      // Long North Backstraight with Collinear Jump & Wide Landing Apron (Z = -170, moving -X from +65 to -165)
      { x: 65, y: 9.5, z: -170, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 10, y: 10.8, z: -170, width: 15.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -45, y: 5.2, z: -170, width: 16.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: -105, y: 4.0, z: -170, width: 15.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: -165, y: 3.2, z: -170, width: 15.0, bankAngle: -0.12, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // North-West Banked Hairpin dropping into Infield Valley Dip
      { x: -215, y: 1.8, z: -130, width: 15.5, bankAngle: -0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -210, y: -1.5, z: -65, width: 15.5, bankAngle: -0.24, surface: 'dirt', kerbLeft: true, kerbRight: true },

      // Infield Dirt Rally Valley Dip (y = -2.8m basin)
      { x: -150, y: -2.8, z: -25, width: 15.0, bankAngle: 0.20, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -80, y: -2.5, z: -45, width: 15.0, bankAngle: 0, surface: 'dirt', kerbLeft: false, kerbRight: false },
      { x: -20, y: 0.5, z: -30, width: 15.0, bankAngle: 0.24, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 25, y: 2.2, z: 20, width: 15.0, bankAngle: 0.26, surface: 'dirt', kerbLeft: true, kerbRight: true },

      // Infield Return Straight (Z = 65, moving -X from -25 to -165) with Second Jump
      { x: -25, y: 2.5, z: 65, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -80, y: 3.8, z: 65, width: 15.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -135, y: 0.5, z: 65, width: 16.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: -185, y: 0.5, z: 65, width: 15.5, bankAngle: -0.15, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // South-West Banked Bowl Turn back onto Main Straight
      { x: -220, y: 0.8, z: 105, width: 16.0, bankAngle: -0.30, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -195, y: 0.5, z: 142, width: 15.5, bankAngle: -0.22, surface: 'asphalt', kerbLeft: true, kerbRight: true },
    ],
    hazards: [
      { t: 0.16, lateralOffset: 0.35, type: 'water_puddle', radius: 3.4 },
      { t: 0.48, lateralOffset: -0.3, type: 'water_puddle', radius: 3.2 },
      { t: 0.66, lateralOffset: -0.25, type: 'mud_pit', radius: 3.8 },
      { t: 0.72, lateralOffset: 0.3, type: 'mud_pit', radius: 3.6 },
      { t: 0.88, lateralOffset: 0.35, type: 'water_puddle', radius: 3.2 },
    ],
    grandstands: [
      { x: -60, y: 0.5, z: 170, rotationY: Math.PI },
      { x: 0, y: 0.5, z: 170, rotationY: Math.PI },
      { x: 60, y: 0.5, z: 170, rotationY: Math.PI },
      { x: 242, y: 5.5, z: 30, rotationY: -Math.PI / 2 },
    ],
    mountains: [
      { x: 185, z: -130, radius: 75, height: 28 },
      { x: 120, z: -215, radius: 68, height: 24 },
      { x: -245, z: -150, radius: 65, height: 20 },
    ],
  },

  // 2. R.C. PRO-AM CHAMPIONSHIP CIRCUIT (~5,920m)
  pro_am_circuit: {
    id: 'pro_am_circuit',
    name: 'R.C. Pro-Am Championship',
    subtitle: 'High-Banked Tarmac Bowls, Overpass Tunnel & Turbo Straights',
    inspiration: 'R.C. Pro-Am',
    lengthMeters: 5920,
    defaultWeather: 'rain',
    difficulty: 'Pro-Am',
    description:
      'Inspired by classic R.C. Pro-Am tarmac combat tracks: long straightaways for forward autocannon duels, steep 20-degree banked bowl hairpins, a concrete tunnel underpass, chevron turbo zippers, and water puddle hazards.',
    scenerySeed: 202,
    nodes: [
      // South Championship Straight (Z = 160, moving +X from -150 to +150)
      { x: -150, y: 0.5, z: 160, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -75, y: 0.5, z: 160, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: 0, y: 0.5, z: 160, width: 15.0, bankAngle: 0, surface: 'boost', kerbLeft: true, kerbRight: true },
      { x: 75, y: 0.5, z: 160, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: 150, y: 1.0, z: 160, width: 15.0, bankAngle: -0.12, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // East Steep Banked Bowl Turn #1
      { x: 215, y: 3.5, z: 125, width: 16.0, bankAngle: -0.32, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 230, y: 6.0, z: 55, width: 16.0, bankAngle: -0.34, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 190, y: 4.5, z: 5, width: 15.5, bankAngle: -0.26, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // Infield Straight (Z = -10, moving -X from +120 to -60) with Straightaway Jump
      { x: 120, y: 3.2, z: -10, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 60, y: 4.8, z: -10, width: 15.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: 0, y: 0.8, z: -10, width: 16.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: -60, y: -1.8, z: -10, width: 15.5, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // Central Dip & Right-Hand Banked Loop heading North-East
      { x: -110, y: -2.8, z: -45, width: 15.5, bankAngle: 0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -85, y: 1.5, z: -100, width: 15.5, bankAngle: 0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 10, y: 6.5, z: -110, width: 15.0, bankAngle: 0.15, surface: 'boost', kerbLeft: true, kerbRight: true },
      { x: 110, y: 10.5, z: -110, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // North-East Mountain Climb & Overpass Tunnel
      { x: 195, y: 13.5, z: -135, width: 15.0, bankAngle: -0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 175, y: 14.5, z: -185, width: 15.0, bankAngle: -0.22, surface: 'asphalt', isTunnel: true },
      { x: 95, y: 13.5, z: -195, width: 15.0, bankAngle: 0, surface: 'asphalt', isTunnel: true },
      { x: 10, y: 11.0, z: -195, width: 15.0, bankAngle: 0, surface: 'asphalt', isTunnel: true },

      // Long North-West Straightaway with Jump #2 (Z = -195, moving -X from -55 to -185)
      { x: -55, y: 9.0, z: -195, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -110, y: 10.2, z: -195, width: 15.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -165, y: 4.5, z: -195, width: 16.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: -215, y: 3.5, z: -165, width: 15.5, bankAngle: -0.26, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // West Outer Speedway Chute (X = -225, moving +Z from -100 to +115)
      { x: -225, y: 2.0, z: -95, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -225, y: 0.5, z: -15, width: 15.0, bankAngle: 0, surface: 'boost', kerbLeft: true, kerbRight: true },
      { x: -225, y: 0.5, z: 65, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: -210, y: 0.8, z: 130, width: 16.0, bankAngle: -0.32, surface: 'asphalt', kerbLeft: true, kerbRight: true },
    ],
    hazards: [
      { t: 0.11, lateralOffset: -0.35, type: 'water_puddle', radius: 3.5 },
      { t: 0.24, lateralOffset: 0.35, type: 'water_puddle', radius: 3.5 },
      { t: 0.44, lateralOffset: -0.25, type: 'water_puddle', radius: 3.8 },
      { t: 0.58, lateralOffset: 0.3, type: 'mud_pit', radius: 3.4 },
      { t: 0.82, lateralOffset: -0.3, type: 'water_puddle', radius: 3.6 },
      { t: 0.91, lateralOffset: 0.35, type: 'water_puddle', radius: 3.4 },
    ],
    grandstands: [
      { x: -70, y: 0.5, z: 180, rotationY: Math.PI },
      { x: 10, y: 0.5, z: 180, rotationY: Math.PI },
      { x: 90, y: 0.5, z: 180, rotationY: Math.PI },
      { x: -246, y: 0.5, z: 25, rotationY: Math.PI / 2 },
    ],
    mountains: [
      { x: 110, z: -195, radius: 80, height: 26 },
      { x: 235, z: -155, radius: 65, height: 22 },
      { x: -165, z: -90, radius: 55, height: 18 },
    ],
  },

  // 3. SUPER OFF ROAD "IRONMAN" BAJA STADIUM (~5,450m)
  ironman_baja: {
    id: 'ironman_baja',
    name: 'Ironman Baja Stadium',
    subtitle: 'Triple Valley Whoops, High Dirt Berms, Tabletop Jumps & Canyon Tunnel',
    inspiration: 'Super Off Road',
    lengthMeters: 5450,
    defaultWeather: 'clear',
    difficulty: 'Ironman',
    description:
      'Tribute to Ivan "Ironman" Stewart’s Super Off Road: an epic dirt-and-stadium endurance course packed with deep rhythm valley dips (whoops), high-banked dirt berms, straightaway tabletop jumps, mud bogs, and a canyon arch tunnel.',
    scenerySeed: 303,
    nodes: [
      // Stadium Start Straight (Z = 155, moving +X from -140 to +130)
      { x: -140, y: 0.5, z: 155, width: 15.5, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -65, y: 0.5, z: 155, width: 15.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: 15, y: 1.8, z: 155, width: 16.0, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: 75, y: 0.4, z: 155, width: 16.5, bankAngle: 0, surface: 'dirt', kerbLeft: false, kerbRight: false },
      { x: 140, y: 0.8, z: 155, width: 16.0, bankAngle: -0.15, surface: 'dirt', kerbLeft: true, kerbRight: true },

      // East High-Banked Dirt Berm
      { x: 205, y: 3.8, z: 115, width: 16.5, bankAngle: -0.34, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 220, y: 5.2, z: 40, width: 16.5, bankAngle: -0.32, surface: 'dirt', kerbLeft: true, kerbRight: true },

      // East Rhythm Section: Super Off Road Triple Valley Dips (Collinear along X = 215, moving -Z)
      { x: 215, y: -2.6, z: -20, width: 15.5, bankAngle: 0, surface: 'dirt' },
      { x: 215, y: 3.4, z: -65, width: 15.5, bankAngle: 0, surface: 'dirt' },
      { x: 215, y: -3.0, z: -110, width: 15.5, bankAngle: 0, surface: 'dirt' },
      { x: 200, y: 6.5, z: -160, width: 15.5, bankAngle: -0.24, surface: 'dirt', kerbLeft: true, kerbRight: true },

      // North Red-Rock Canyon Tunnel
      { x: 140, y: 11.5, z: -185, width: 15.0, bankAngle: -0.15, surface: 'dirt', isTunnel: true },
      { x: 65, y: 13.0, z: -185, width: 15.0, bankAngle: 0, surface: 'dirt', isTunnel: true },
      { x: -10, y: 11.5, z: -185, width: 15.0, bankAngle: 0, surface: 'dirt', isTunnel: true },

      // North Straightaway Tabletop Launch (Z = -185, moving -X from -65 to -185)
      { x: -65, y: 9.5, z: -185, width: 15.5, bankAngle: 0, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -115, y: 10.8, z: -185, width: 16.0, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -170, y: 4.2, z: -185, width: 17.0, bankAngle: 0, surface: 'dirt', kerbLeft: false, kerbRight: false },

      // North-West Berm into Infield S-Bends
      { x: -220, y: 2.5, z: -140, width: 16.5, bankAngle: -0.32, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -205, y: -1.8, z: -70, width: 16.0, bankAngle: -0.25, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -125, y: -3.2, z: -35, width: 16.0, bankAngle: 0.26, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -45, y: 1.5, z: -60, width: 15.5, bankAngle: 0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 35, y: 3.0, z: -15, width: 15.5, bankAngle: 0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 15, y: 1.2, z: 55, width: 15.5, bankAngle: 0.24, surface: 'boost', kerbLeft: true, kerbRight: true },

      // Infield Mud Bog Valley & West Hairpin Return
      { x: -75, y: -2.4, z: 65, width: 16.0, bankAngle: 0, surface: 'dirt' },
      { x: -165, y: -1.5, z: 60, width: 16.0, bankAngle: -0.22, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -220, y: 0.8, z: 105, width: 16.5, bankAngle: -0.34, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -195, y: 0.5, z: 148, width: 16.0, bankAngle: -0.22, surface: 'asphalt', kerbLeft: true, kerbRight: true },
    ],
    hazards: [
      { t: 0.18, lateralOffset: -0.25, type: 'mud_pit', radius: 4.2 },
      { t: 0.34, lateralOffset: 0.25, type: 'water_puddle', radius: 3.8 },
      { t: 0.62, lateralOffset: -0.3, type: 'mud_pit', radius: 4.2 },
      { t: 0.71, lateralOffset: 0.3, type: 'mud_pit', radius: 4.0 },
      { t: 0.86, lateralOffset: 0.0, type: 'mud_pit', radius: 4.4 },
    ],
    grandstands: [
      { x: -80, y: 0.5, z: 175, rotationY: Math.PI },
      { x: -10, y: 0.5, z: 175, rotationY: Math.PI },
      { x: 60, y: 0.5, z: 175, rotationY: Math.PI },
      { x: 242, y: 3.8, z: 80, rotationY: -Math.PI / 2 },
    ],
    mountains: [
      { x: 65, z: -185, radius: 85, height: 28 },
      { x: -25, z: -230, radius: 70, height: 24 },
      { x: -245, z: -165, radius: 65, height: 22 },
    ],
  },

  // 4. ALPINE GLACIER SWITCHBACKS (~6,240m)
  alpine_pass: {
    id: 'alpine_pass',
    name: 'Alpine Glacier Switchbacks',
    subtitle: 'Summit Climb, Glacier Ice Tunnel, Ski-Jump Straight & Valley Basin',
    inspiration: 'GeneRally + Rally',
    lengthMeters: 6240,
    defaultWeather: 'snow',
    difficulty: 'Alpine',
    description:
      'High-altitude alpine rally marathon ascending 16 meters to a snow-capped summit, boring through a crystalline glacier tunnel, launching off a straightaway ski-jump crest, and carving through banked valley switchbacks.',
    scenerySeed: 404,
    nodes: [
      // Valley Floor Main Straight (Z = 165, moving +X from -145 to +145)
      { x: -145, y: 0.5, z: 165, width: 14.5, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -70, y: 0.5, z: 165, width: 14.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: 0, y: 0.5, z: 165, width: 14.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: 75, y: 0.8, z: 165, width: 14.5, bankAngle: 0, surface: 'boost', kerbLeft: true, kerbRight: true },
      { x: 145, y: 2.0, z: 165, width: 14.5, bankAngle: -0.14, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // East Mountain Ascent (climbing from y = 2m to y = 16m)
      { x: 210, y: 5.5, z: 125, width: 15.0, bankAngle: -0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 230, y: 9.5, z: 50, width: 15.0, bankAngle: -0.26, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 225, y: 13.5, z: -35, width: 14.5, bankAngle: -0.20, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 205, y: 16.0, z: -115, width: 14.5, bankAngle: -0.26, surface: 'ice', kerbLeft: true, kerbRight: true },

      // Summit Glacier Ice Tunnel
      { x: 150, y: 16.5, z: -175, width: 14.5, bankAngle: -0.15, surface: 'ice', isTunnel: true },
      { x: 75, y: 16.5, z: -190, width: 14.5, bankAngle: 0, surface: 'ice', isTunnel: true },
      { x: 0, y: 15.5, z: -190, width: 14.5, bankAngle: 0, surface: 'ice', isTunnel: true },

      // Long Straightaway Alpine Ski-Jump & Wide Landing Runway (Z = -190, moving -X from -55 to -185)
      { x: -55, y: 13.5, z: -190, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -105, y: 14.6, z: -190, width: 15.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -165, y: 7.5, z: -190, width: 16.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: -215, y: 5.5, z: -155, width: 15.5, bankAngle: -0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // West Switchback Hairpins descending into Frozen Basin
      { x: -210, y: 3.0, z: -85, width: 15.0, bankAngle: -0.26, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -120, y: 1.0, z: -65, width: 15.0, bankAngle: 0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -40, y: -1.5, z: -90, width: 15.0, bankAngle: 0.28, surface: 'ice', kerbLeft: true, kerbRight: true },
      { x: 40, y: -3.0, z: -45, width: 15.0, bankAngle: 0.28, surface: 'ice', kerbLeft: true, kerbRight: true },
      { x: 20, y: -2.2, z: 30, width: 15.0, bankAngle: 0.26, surface: 'dirt', kerbLeft: true, kerbRight: true },

      // Valley Floor Straight with Jump #2 (Z = 60, moving -X from -40 to -185)
      { x: -40, y: 0.5, z: 60, width: 15.0, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -95, y: 2.0, z: 60, width: 15.5, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -155, y: -1.0, z: 60, width: 16.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: -215, y: 0.2, z: 95, width: 15.5, bankAngle: -0.30, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -200, y: 0.5, z: 150, width: 15.0, bankAngle: -0.24, surface: 'asphalt', kerbLeft: true, kerbRight: true },
    ],
    hazards: [
      { t: 0.22, lateralOffset: -0.3, type: 'water_puddle', radius: 3.4 },
      { t: 0.64, lateralOffset: 0.25, type: 'mud_pit', radius: 3.6 },
      { t: 0.74, lateralOffset: -0.3, type: 'water_puddle', radius: 3.8 },
      { t: 0.85, lateralOffset: 0.3, type: 'mud_pit', radius: 3.6 },
    ],
    grandstands: [
      { x: -50, y: 0.5, z: 185, rotationY: Math.PI },
      { x: 30, y: 0.5, z: 185, rotationY: Math.PI },
    ],
    mountains: [
      { x: 80, z: -190, radius: 92, height: 32 },
      { x: 205, z: -165, radius: 75, height: 28 },
      { x: -160, z: -125, radius: 60, height: 22 },
      { x: 115, z: 45, radius: 65, height: 24 },
    ],
  },

  // 5. THUNDER VALLEY ENDURANCE (~6,100m)
  thunder_valley: {
    id: 'thunder_valley',
    name: 'Thunder Valley Endurance',
    subtitle: 'Twin Viaduct Tunnels, Canyon Gorge Dip & High-Speed Banking',
    inspiration: 'R.C. Pro-Am + Off Road',
    lengthMeters: 6100,
    defaultWeather: 'clear',
    difficulty: 'Endurance',
    description:
      'Fast perimeter speedway fused with a deep canyon infield: features twin mountain tunnels, a -3.5m canyon gorge dip, 20-degree banked high-speed sweepers, and two dead-straight launch ramps.',
    scenerySeed: 505,
    nodes: [
      // South Speedway Straight (Z = 160, moving +X from -150 to +150)
      { x: -150, y: 0.5, z: 160, width: 15.5, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -75, y: 0.5, z: 160, width: 15.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: 0, y: 0.5, z: 160, width: 15.5, bankAngle: 0, surface: 'boost', kerbLeft: true, kerbRight: true },
      { x: 75, y: 0.5, z: 160, width: 15.5, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: 150, y: 1.2, z: 160, width: 15.5, bankAngle: -0.15, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // East Banked Speedway Turn & Tunnel #1
      { x: 215, y: 4.5, z: 115, width: 16.0, bankAngle: -0.32, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 230, y: 8.5, z: 35, width: 15.5, bankAngle: -0.22, surface: 'asphalt', isTunnel: true },
      { x: 230, y: 11.0, z: -45, width: 15.5, bankAngle: -0.15, surface: 'asphalt', isTunnel: true },
      { x: 215, y: 12.5, z: -125, width: 15.5, bankAngle: -0.28, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // North Straightaway with Jump #1 (Z = -180, moving -X from +150 to -150)
      { x: 150, y: 11.5, z: -180, width: 15.5, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: 85, y: 12.8, z: -180, width: 16.0, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: 20, y: 6.5, z: -180, width: 17.0, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: -55, y: 5.5, z: -180, width: 15.5, bankAngle: 0, surface: 'boost', kerbLeft: true, kerbRight: true },
      { x: -135, y: 6.0, z: -180, width: 15.5, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // North-West Mountain Tunnel #2
      { x: -205, y: 8.0, z: -145, width: 15.0, bankAngle: -0.26, surface: 'asphalt', isTunnel: true },
      { x: -225, y: 6.5, z: -75, width: 15.0, bankAngle: -0.22, surface: 'asphalt', isTunnel: true },

      // Deep Canyon Gorge Dip (dropping to y = -3.4m)
      { x: -175, y: -1.5, z: -20, width: 15.5, bankAngle: 0.24, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: -100, y: -3.4, z: -45, width: 16.0, bankAngle: 0, surface: 'dirt' },
      { x: -15, y: -3.2, z: -45, width: 16.0, bankAngle: 0, surface: 'dirt' },
      { x: 65, y: -1.0, z: -20, width: 15.5, bankAngle: 0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },
      { x: 80, y: 2.5, z: 45, width: 15.5, bankAngle: 0.28, surface: 'dirt', kerbLeft: true, kerbRight: true },

      // Infield Straightaway with Jump #2 (Z = 70, moving -X from +15 to -185)
      { x: 15, y: 2.8, z: 70, width: 15.5, bankAngle: 0, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -50, y: 4.2, z: 70, width: 16.0, bankAngle: 0, surface: 'jump_ramp', kerbLeft: true, kerbRight: true },
      { x: -115, y: 0.5, z: 70, width: 17.0, bankAngle: 0, surface: 'asphalt', kerbLeft: false, kerbRight: false },
      { x: -185, y: 0.5, z: 70, width: 15.5, bankAngle: -0.18, surface: 'asphalt', kerbLeft: true, kerbRight: true },

      // South-West Banked Bowl back to Start
      { x: -225, y: 1.0, z: 115, width: 16.5, bankAngle: -0.32, surface: 'asphalt', kerbLeft: true, kerbRight: true },
      { x: -200, y: 0.5, z: 152, width: 15.5, bankAngle: -0.22, surface: 'asphalt', kerbLeft: true, kerbRight: true },
    ],
    hazards: [
      { t: 0.14, lateralOffset: 0.35, type: 'water_puddle', radius: 3.6 },
      { t: 0.45, lateralOffset: -0.3, type: 'water_puddle', radius: 3.6 },
      { t: 0.65, lateralOffset: 0.25, type: 'mud_pit', radius: 4.0 },
      { t: 0.72, lateralOffset: -0.25, type: 'mud_pit', radius: 4.0 },
      { t: 0.90, lateralOffset: 0.3, type: 'water_puddle', radius: 3.5 },
    ],
    grandstands: [
      { x: -80, y: 0.5, z: 180, rotationY: Math.PI },
      { x: 0, y: 0.5, z: 180, rotationY: Math.PI },
      { x: 80, y: 0.5, z: 180, rotationY: Math.PI },
    ],
    mountains: [
      { x: 235, z: -5, radius: 75, height: 26 },
      { x: -225, z: -110, radius: 75, height: 25 },
      { x: -55, z: -120, radius: 58, height: 20 },
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
