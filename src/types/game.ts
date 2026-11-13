export type TrackId =
  | 'pinewood_gp'
  | 'pro_am_circuit'
  | 'ironman_baja'
  | 'alpine_pass'
  | 'thunder_valley';

export type WeatherType = 'clear' | 'rain' | 'snow';

export type CameraPreset = 'isometric_zoom' | 'high_overhead' | 'tight_action';

export type SurfaceType =
  | 'asphalt'
  | 'dirt'
  | 'ice'
  | 'jump_ramp'
  | 'boost'
  | 'grass'
  | 'mud'
  | 'rough_ground'
  | 'oil';

export type ControlType = 'gamepad' | 'keyboard_wasd' | 'keyboard_arrows' | 'ai';

export interface SplineControlNode {
  x: number;
  y: number;
  z: number;
  width: number;
  /** Bank angle in radians: negative tilts road inward for left turns, positive tilts inward for right turns */
  bankAngle: number;
  surface: SurfaceType;
  kerbLeft?: boolean;
  kerbRight?: boolean;
  isTunnel?: boolean;
}

export interface TrackHazardDef {
  /** Normalized spline t in [0, 1) */
  t: number;
  /** Lateral offset from centerline (-1 to 1 of half-width) */
  lateralOffset: number;
  type: 'mud_pit' | 'water_puddle' | 'rough_ground';
  radius: number;
}

export interface GrandstandDef {
  x: number;
  y: number;
  z: number;
  rotationY: number;
}

export interface MountainPeakDef {
  x: number;
  z: number;
  radius: number;
  height: number;
}

export type TrackBiome =
  | 'forest_valley'
  | 'neon_stadium'
  | 'desert_canyon'
  | 'alpine_glacier'
  | 'industrial_gorge';

export type SceneryPropType =
  | 'stadium'
  | 'farm'
  | 'windmill'
  | 'modern_turbine'
  | 'pit_building'
  | 'alpine_chalet'
  | 'industrial_plant';

export interface SceneryPropDef {
  type: SceneryPropType;
  x: number;
  z: number;
  rotationY: number;
  scale?: number;
}

export interface TrackDefinition {
  id: TrackId;
  name: string;
  subtitle: string;
  inspiration: string;
  biome: TrackBiome;
  lengthMeters: number;
  defaultWeather: WeatherType;
  difficulty: 'Circuit' | 'Pro-Am' | 'Ironman' | 'Alpine' | 'Endurance';
  description: string;
  nodes: SplineControlNode[];
  hazards: TrackHazardDef[];
  grandstands: GrandstandDef[];
  mountains: MountainPeakDef[];
  sceneryProps: SceneryPropDef[];
  scenerySeed: number;
}

export interface PlayerSlotConfig {
  slotIndex: number;
  name: string;
  colorHex: string;
  colorName: string;
  controlType: ControlType;
  gamepadIndex: number | null;
}

export interface VehicleTelemetry {
  slotIndex: number;
  name: string;
  colorHex: string;
  controlType: ControlType;
  gamepadIndex: number | null;
  positionRank: number;
  lap: number;
  maxLaps: number;
  speedKmh: number;
  gunAmmo: number;
  maxGunAmmo: number;
  oilAmmo: number;
  maxOilAmmo: number;
  nitroAmmo: number;
  maxNitroAmmo: number;
  isAirborne: boolean;
  isInTunnel: boolean;
  isSlipstreaming: boolean;
  isLastPlaceBoost: boolean;
  isLeaderPenalty: boolean;
  isCollisionSlowed: boolean;
  surface: SurfaceType;
  bankAngleDeg: number;
  isDrifting: boolean;
  driftAngleDeg: number;
  isSpinningOut: boolean;
  isDamaged: boolean;
  isBoosting: boolean;
  bestLapMs: number | null;
  lastLapMs: number | null;
  totalHits: number;
  spinOutsCaused: number;
  finished: boolean;
  finishTimeMs: number | null;
}

export interface ConnectedGamepadInfo {
  index: number;
  id: string;
  steer: number;
  throttle: number;
  brake: number;
  fireButton: boolean;
  oilButton: boolean;
  nitroButton: boolean;
  aButton: boolean;
}
