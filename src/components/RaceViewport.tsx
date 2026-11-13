import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CameraPreset,
  ConnectedGamepadInfo,
  PlayerSlotConfig,
  SurfaceType,
  TrackId,
  VehicleTelemetry,
  WeatherType,
} from '../types/game';
import {
  BakedTrack,
  bakeTrack,
  queryTrackSurface,
  TRACK_DEFINITIONS,
  TrackSurfaceQueryResult,
} from '../game/tracks';
import {
  buildTrackDiorama,
  BuiltTrackScene,
  createCompositeRaceCar,
  createContactShadowTexture,
  createRoadCanvasTexture,
  VehicleRig,
} from '../game/models';
import { InputManager } from '../game/inputManager';
import { soundEngine } from '../audio/soundEngine';

interface RaceViewportProps {
  trackId: TrackId;
  weather: WeatherType;
  cameraPreset: CameraPreset;
  maxLaps: number;
  playerSlots: PlayerSlotConfig[];
  raceState: 'lobby' | 'countdown' | 'racing' | 'paused' | 'finished';
  raceRestartToken: number;
  onTelemetryUpdate: (
    telemetry: VehicleTelemetry[],
    gamepads: ConnectedGamepadInfo[],
    countdownValue: number | null
  ) => void;
  onRaceFinished: (finalStandings: VehicleTelemetry[]) => void;
  onCountdownComplete: () => void;
}

interface SimVehicle {
  slotIndex: number;
  config: PlayerSlotConfig;
  rig: VehicleRig;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  vy: number;
  heading: number;
  angularVel: number;
  driftAngle: number;
  driftDuration: number;
  isDrifting: boolean;
  skidCooldown: number;
  steerAngle: number;
  wheelSpinAngle: number;
  pitch: number;
  roll: number;
  isAirborne: boolean;
  isInTunnel: boolean;
  isSlipstreaming: boolean;
  slipstreamCharge: number;
  isLastPlaceBoost: boolean;
  isLeaderPenalty: boolean;
  currentRank: number;
  groundY: number;
  surface: SurfaceType;
  bankAngle: number;
  closestSampleIdx: number;
  splineT: number;
  prevSplineT: number;
  lap: number;
  passedHalfway: boolean;
  lapStartTimeMs: number;
  bestLapMs: number | null;
  lastLapMs: number | null;
  gunAmmo: number;
  maxGunAmmo: number;
  oilAmmo: number;
  maxOilAmmo: number;
  nitroAmmo: number;
  maxNitroAmmo: number;
  fireCooldown: number;
  aiWeaponCooldown: number;
  aiNitroCooldown: number;
  muzzleTimer: number;
  spinOutTimer: number;
  damageSlowTimer: number;
  collisionSlowTimer: number;
  collisionImpactCooldown: number;
  boostTimer: number;
  totalHits: number;
  spinOutsCaused: number;
  finished: boolean;
  finishTimeMs: number | null;
  aiTargetOffset: number;
  aiDynamicOffset: number;
  aiPaceBase: number;
}

interface ActiveProjectile {
  active: boolean;
  ownerSlot: number;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
}

interface ActiveOilSlick {
  active: boolean;
  ownerSlot: number;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  radius: number;
  immuneTimer: number;
  life: number;
}

interface BurstParticle {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
  color: THREE.Color;
}

// Pre-allocated math helpers at module scope to guarantee Zero GC inside tick()
const _queryResult: TrackSurfaceQueryResult = {
  closestIndex: 0,
  t: 0,
  groundY: 0,
  lateralDist: 0,
  normalizedLateral: 0,
  surface: 'asphalt',
  bankAngle: 0,
  tangentX: 0,
  tangentY: 0,
  tangentZ: 1,
  upX: 0,
  upY: 1,
  upZ: 0,
  onRoad: true,
  isTunnel: false,
};

const _forwardVec = new THREE.Vector3();
const _xBasisVec = new THREE.Vector3();
const _rightVec = new THREE.Vector3();
const _upVec = new THREE.Vector3(0, 1, 0);
const _slopeNormal = new THREE.Vector3();
const _rotMatrix = new THREE.Matrix4();
const _targetQuat = new THREE.Quaternion();
const _camTarget = new THREE.Vector3();
const _camDesiredPos = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();

const MAX_GUN_SHOTS_PER_LAP = 5;
const MAX_OIL_SLICKS_PER_LAP = 2;
const MAX_NITRO_PER_LAP = 3;

export const RaceViewport: React.FC<RaceViewportProps> = ({
  trackId,
  weather,
  cameraPreset,
  maxLaps,
  playerSlots,
  raceState,
  raceRestartToken,
  onTelemetryUpdate,
  onRaceFinished,
  onCountdownComplete,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  const propsRef = useRef({
    trackId,
    weather,
    cameraPreset,
    maxLaps,
    playerSlots,
    raceState,
    raceRestartToken,
    onTelemetryUpdate,
    onRaceFinished,
    onCountdownComplete,
  });

  useEffect(() => {
    propsRef.current = {
      trackId,
      weather,
      cameraPreset,
      maxLaps,
      playerSlots,
      raceState,
      raceRestartToken,
      onTelemetryUpdate,
      onRaceFinished,
      onCountdownComplete,
    };
  });

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software WebGL Guard (Three.js Skill Directive)
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    // Disable gl.validateProgram() during shader setup to prevent WebGL2 sampler-unit validation false positives (Error 1282)
    renderer.debug.checkShaderErrors = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // 2. Studio Environment Map via RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRenderTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRenderTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      1.0,
      950
    );
    camera.position.set(0, 62, 62);
    camera.lookAt(0, 0, 0);

    // 3. Balanced 3-Point Studio & Outdoor Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x3f6212, 0.75);
    hemiLight.position.set(0, 120, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    sunLight.position.set(55, 95, 48);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    const shadowBounds = 95;
    sunLight.shadow.camera.left = -shadowBounds;
    sunLight.shadow.camera.right = shadowBounds;
    sunLight.shadow.camera.top = shadowBounds;
    sunLight.shadow.camera.bottom = -shadowBounds;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 260;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);
    scene.add(sunLight.target);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.65);
    rimLight.position.set(-80, 65, -75);
    scene.add(rimLight);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const roadTexture = createRoadCanvasTexture(maxAnisotropy);
    const contactShadowTexture = createContactShadowTexture();
    const inputManager = new InputManager();

    // 4. Weather Particle System (Rain / Snow)
    const weatherCount = 750;
    const weatherGeo = new THREE.BufferGeometry();
    const weatherPositions = new Float32Array(weatherCount * 3);
    for (let i = 0; i < weatherCount; i++) {
      weatherPositions[i * 3] = (Math.random() - 0.5) * 160;
      weatherPositions[i * 3 + 1] = Math.random() * 48;
      weatherPositions[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    weatherGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(weatherPositions, 3)
    );
    const weatherMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.55,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const weatherPoints = new THREE.Points(weatherGeo, weatherMat);
    scene.add(weatherPoints);

    // 5. Object Pools for Forward Projectiles, Oil Slicks & Particle Bursts
    const projectilePool: ActiveProjectile[] = [];
    const projGeo = new THREE.SphereGeometry(0.28, 8, 8);
    projGeo.scale(0.85, 0.85, 2.6);
    const projMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    for (let i = 0; i < 40; i++) {
      const m = new THREE.Mesh(projGeo, projMat);
      m.visible = false;
      scene.add(m);
      projectilePool.push({
        active: false,
        ownerSlot: -1,
        mesh: m,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
      });
    }

    const oilPool: ActiveOilSlick[] = [];
    const oilGeo = new THREE.CircleGeometry(2.35, 18);
    oilGeo.rotateX(-Math.PI / 2);
    const oilMat = new THREE.MeshStandardMaterial({
      color: 0x090a0f,
      roughness: 0.06,
      metalness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(oilGeo, oilMat);
      m.visible = false;
      scene.add(m);
      oilPool.push({
        active: false,
        ownerSlot: -1,
        mesh: m,
        position: new THREE.Vector3(),
        radius: 2.35,
        immuneTimer: 0,
        life: 0,
      });
    }

    // Instanced Burst Particles (Sparks, Tire Smoke, Dirt Plumes, Slipstream Draft)
    const maxParticles = 260;
    const partGeo = new THREE.DodecahedronGeometry(0.32, 0);
    const partMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particleInstanced = new THREE.InstancedMesh(
      partGeo,
      partMat,
      maxParticles
    );
    particleInstanced.frustumCulled = false;
    scene.add(particleInstanced);

    const burstPool: BurstParticle[] = [];
    for (let i = 0; i < maxParticles; i++) {
      burstPool.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0.5,
        scale: 1,
        color: new THREE.Color(0xffffff),
      });
      _dummyObj.position.set(0, -100, 0);
      _dummyObj.scale.setScalar(0.001);
      _dummyObj.updateMatrix();
      particleInstanced.setMatrixAt(i, _dummyObj.matrix);
      particleInstanced.setColorAt(i, new THREE.Color(0xffffff));
    }
    particleInstanced.instanceMatrix.needsUpdate = true;
    if (particleInstanced.instanceColor) {
      particleInstanced.instanceColor.needsUpdate = true;
    }

    // Instanced Twin Rear-Tire Skid Marks Ring Buffer (Rubber on Tarmac / Carved Ruts on Dirt)
    const maxSkidMarks = 900;
    const skidGeo = new THREE.PlaneGeometry(0.46, 1.3);
    skidGeo.rotateX(-Math.PI / 2);
    const skidMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const skidInstanced = new THREE.InstancedMesh(
      skidGeo,
      skidMat,
      maxSkidMarks
    );
    skidInstanced.frustumCulled = false;
    scene.add(skidInstanced);

    let skidCursor = 0;
    const _skidColor = new THREE.Color();
    const clearSkidMarks = () => {
      skidCursor = 0;
      for (let i = 0; i < maxSkidMarks; i++) {
        _dummyObj.position.set(0, -100, 0);
        _dummyObj.scale.setScalar(0.001);
        _dummyObj.updateMatrix();
        skidInstanced.setMatrixAt(i, _dummyObj.matrix);
        skidInstanced.setColorAt(i, _skidColor.setHex(0x0f172a));
      }
      skidInstanced.instanceMatrix.needsUpdate = true;
      if (skidInstanced.instanceColor) {
        skidInstanced.instanceColor.needsUpdate = true;
      }
    };
    clearSkidMarks();

    const stampTireSkidMark = (
      wx: number,
      wy: number,
      wz: number,
      upX: number,
      upY: number,
      upZ: number,
      velAngle: number,
      hexColor: number,
      widthScale: number = 1.0
    ) => {
      _slopeNormal.set(upX, upY, upZ).normalize();
      _forwardVec.set(Math.sin(velAngle), 0, Math.cos(velAngle)).normalize();
      _xBasisVec.crossVectors(_slopeNormal, _forwardVec).normalize();
      _forwardVec.crossVectors(_xBasisVec, _slopeNormal).normalize();
      _rotMatrix.makeBasis(_xBasisVec, _slopeNormal, _forwardVec);
      _dummyObj.quaternion.setFromRotationMatrix(_rotMatrix);
      _dummyObj.position.set(wx, wy + 0.05, wz);
      _dummyObj.scale.set(widthScale, 1, 1);
      _dummyObj.updateMatrix();
      skidInstanced.setMatrixAt(skidCursor, _dummyObj.matrix);
      skidInstanced.setColorAt(skidCursor, _skidColor.setHex(hexColor));
      skidCursor = (skidCursor + 1) % maxSkidMarks;
      skidInstanced.instanceMatrix.needsUpdate = true;
      if (skidInstanced.instanceColor) {
        skidInstanced.instanceColor.needsUpdate = true;
      }
    };

    const spawnParticleBurst = (
      x: number,
      y: number,
      z: number,
      count: number,
      hexColor: number,
      speedSpread: number,
      scale: number = 1.0
    ) => {
      let spawned = 0;
      for (let i = 0; i < maxParticles && spawned < count; i++) {
        const p = burstPool[i];
        if (!p.active) {
          p.active = true;
          p.position.set(x, y, z);
          p.velocity.set(
            (Math.random() - 0.5) * speedSpread,
            1.5 + Math.random() * speedSpread * 0.65,
            (Math.random() - 0.5) * speedSpread
          );
          p.life = 0;
          p.maxLife = 0.28 + Math.random() * 0.25;
          p.scale = scale;
          p.color.setHex(hexColor);
          spawned++;
        }
      }
    };

    const applyVehicleOrientation = (
      v: SimVehicle,
      upX: number,
      upY: number,
      upZ: number,
      slerpAlpha: number
    ) => {
      _slopeNormal.set(upX, upY, upZ).normalize();
      if (v.isAirborne) {
        _slopeNormal.set(0, 1, 0);
      }
      _forwardVec.set(Math.sin(v.heading), 0, Math.cos(v.heading)).normalize();
      _xBasisVec.crossVectors(_slopeNormal, _forwardVec).normalize();
      _forwardVec.crossVectors(_xBasisVec, _slopeNormal).normalize();

      _rotMatrix.makeBasis(_xBasisVec, _slopeNormal, _forwardVec);
      _targetQuat.setFromRotationMatrix(_rotMatrix);
      if (slerpAlpha >= 1) {
        v.rig.root.quaternion.copy(_targetQuat);
      } else {
        v.rig.root.quaternion.slerp(_targetQuat, slerpAlpha);
      }
      v.rig.root.position.copy(v.position);
    };

    // 6. Track & Vehicles State Setup
    let currentTrackId: TrackId | null = null;
    let currentWeather: WeatherType | null = null;
    let currentRestartToken = -1;
    let bakedTrack: BakedTrack = bakeTrack(
      TRACK_DEFINITIONS[propsRef.current.trackId]
    );
    let builtDiorama: BuiltTrackScene | null = null;
    let vehicles: SimVehicle[] = [];

    const applyAtmosphere = (w: WeatherType) => {
      const biome = bakedTrack.definition.biome;
      if (w === 'rain') {
        const bg = new THREE.Color(0x1e293b);
        scene.background = bg;
        scene.fog = new THREE.FogExp2(0x1e293b, 0.0022);
        sunLight.intensity = 1.35;
        sunLight.color.setHex(0xcbd5e1);
        hemiLight.intensity = 0.65;
        weatherPoints.visible = true;
        weatherMat.color.setHex(0x93c5fd);
        weatherMat.size = 0.48;
      } else if (w === 'snow') {
        const bg = new THREE.Color(0x334155);
        scene.background = bg;
        scene.fog = new THREE.FogExp2(0x334155, 0.0025);
        sunLight.intensity = 1.65;
        sunLight.color.setHex(0xe2e8f0);
        hemiLight.intensity = 0.85;
        weatherPoints.visible = true;
        weatherMat.color.setHex(0xffffff);
        weatherMat.size = 0.72;
      } else {
        const bgHex =
          biome === 'desert_canyon'
            ? 0x2a1810
            : biome === 'alpine_glacier'
              ? 0x1e293b
              : biome === 'neon_stadium'
                ? 0x091526
                : biome === 'industrial_gorge'
                  ? 0x18181b
                  : 0x0f172a;
        const bg = new THREE.Color(bgHex);
        scene.background = bg;
        scene.fog = new THREE.FogExp2(bgHex, 0.0016);
        sunLight.intensity = 2.25;
        sunLight.color.setHex(
          biome === 'desert_canyon' ? 0xffedd5 : 0xfffbeb
        );
        hemiLight.intensity = 0.8;
        weatherPoints.visible = false;
      }
    };

    const rebuildWorldAndCars = () => {
      const { trackId: tId, weather: w, playerSlots: slots } = propsRef.current;

      if (builtDiorama) {
        scene.remove(builtDiorama.group);
      }
      for (const v of vehicles) {
        scene.remove(v.rig.root);
      }
      for (const p of projectilePool) {
        p.active = false;
        p.mesh.visible = false;
      }
      for (const o of oilPool) {
        o.active = false;
        o.mesh.visible = false;
      }
      clearSkidMarks();

      bakedTrack = bakeTrack(TRACK_DEFINITIONS[tId]);
      builtDiorama = buildTrackDiorama(bakedTrack, roadTexture, w);
      scene.add(builtDiorama.group);
      applyAtmosphere(w);

      vehicles = [];
      const totalSamples = bakedTrack.samples.length;
      const nowMs = performance.now();

      // Randomize starting grid positions (P1..P4) on every start
      const gridOrder = slots.map((_, idx) => idx);
      for (let g = gridOrder.length - 1; g > 0; g--) {
        const randIdx = Math.floor(Math.random() * (g + 1));
        const tmp = gridOrder[g];
        gridOrder[g] = gridOrder[randIdx];
        gridOrder[randIdx] = tmp;
      }

      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        const rig = createCompositeRaceCar(slot.colorHex, contactShadowTexture);
        scene.add(rig.root);

        const gridSpot = gridOrder[i];
        const col = gridSpot % 2 === 0 ? -1 : 1;
        const startSampleIdx = (totalSamples - 6 - gridSpot * 4) % totalSamples;
        const s = bakedTrack.samples[startSampleIdx];
        const lateral = col * 3.1;

        const startPos = s.position.clone().addScaledVector(s.right, lateral);
        startPos.y = s.position.y + lateral * s.right.y;

        const heading = Math.atan2(s.tangent.x, s.tangent.z);
        const initialOffset = (gridSpot - 1.5) * 0.28;

        const simVeh: SimVehicle = {
          slotIndex: slot.slotIndex,
          config: slot,
          rig,
          position: startPos,
          velocity: new THREE.Vector3(),
          vy: 0,
          heading,
          angularVel: 0,
          driftAngle: 0,
          driftDuration: 0,
          isDrifting: false,
          skidCooldown: 0,
          steerAngle: 0,
          wheelSpinAngle: 0,
          pitch: 0,
          roll: 0,
          isAirborne: false,
          isInTunnel: false,
          isSlipstreaming: false,
          slipstreamCharge: 0,
          isLastPlaceBoost: false,
          isLeaderPenalty: false,
          currentRank: gridSpot + 1,
          groundY: startPos.y,
          surface: s.surface,
          bankAngle: s.bankAngle,
          closestSampleIdx: startSampleIdx,
          splineT: s.t,
          prevSplineT: s.t,
          lap: 1,
          passedHalfway: false,
          lapStartTimeMs: nowMs,
          bestLapMs: null,
          lastLapMs: null,
          gunAmmo: MAX_GUN_SHOTS_PER_LAP,
          maxGunAmmo: MAX_GUN_SHOTS_PER_LAP,
          oilAmmo: MAX_OIL_SLICKS_PER_LAP,
          maxOilAmmo: MAX_OIL_SLICKS_PER_LAP,
          nitroAmmo: MAX_NITRO_PER_LAP,
          maxNitroAmmo: MAX_NITRO_PER_LAP,
          fireCooldown: 0,
          // Stagger initial AI cooldowns so AI never uses weapons at the start line
          aiWeaponCooldown: 8.0 + i * 2.5,
          aiNitroCooldown: 6.5 + i * 2.0,
          muzzleTimer: 0,
          spinOutTimer: 0,
          damageSlowTimer: 0,
          collisionSlowTimer: 0,
          collisionImpactCooldown: 0,
          boostTimer: 0,
          totalHits: 0,
          spinOutsCaused: 0,
          finished: false,
          finishTimeMs: null,
          aiTargetOffset: initialOffset,
          aiDynamicOffset: initialOffset,
          aiPaceBase: 0.975 + ((i * 7) % 3) * 0.024,
        };

        applyVehicleOrientation(simVeh, s.up.x, s.up.y, s.up.z, 1.0);
        vehicles.push(simVeh);
      }

      currentTrackId = tId;
      currentWeather = w;
      currentRestartToken = propsRef.current.raceRestartToken;
    };

    rebuildWorldAndCars();

    let countdownTimer = 2.4;
    let lastCountdownInt = 4;
    const initialSample = bakedTrack.samples[0];
    let smoothedCamTarget = initialSample.position.clone();
    let smoothedCamDist = 56;
    let lobbyOrbitAngle = 0.4;
    let raceClockStartMs = performance.now();
    let telemetryAccumulator = 0;

    // 7. Software WebGL Fence Pacing + Strict 60 FPS Hardware Cap
    let frameId = 0;
    let isDisposed = false;
    const clock = new THREE.Clock();
    const TARGET_FPS = 60;
    const TARGET_FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
    const FRAME_GATE_THRESHOLD_MS = TARGET_FRAME_INTERVAL_MS - 0.5;
    let lastFrameTimeMs = performance.now();

    function afterDraw(cb: () => void) {
      if (isDisposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync
        ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
        : null;
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const nowMs = performance.now();
      if (!isSoftwareGl) {
        const elapsedFrameMs = nowMs - lastFrameTimeMs;
        if (elapsedFrameMs < FRAME_GATE_THRESHOLD_MS) {
          frameId = requestAnimationFrame(tick);
          return;
        }
        lastFrameTimeMs = nowMs - (elapsedFrameMs % TARGET_FRAME_INTERVAL_MS);
      }

      const rawDelta = clock.getDelta();
      const dt = Math.min(rawDelta, 0.05);

      const {
        trackId: propTrackId,
        weather: propWeather,
        cameraPreset: propCamPreset,
        maxLaps: propMaxLaps,
        playerSlots: propSlots,
        raceState: propRaceState,
        raceRestartToken: propRestartToken,
        onTelemetryUpdate: cbTelemetry,
        onRaceFinished: cbFinished,
        onCountdownComplete: cbCountdownDone,
      } = propsRef.current;

      for (let i = 0; i < vehicles.length && i < propSlots.length; i++) {
        vehicles[i].config = propSlots[i];
      }

      const hasSeparateArrowPlayer = propSlots.some(
        (s, idx) => idx > 0 && s.controlType === 'keyboard_arrows'
      );

      if (
        propTrackId !== currentTrackId ||
        propRestartToken !== currentRestartToken
      ) {
        rebuildWorldAndCars();
        smoothedCamTarget.copy(bakedTrack.samples[0].position);
        countdownTimer = 2.4;
        lastCountdownInt = 4;
        raceClockStartMs = nowMs;
      } else if (propWeather !== currentWeather) {
        currentWeather = propWeather;
        rebuildWorldAndCars();
      }

      // Update Gantry Countdown Lights
      let activeCountdownNum: number | null = null;
      if (propRaceState === 'countdown') {
        countdownTimer -= dt;
        const cInt = Math.ceil(countdownTimer);
        activeCountdownNum = Math.max(0, cInt);

        if (cInt !== lastCountdownInt && cInt >= 0 && cInt <= 3) {
          lastCountdownInt = cInt;
          soundEngine.playCountdownTone(cInt === 0);
          soundEngine.startTrackMusic(propTrackId);
        }

        if (builtDiorama) {
          for (let li = 0; li < 3; li++) {
            const mat = builtDiorama.gantryLights[li]
              .material as THREE.MeshStandardMaterial;
            if (countdownTimer <= 0.15) {
              mat.color.setHex(0x22c55e);
              mat.emissive.setHex(0x22c55e);
            } else if (3 - li >= cInt) {
              mat.color.setHex(0xef4444);
              mat.emissive.setHex(0xef4444);
            } else {
              mat.color.setHex(0x334155);
              mat.emissive.setHex(0x000000);
            }
          }
        }

        if (countdownTimer <= 0) {
          const startNow = performance.now();
          raceClockStartMs = startNow;
          for (const v of vehicles) {
            v.lapStartTimeMs = startNow;
          }
          soundEngine.startEngineLoop();
          soundEngine.startTrackMusic(propTrackId);
          cbCountdownDone();
        }
      } else if (propRaceState === 'racing' && builtDiorama) {
        for (let li = 0; li < 3; li++) {
          const mat = builtDiorama.gantryLights[li]
            .material as THREE.MeshStandardMaterial;
          mat.color.setHex(0x22c55e);
          mat.emissive.setHex(0x22c55e);
        }
      }

      const weatherGripMult =
        propWeather === 'snow' ? 0.58 : propWeather === 'rain' ? 0.76 : 1.0;

      // Animate Weather Particles
      if (weatherPoints.visible) {
        const posArr = weatherGeo.attributes.position.array as Float32Array;
        const fallSpeed = propWeather === 'rain' ? 42 : 14;
        const windDrift = propWeather === 'rain' ? 6 : 8;
        for (let i = 0; i < weatherCount; i++) {
          posArr[i * 3] += windDrift * dt;
          posArr[i * 3 + 1] -= fallSpeed * dt;
          if (posArr[i * 3 + 1] < smoothedCamTarget.y - 5) {
            posArr[i * 3 + 1] = smoothedCamTarget.y + 46;
            posArr[i * 3] = smoothedCamTarget.x + (Math.random() - 0.5) * 140;
            posArr[i * 3 + 2] =
              smoothedCamTarget.z + (Math.random() - 0.5) * 140;
          }
        }
        weatherGeo.attributes.position.needsUpdate = true;
      }

      // Press 'R' to reset Player 1 back onto track centerline
      if (inputManager.isKeyJustPressed('KeyR') && vehicles.length > 0) {
        const v0 = vehicles[0];
        const s = bakedTrack.samples[v0.closestSampleIdx];
        v0.position.copy(s.position);
        v0.velocity.set(0, 0, 0);
        v0.heading = Math.atan2(s.tangent.x, s.tangent.z);
        v0.spinOutTimer = 0;
        v0.isAirborne = false;
      }

      // Compute Live Standings Ranks Every Frame (so Last Place gets +20% Catch-Up Boost)
      const raceElapsedSec = (nowMs - raceClockStartMs) / 1000;
      const liveSorted = [...vehicles].sort((a, b) => {
        if (a.finished && b.finished) {
          return (a.finishTimeMs ?? 0) - (b.finishTimeMs ?? 0);
        }
        if (a.finished) return -1;
        if (b.finished) return 1;
        const progA =
          a.lap * 10 +
          (a.passedHalfway && a.splineT < 0.2 ? a.splineT + 1 : a.splineT);
        const progB =
          b.lap * 10 +
          (b.passedHalfway && b.splineT < 0.2 ? b.splineT + 1 : b.splineT);
        return progB - progA;
      });
      for (let r = 0; r < liveSorted.length; r++) {
        liveSorted[r].currentRank = r + 1;
      }

      const isAttractMode = propRaceState === 'lobby';
      const canDrive = propRaceState === 'racing';
      const nSamples = bakedTrack.samples.length;

      for (let vi = 0; vi < vehicles.length; vi++) {
        const v = vehicles[vi];

        if (v.fireCooldown > 0) v.fireCooldown -= dt;
        if (v.aiWeaponCooldown > 0) v.aiWeaponCooldown -= dt;
        if (v.aiNitroCooldown > 0) v.aiNitroCooldown -= dt;
        if (v.muzzleTimer > 0) {
          v.muzzleTimer -= dt;
          if (v.muzzleTimer <= 0) {
            v.rig.muzzleFlashLeft.visible = false;
            v.rig.muzzleFlashRight.visible = false;
          }
        }
        if (v.spinOutTimer > 0) v.spinOutTimer -= dt;
        if (v.damageSlowTimer > 0) v.damageSlowTimer -= dt;
        if (v.collisionSlowTimer > 0) v.collisionSlowTimer -= dt;
        if (v.collisionImpactCooldown > 0) v.collisionImpactCooldown -= dt;
        if (v.boostTimer > 0) v.boostTimer -= dt;

        v.rig.boostFlameLeft.visible = v.boostTimer > 0;
        v.rig.boostFlameRight.visible = v.boostTimer > 0;

        // Competitive Pack Balancing (after 4.0s grid launch):
        // - Front car (1st place) gets a 5% speed penalty (0.95x)
        // - Last place car (4th place) gets a 10% speed boost (1.10x)
        v.isLeaderPenalty =
          canDrive &&
          !v.finished &&
          raceElapsedSec > 4.0 &&
          v.currentRank === 1;

        v.isLastPlaceBoost =
          canDrive &&
          !v.finished &&
          raceElapsedSec > 4.0 &&
          v.currentRank === vehicles.length;

        // Check Slipstream Drafting behind any rival car ahead
        let draftingTargetFound = false;
        const curFwdX = Math.sin(v.heading);
        const curFwdZ = Math.cos(v.heading);
        const curRightX = -Math.cos(v.heading);
        const curRightZ = Math.sin(v.heading);
        const curSpeed = v.velocity.length();

        if (canDrive && !v.finished && curSpeed > 10.0 && !v.isAirborne) {
          for (let r = 0; r < vehicles.length; r++) {
            if (r === vi) continue;
            const lead = vehicles[r];
            const dx = lead.position.x - v.position.x;
            const dz = lead.position.z - v.position.z;
            const distSq = dx * dx + dz * dz;
            // Drafting zone: 4m to 28m directly behind a rival moving in the same direction
            if (distSq > 16 && distSq < 784) {
              const dist = Math.sqrt(distSq);
              const alignDot = (dx * curFwdX + dz * curFwdZ) / dist;
              const headingAlign = Math.cos(lead.heading - v.heading);
              if (alignDot > 0.91 && headingAlign > 0.85) {
                draftingTargetFound = true;
                break;
              }
            }
          }
        }

        if (draftingTargetFound) {
          v.slipstreamCharge = Math.min(1.0, v.slipstreamCharge + dt * 1.8);
        } else {
          v.slipstreamCharge = Math.max(0.0, v.slipstreamCharge - dt * 1.5);
        }
        v.isSlipstreaming = v.slipstreamCharge > 0.25;

        // Sample Input (Human Gamepad / Keyboard vs AI Driver, or Attract Mode on Title Screen)
        let steerInput = 0;
        let throttleInput = 0;
        let brakeInput = 0;
        let wantFire = false;
        let wantOil = false;
        let wantNitro = false;

        if ((canDrive || isAttractMode) && !v.finished) {
          if (v.config.controlType === 'ai' || isAttractMode) {
            // Active AI Overtaking & Anti-Bunching Lane Selection:
            // Scan nearby cars within 18m ahead/beside and steer to the open side of the road to pass cleanly
            let desiredLaneOffset =
              v.aiTargetOffset +
              Math.sin(raceElapsedSec * 0.45 + vi * 1.9) * 0.18;
            let closeCarAhead = false;

            for (let r = 0; r < vehicles.length; r++) {
              if (r === vi) continue;
              const other = vehicles[r];
              const odx = other.position.x - v.position.x;
              const odz = other.position.z - v.position.z;
              const distSq = odx * odx + odz * odz;
              if (distSq > 0.1 && distSq < 324) {
                const fwdProj = odx * curFwdX + odz * curFwdZ;
                const latProj = odx * curRightX + odz * curRightZ;
                // Rival is ahead or side-by-side within 18m
                if (fwdProj > -2.5 && fwdProj < 17.5 && Math.abs(latProj) < 4.2) {
                  // Steer away from rival's lateral position to overtake cleanly without colliding
                  const evadeDir = latProj >= 0 ? -1 : 1;
                  desiredLaneOffset = THREE.MathUtils.clamp(
                    desiredLaneOffset + evadeDir * 0.58,
                    -0.68,
                    0.68
                  );
                  if (fwdProj > 0 && fwdProj < 5.2 && Math.abs(latProj) < 2.2) {
                    closeCarAhead = true;
                  }
                }
              }
            }

            v.aiDynamicOffset = THREE.MathUtils.damp(
              v.aiDynamicOffset,
              desiredLaneOffset,
              4.5,
              dt
            );

            // AI Lookahead Racing Line
            const lookAheadSteps = 20 + (vi % 3) * 3;
            const lookAheadIdx = (v.closestSampleIdx + lookAheadSteps) % nSamples;
            const targetSample = bakedTrack.samples[lookAheadIdx];
            const aimPos = _forwardVec
              .copy(targetSample.position)
              .addScaledVector(
                targetSample.right,
                v.aiDynamicOffset * targetSample.width * 0.42
              );

            const dx = aimPos.x - v.position.x;
            const dz = aimPos.z - v.position.z;
            const desiredHeading = Math.atan2(dx, dz);
            // AI steers its actual travel trajectory vector toward the racing line while letting its chassis drift sideways
            const aiTravelHeading =
              curSpeed > 4.5
                ? Math.atan2(v.velocity.x, v.velocity.z)
                : v.heading;
            let angleDiff = desiredHeading - aiTravelHeading;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            steerInput = THREE.MathUtils.clamp(-angleDiff * 2.5, -1, 1);
            const sharpTurn = Math.abs(angleDiff) > 0.55;
            // Distinct rhythmic AI pace so AI cars don't clump at identical speeds
            const paceWave =
              v.aiPaceBase +
              Math.sin(raceElapsedSec * 0.52 + vi * 2.1) * 0.035;
            const rawThrottle = sharpTurn
              ? 0.74 * paceWave
              : closeCarAhead
                ? 0.82
                : 0.96 * paceWave;
            throttleInput = THREE.MathUtils.clamp(rawThrottle, 0.65, 1.0);
            brakeInput = Math.abs(angleDiff) > 1.1 ? 0.35 : 0;

            // AI Sector-Spaced Weapon & Nitro Pacing:
            // Never use weapons near the start line (splineT < 0.15 or splineT > 0.92 or first 8s of race).
            // Space the 3 Gun Shots, 2 Oil Slicks, and 3 Nitro Boosts across 3 track sectors per lap!
            const awayFromStartLine =
              raceElapsedSec > 8.0 && v.splineT >= 0.15 && v.splineT <= 0.92;

            // Minimum allowed remaining ammo for current track sector so AI spaces its 5 gunshots across the lap
            const minGunRemainingForSector =
              v.splineT < 0.35
                ? 3
                : v.splineT < 0.62
                  ? 2
                  : v.splineT < 0.80
                    ? 1
                    : 0;
            const minOilRemainingForSector = v.splineT < 0.52 ? 1 : 0;
            const minNitroRemainingForSector =
              v.splineT < 0.38 ? 2 : v.splineT < 0.68 ? 1 : 0;

            // AI Gun Fire check (spaced by sector + 7.5s personal cooldown)
            if (
              awayFromStartLine &&
              v.gunAmmo > minGunRemainingForSector &&
              v.fireCooldown <= 0 &&
              v.aiWeaponCooldown <= 0
            ) {
              for (let r = 0; r < vehicles.length; r++) {
                if (r === vi) continue;
                const rival = vehicles[r];
                const rdx = rival.position.x - v.position.x;
                const rdz = rival.position.z - v.position.z;
                const distSq = rdx * rdx + rdz * rdz;
                if (distSq > 36 && distSq < 800) {
                  const dot =
                    (rdx * curFwdX + rdz * curFwdZ) / Math.sqrt(distSq);
                  if (dot > 0.965) {
                    wantFire = true;
                    v.aiWeaponCooldown = 7.5 + Math.random() * 3.0;
                    break;
                  }
                }
              }
            }

            // AI Oil Slick check (spaced by sector + 7.5s personal cooldown)
            if (
              awayFromStartLine &&
              !wantFire &&
              v.oilAmmo > minOilRemainingForSector &&
              v.aiWeaponCooldown <= 0
            ) {
              for (let r = 0; r < vehicles.length; r++) {
                if (r === vi) continue;
                const rival = vehicles[r];
                const rdx = rival.position.x - v.position.x;
                const rdz = rival.position.z - v.position.z;
                const distSq = rdx * rdx + rdz * rdz;
                if (distSq > 16 && distSq < 190) {
                  const dot =
                    (rdx * curFwdX + rdz * curFwdZ) / Math.sqrt(distSq);
                  if (dot < -0.84) {
                    wantOil = true;
                    v.aiWeaponCooldown = 8.5 + Math.random() * 3.0;
                    break;
                  }
                }
              }
            }

            // AI Nitro Boost check (only on straightaways when spaced across sectors)
            if (
              awayFromStartLine &&
              v.nitroAmmo > minNitroRemainingForSector &&
              v.aiNitroCooldown <= 0 &&
              v.boostTimer <= 0 &&
              Math.abs(angleDiff) < 0.14
            ) {
              wantNitro = true;
              v.aiNitroCooldown = 7.0 + Math.random() * 3.0;
            }
          } else {
            const allowFallback = vi === 0 && !hasSeparateArrowPlayer;
            const ctrl = inputManager.sampleInput(
              v.config.controlType,
              v.config.gamepadIndex,
              allowFallback
            );
            steerInput = ctrl.steer;
            throttleInput = ctrl.throttle;
            brakeInput = ctrl.brake;
            wantFire = ctrl.fireGun;
            wantOil = ctrl.dropOil;
            wantNitro = ctrl.useNitro;
          }
        }

        // Query 3D Spline Surface under Vehicle
        queryTrackSurface(
          v.position.x,
          v.position.z,
          bakedTrack,
          _queryResult,
          v.closestSampleIdx
        );
        v.closestSampleIdx = _queryResult.closestIndex;
        v.groundY = _queryResult.groundY;
        v.surface = _queryResult.surface;
        v.bankAngle = _queryResult.bankAngle;
        v.isInTunnel = _queryResult.isTunnel;

        // Check Static Track Hazards (Rough Ground Rubble Patches, Mud Pits & Water Puddles)
        if (builtDiorama && !v.isAirborne) {
          for (const h of builtDiorama.staticHazards) {
            const hdx = v.position.x - h.worldPos.x;
            const hdz = v.position.z - h.worldPos.z;
            if (hdx * hdx + hdz * hdz < h.radius * h.radius) {
              v.surface =
                h.type === 'rough_ground'
                  ? 'rough_ground'
                  : h.type === 'mud_pit'
                    ? 'mud'
                    : 'ice';
              break;
            }
          }
        }

        // Check Track Boost Strip OR Player Nitro Activation (3 per lap)
        if (v.surface === 'boost' && !v.isAirborne) {
          if (v.boostTimer <= 0.1) {
            soundEngine.playBoost();
            inputManager.triggerRumble(v.config.gamepadIndex, 160, 0.5, 0.8);
          }
          v.boostTimer = 1.15;
        } else if (
          wantNitro &&
          v.nitroAmmo > 0 &&
          v.boostTimer <= 0.15 &&
          !v.isAirborne &&
          v.spinOutTimer <= 0
        ) {
          v.nitroAmmo--;
          v.boostTimer = 1.65;
          soundEngine.playBoost();
          inputManager.triggerRumble(v.config.gamepadIndex, 200, 0.65, 0.85);
          spawnParticleBurst(
            v.position.x - curFwdX * 1.6,
            v.position.y + 0.4,
            v.position.z - curFwdZ * 1.6,
            8,
            0x38bdf8,
            6.5,
            0.95
          );
        }

        // Surface Physics Parameters
        let surfaceGrip = 1.0;
        let surfaceMaxSpeedMult = 1.0;
        if (v.surface === 'dirt') {
          surfaceGrip = 0.78;
          surfaceMaxSpeedMult = 0.9;
        } else if (v.surface === 'ice') {
          surfaceGrip = 0.42;
          surfaceMaxSpeedMult = 0.94;
        } else if (v.surface === 'grass') {
          surfaceGrip = 0.7;
          surfaceMaxSpeedMult = 0.76;
        } else if (v.surface === 'mud') {
          surfaceGrip = 0.55;
          surfaceMaxSpeedMult = 0.6;
        } else if (v.surface === 'rough_ground') {
          surfaceGrip = 0.62;
          surfaceMaxSpeedMult = 0.56;
        }

        const totalLateralGrip = surfaceGrip * weatherGripMult;
        // Competitive Speed Multipliers:
        // - Front Car (1st Place): -5% speed penalty (0.95x)
        // - 3rd Place: +2.5% chaser pace (1.025x)
        // - Last Place (4th Place): +15% speed boost (1.15x)
        // - Car-to-Car Collision: -10% speed penalty for 4 seconds (0.90x)
        const baseMaxSpeed = 34.2;
        const slipstreamSpeedMult = 1.0 + 0.15 * v.slipstreamCharge;
        const rankSpeedMult = v.isLeaderPenalty
          ? 0.95
          : v.isLastPlaceBoost
            ? 1.15
            : canDrive && raceElapsedSec > 4.0 && v.currentRank === 3
              ? 1.025
              : 1.0;
        const collisionSlowMult = v.collisionSlowTimer > 0 ? 0.9 : 1.0;

        const effectiveMaxSpeed =
          baseMaxSpeed *
          surfaceMaxSpeedMult *
          slipstreamSpeedMult *
          rankSpeedMult *
          collisionSlowMult *
          (v.boostTimer > 0 ? 1.32 : 1.0) *
          (v.damageSlowTimer > 0 ? 0.58 : 1.0);

        // 1) SEGA RALLY / COLIN MCRAE 4WD DRIFT PHYSICS
        // v.heading is the physical 3D chassis angle, while velAngle is the car's actual travel trajectory.
        // In a corner at speed, steering pitches the chassis 33°–48° sideways relative to velAngle
        // via a 2nd-order pendulum weight-transfer model (Scandinavian flick), while 4WD thrust and
        // lateral tire bite carve velAngle smoothly around the corner apex!
        const wrapAngle = (a: number): number => {
          while (a > Math.PI) a -= Math.PI * 2;
          while (a < -Math.PI) a += Math.PI * 2;
          return a;
        };

        const prevSpeed = Math.hypot(v.velocity.x, v.velocity.z);
        const prevFwdX = Math.sin(v.heading);
        const prevFwdZ = Math.cos(v.heading);
        const prevFwdProj = v.velocity.x * prevFwdX + v.velocity.z * prevFwdZ;
        const isReversing = prevFwdProj < -0.8 && throttleInput < 0.05;

        let velAngle =
          prevSpeed > 1.2 && !isReversing
            ? Math.atan2(v.velocity.x, v.velocity.z)
            : v.heading;
        let currentSlip = v.driftAngle;

        if (v.skidCooldown > 0) v.skidCooldown -= dt;

        let driftExitBoost = 0;

        if (v.spinOutTimer > 0) {
          v.heading = wrapAngle(v.heading + 11.0 * dt);
          v.angularVel = 0;
          v.driftDuration = 0;
          v.isDrifting = true;
          v.driftAngle = 0;
          v.velocity.multiplyScalar(Math.max(0, 1 - 1.6 * dt));
          if (Math.random() < 0.45) {
            spawnParticleBurst(
              v.position.x,
              v.position.y + 0.2,
              v.position.z,
              1,
              0x94a3b8,
              3.5,
              0.9
            );
          }
        } else if (prevSpeed <= 5.5 || isReversing) {
          // Low-speed Ackermann steering (grid launch, tight recovery, reversing)
          const isMovingOrStarting =
            prevSpeed > 0.2 || throttleInput > 0.05 || brakeInput > 0.05;
          if (isMovingOrStarting && Math.abs(steerInput) > 0.001) {
            const lowSpeedFactor = THREE.MathUtils.clamp(
              Math.max(
                prevSpeed / 3.5,
                throttleInput * 0.75,
                brakeInput * 0.6
              ),
              0.45,
              1.0
            );
            const reverseSign = isReversing ? -1 : 1;
            const deltaH = -steerInput * 2.95 * lowSpeedFactor * reverseSign * dt;
            v.heading = wrapAngle(v.heading + deltaH);
          }
          currentSlip = THREE.MathUtils.damp(currentSlip, 0, 12, dt);
          v.angularVel = THREE.MathUtils.damp(v.angularVel, 0, 12, dt);
          velAngle = wrapAngle(v.heading - currentSlip);
          v.driftAngle = currentSlip;
          v.driftDuration = 0;
          v.isDrifting = false;
        } else {
          // High-Speed 4WD Rally Cornering & Power-Sliding (Sega Rally / Colin McRae Model)
          const isLooseSurface =
            v.surface === 'dirt' ||
            v.surface === 'grass' ||
            v.surface === 'rough_ground' ||
            v.surface === 'mud';
          const isIceOrSnow =
            v.surface === 'ice' || propWeather === 'snow';

          const baseMaxSlip = isIceOrSnow
            ? 0.86 // 49° on snow/ice
            : v.surface === 'mud'
              ? 0.80 // 46° on mud
              : isLooseSurface
                ? 0.76 // 43.5° on gravel/dirt stages
                : propWeather === 'rain'
                  ? 0.70 // 40° on wet tarmac
                  : 0.62; // 35.5° on dry tarmac

          const surfaceLoose = isIceOrSnow
            ? 1.38
            : isLooseSurface
              ? 1.25
              : propWeather === 'rain'
                ? 1.16
                : 1.08;

          // Tapping brake while steering at speed acts like a Colin McRae handbrake flick
          const handbrakeActive =
            !v.isAirborne && brakeInput > 0.1 && Math.abs(steerInput) > 0.18;
          const maxSlipAngle = handbrakeActive
            ? Math.min(0.95, baseMaxSlip + 0.16)
            : baseMaxSlip;

          const speedSlideRatio = THREE.MathUtils.clamp(
            (prevSpeed - 5.5) / 14.0,
            0.25,
            1.15
          );

          // Target sideways slip angle: steering Left (steerInput < 0) kicks nose Left (+currentSlip) and tail Right
          const targetSlip =
            Math.abs(steerInput) > 0.06
              ? -steerInput * maxSlipAngle * speedSlideRatio
              : 0;

          // 2nd-order underdamped rotational spring-damper for authentic pendulum weight transfer (Scandinavian flick)
          const slipStiffness = v.isAirborne
            ? 2.5
            : Math.abs(steerInput) > 0.06
              ? (handbrakeActive ? 28.0 : 21.5) * surfaceLoose
              : 16.5 * totalLateralGrip;
          const slipDamping = v.isAirborne ? 4.0 : 6.4;

          const slipAccel =
            (targetSlip - currentSlip) * slipStiffness -
            v.angularVel * slipDamping;
          v.angularVel += slipAccel * dt;
          currentSlip = THREE.MathUtils.clamp(
            currentSlip + v.angularVel * dt,
            -0.96,
            0.96
          );

          // Evolve travel trajectory (velAngle) around the corner:
          // Combines direct 4WD front-wheel turn-in (-steerInput) + lateral cornering bite from the sideways chassis (currentSlip)
          const airSteerMult = v.isAirborne ? 0.22 : 1.0;
          const gripTurnFactor = Math.max(0.68, totalLateralGrip);
          const handbrakePivotBoost = handbrakeActive ? 1.18 : 1.0;

          const directTurnRate =
            -steerInput * 1.95 * gripTurnFactor * handbrakePivotBoost;
          const driftCarveRate = currentSlip * 1.85 * gripTurnFactor;
          const camberTurnAssist = _queryResult.bankAngle * 0.45;

          const deltaVelAngle =
            (directTurnRate + driftCarveRate + camberTurnAssist) *
            airSteerMult *
            dt;

          velAngle = wrapAngle(velAngle + deltaVelAngle);
          v.heading = wrapAngle(velAngle + currentSlip);
          v.driftAngle = currentSlip;

          const isSlidingNow =
            !v.isAirborne &&
            prevSpeed > 8.5 &&
            Math.abs(currentSlip) > 0.18;

          if (isSlidingNow) {
            v.driftDuration += dt;
            v.isDrifting = true;
          } else {
            if (v.driftDuration > 0.4 && prevSpeed > 10.5 && !v.isAirborne) {
              // 4WD Corner-Exit Traction Hookup Surge
              driftExitBoost = 2.5;
              spawnParticleBurst(
                v.position.x - Math.sin(v.heading) * 1.4,
                v.position.y + 0.32,
                v.position.z - Math.cos(v.heading) * 1.4,
                6,
                0xfbbf24,
                5.0,
                0.85
              );
            }
            v.driftDuration = 0;
            v.isDrifting = false;
          }
        }

        // Front wheels counter-steer toward the travel trajectory (velAngle) during a drift!
        const desiredWheelSteer = THREE.MathUtils.clamp(
          Math.abs(v.driftAngle) > 0.15
            ? -v.driftAngle * 0.72 - steerInput * 0.18
            : -steerInput * 0.45,
          -0.62,
          0.62
        );
        v.steerAngle = THREE.MathUtils.damp(
          v.steerAngle,
          desiredWheelSteer,
          16,
          dt
        );
        v.rig.frontLeftPivot.rotation.y = v.steerAngle;
        v.rig.frontRightPivot.rotation.y = v.steerAngle;

        // 2) Recompute Chassis Forward & Right Vectors + Trajectory Speed
        const fwdX = Math.sin(v.heading);
        const fwdZ = Math.cos(v.heading);
        const rightX = -Math.cos(v.heading);
        const rightZ = Math.sin(v.heading);
        let forwardSpeed = isReversing ? prevFwdProj : prevSpeed;

        // 3) Apply 4WD Thrust, Slipstream, Rank Balancing, Braking & Drift Scrub along Trajectory (velAngle)
        if (!v.isAirborne && v.spinOutTimer <= 0) {
          const slipstreamAccelMult = 1.0 + 0.22 * v.slipstreamCharge;
          // Staying on throttle during a rally drift powers the 4WD system through the apex
          const driftPowerMult =
            v.isDrifting && throttleInput > 0.2 ? 1.08 : 1.0;
          const accelRate =
            (v.boostTimer > 0 ? 48.6 : 37.8) *
            slipstreamAccelMult *
            rankSpeedMult *
            collisionSlowMult *
            driftPowerMult *
            (v.damageSlowTimer > 0 ? 0.65 : 1.0);
          const brakeRate = 34.0 * weatherGripMult;

          const slopeDot =
            Math.sin(velAngle) * _queryResult.tangentX +
            Math.cos(velAngle) * _queryResult.tangentZ;
          const hillGravityAccel = -_queryResult.tangentY * slopeDot * 11.0;

          let newSpeed =
            forwardSpeed + hillGravityAccel * dt + driftExitBoost;

          if (throttleInput > 0) {
            newSpeed += throttleInput * accelRate * dt;
            if (canDrive && newSpeed > 0.2 && !soundEngine.getMuted()) {
              soundEngine.startEngineLoop();
            }
          }
          if (brakeInput > 0) {
            if (newSpeed > 1.0) {
              // Tapping brake to initiate a handbrake drift scrubs less speed than straight-line braking
              const driftBrakeFactor =
                Math.abs(steerInput) > 0.25 && newSpeed > 10.0 ? 0.52 : 1.0;
              newSpeed -= brakeInput * brakeRate * driftBrakeFactor * dt;
            } else {
              newSpeed -= brakeInput * 14.4 * dt;
            }
          }

          // Tire sideways scrub drag: minimal when holding throttle (4WD power slide), stronger when lifting off
          const slipSin = Math.sin(Math.abs(v.driftAngle));
          const driftScrubDrag =
            v.isDrifting
              ? slipSin * (throttleInput > 0.2 ? 0.16 : 0.48)
              : 0;

          const baseDragCoeff =
            v.surface === 'rough_ground'
              ? 3.2
              : v.surface === 'mud'
                ? 2.6
                : v.surface === 'grass'
                  ? 1.5
                  : throttleInput === 0
                    ? 1.35
                    : 0.35 * (1 - 0.35 * v.slipstreamCharge);
          const totalDrag = baseDragCoeff + driftScrubDrag;

          newSpeed *= Math.max(0, 1 - totalDrag * dt);
          newSpeed = THREE.MathUtils.clamp(
            newSpeed,
            -12.6,
            effectiveMaxSpeed
          );

          forwardSpeed = newSpeed;

          // Update velocity vector along the travel trajectory (velAngle) so v.heading stays genuinely pitched sideways by v.driftAngle!
          if (newSpeed >= 0) {
            v.velocity.x = Math.sin(velAngle) * newSpeed;
            v.velocity.z = Math.cos(velAngle) * newSpeed;
          } else {
            v.velocity.x = fwdX * newSpeed;
            v.velocity.z = fwdZ * newSpeed;
          }

          // Rough ground suspension chatter & gravel spray when not dodged
          if (v.surface === 'rough_ground' && Math.abs(newSpeed) > 3.0) {
            v.pitch += (Math.random() - 0.5) * 0.08;
            v.roll += (Math.random() - 0.5) * 0.08;
            if (canDrive && Math.random() < 0.35) {
              inputManager.triggerRumble(
                v.config.gamepadIndex,
                55,
                0.35,
                0.25
              );
              spawnParticleBurst(
                v.position.x - fwdX * 1.1,
                v.position.y + 0.25,
                v.position.z - fwdZ * 1.1,
                2,
                0xb45309,
                4.2,
                0.7
              );
            }
          }

          // Slipstream wind-streak particles
          if (v.isSlipstreaming && Math.random() < 0.4) {
            spawnParticleBurst(
              v.position.x + (Math.random() - 0.5) * 1.5,
              v.position.y + 0.7,
              v.position.z + (Math.random() - 0.5) * 1.5,
              1,
              0x38bdf8,
              2.2,
              0.55
            );
          }

          // Twin Rear-Tire Skid Marks & Rear-Wheel Gravel / Tire Smoke Roost During Drifting
          if (v.isDrifting || v.spinOutTimer > 0) {
            const rearAxleX = v.position.x - fwdX * 1.12;
            const rearAxleZ = v.position.z - fwdZ * 1.12;
            const wheelTrackHalf = 0.88;

            const rlX = rearAxleX - rightX * wheelTrackHalf;
            const rlZ = rearAxleZ - rightZ * wheelTrackHalf;
            const rrX = rearAxleX + rightX * wheelTrackHalf;
            const rrZ = rearAxleZ + rightZ * wheelTrackHalf;

            const isLoose =
              v.surface === 'dirt' ||
              v.surface === 'mud' ||
              v.surface === 'rough_ground' ||
              v.surface === 'grass';

            if (v.skidCooldown <= 0) {
              v.skidCooldown = 0.018;
              const skidHex = isLoose
                ? 0x45220a
                : v.surface === 'ice' || propWeather === 'snow'
                  ? 0x94a3b8
                  : 0x090d16;
              const skidWidth = THREE.MathUtils.clamp(
                0.92 + Math.abs(v.driftAngle) * 0.95,
                0.92,
                1.65
              );
              stampTireSkidMark(
                rlX,
                v.groundY,
                rlZ,
                _queryResult.upX,
                _queryResult.upY,
                _queryResult.upZ,
                velAngle,
                skidHex,
                skidWidth
              );
              stampTireSkidMark(
                rrX,
                v.groundY,
                rrZ,
                _queryResult.upX,
                _queryResult.upY,
                _queryResult.upZ,
                velAngle,
                skidHex,
                skidWidth
              );
            }

            if (Math.random() < 0.88) {
              const pColor = isLoose
                ? 0xa1622f
                : propWeather === 'snow' || v.surface === 'ice'
                  ? 0xf1f5f9
                  : 0xe2e8f0;
              const smokeScale = THREE.MathUtils.clamp(
                0.72 + Math.abs(v.driftAngle) * 0.85,
                0.72,
                1.35
              );
              spawnParticleBurst(
                rlX,
                v.position.y + 0.24,
                rlZ,
                1,
                pColor,
                3.4,
                smokeScale
              );
              spawnParticleBurst(
                rrX,
                v.position.y + 0.24,
                rrZ,
                1,
                pColor,
                3.4,
                smokeScale
              );
            }

            // Subtle high-frequency tire scrub vibration on controller while drifting
            if (
              canDrive &&
              v.config.controlType === 'gamepad' &&
              Math.random() < 0.25
            ) {
              inputManager.triggerRumble(
                v.config.gamepadIndex,
                40,
                0.08,
                0.22
              );
            }
          }
        }

        // 4) Integrate Horizontal Position & Soft Track Perimeter Guardrails
        const prevY = v.groundY;
        v.position.x += v.velocity.x * dt;
        v.position.z += v.velocity.z * dt;

        queryTrackSurface(
          v.position.x,
          v.position.z,
          bakedTrack,
          _queryResult,
          v.closestSampleIdx
        );
        v.closestSampleIdx = _queryResult.closestIndex;

        const maxAllowedLatNorm = _queryResult.isTunnel ? 1.02 : 1.32;
        if (Math.abs(_queryResult.normalizedLateral) > maxAllowedLatNorm) {
          const s = bakedTrack.samples[_queryResult.closestIndex];
          const maxLat =
            s.width *
            0.5 *
            maxAllowedLatNorm *
            Math.sign(_queryResult.lateralDist);
          v.position.x = s.position.x + s.right.x * maxLat;
          v.position.z = s.position.z + s.right.z * maxLat;
          const outVel = v.velocity.x * s.right.x + v.velocity.z * s.right.z;
          if (outVel * Math.sign(_queryResult.lateralDist) > 0) {
            v.velocity.x -= s.right.x * outVel * 1.25;
            v.velocity.z -= s.right.z * outVel * 1.25;
          }
        }

        const targetGroundY = _queryResult.groundY;

        // 5) Straightaway Jump & Airborne Kinematics
        if (!v.isAirborne) {
          const groundVerticalRate =
            (targetGroundY - prevY) / Math.max(dt, 0.008);
          if (
            v.surface === 'jump_ramp' &&
            forwardSpeed > 15.5 &&
            groundVerticalRate < -1.0
          ) {
            v.isAirborne = true;
            v.vy = 5.6 + forwardSpeed * 0.14;
            const tangDot =
              fwdX * _queryResult.tangentX + fwdZ * _queryResult.tangentZ;
            if (tangDot > 0.85) {
              const spd = Math.hypot(v.velocity.x, v.velocity.z);
              v.velocity.x = THREE.MathUtils.lerp(
                v.velocity.x,
                _queryResult.tangentX * spd,
                0.55
              );
              v.velocity.z = THREE.MathUtils.lerp(
                v.velocity.z,
                _queryResult.tangentZ * spd,
                0.55
              );
            }
            inputManager.triggerRumble(v.config.gamepadIndex, 130, 0.4, 0.4);
          } else {
            v.position.y = targetGroundY;
            v.vy = 0;
          }
        } else {
          v.vy -= 22.5 * dt;
          v.position.y += v.vy * dt;
          if (v.position.y <= targetGroundY) {
            v.position.y = targetGroundY;
            v.isAirborne = false;
            v.vy = 0;
            v.pitch = -0.14;
            spawnParticleBurst(
              v.position.x,
              v.position.y + 0.2,
              v.position.z,
              6,
              0xfbbf24,
              6.5,
              0.8
            );
            inputManager.triggerRumble(v.config.gamepadIndex, 180, 0.8, 0.6);
          }
        }

        // 6) Orient Vehicle Root using Right-Handed Basis Matrix
        applyVehicleOrientation(
          v,
          _queryResult.upX,
          _queryResult.upY,
          _queryResult.upZ,
          Math.min(1, 18 * dt)
        );

        const targetPitch = v.isAirborne
          ? THREE.MathUtils.clamp(-v.vy * 0.035, -0.28, 0.28)
          : (brakeInput - throttleInput) * 0.055;
        // Soft rally suspension rolls outward during a sideways drift
        const targetRoll = steerInput * 0.085 - v.driftAngle * 0.22;
        v.pitch = THREE.MathUtils.damp(v.pitch, targetPitch, 12, dt);
        v.roll = THREE.MathUtils.damp(v.roll, targetRoll, 12, dt);
        v.rig.bodyGroup.rotation.x = v.pitch;
        v.rig.bodyGroup.rotation.z = v.roll;

        v.wheelSpinAngle += forwardSpeed * dt * 2.4;
        for (const w of v.rig.wheels) {
          w.rotation.x = v.wheelSpinAngle;
        }

        // Weapon 1: Fire Forward Twin Autocannons (3 Shots per Lap)
        if (
          wantFire &&
          v.gunAmmo > 0 &&
          v.fireCooldown <= 0 &&
          v.spinOutTimer <= 0
        ) {
          v.gunAmmo--;
          v.fireCooldown = 0.32;
          v.muzzleTimer = 0.08;
          v.rig.muzzleFlashLeft.visible = true;
          v.rig.muzzleFlashRight.visible = true;
          soundEngine.playGunFire();
          inputManager.triggerRumble(v.config.gamepadIndex, 80, 0.45, 0.6);

          _rightVec.set(rightX, 0, rightZ);
          for (const barrelSide of [-0.62, 0.62]) {
            for (const p of projectilePool) {
              if (!p.active) {
                p.active = true;
                p.ownerSlot = v.slotIndex;
                p.life = 1.65;
                p.position
                  .copy(v.position)
                  .addScaledVector(_rightVec, barrelSide)
                  .addScaledVector(_forwardVec, 1.85);
                p.position.y += 0.72;
                p.velocity
                  .copy(_forwardVec)
                  .multiplyScalar(70.0 + Math.max(0, forwardSpeed));
                p.mesh.position.copy(p.position);
                p.mesh.quaternion.copy(v.rig.root.quaternion);
                p.mesh.visible = true;
                break;
              }
            }
          }
        }

        // Weapon 2: Drop Rear Oil Slick Hazard (2 Oil Slicks per Lap)
        if (wantOil && v.oilAmmo > 0 && !v.isAirborne) {
          v.oilAmmo--;
          soundEngine.playOilDrop();
          for (const oil of oilPool) {
            if (!oil.active) {
              oil.active = true;
              oil.ownerSlot = v.slotIndex;
              oil.immuneTimer = 0.85;
              oil.life = 45.0;
              oil.position
                .copy(v.position)
                .addScaledVector(_forwardVec, -2.35);
              oil.position.y = v.groundY + 0.08;
              oil.mesh.position.copy(oil.position);
              const slopeQ = new THREE.Quaternion().setFromUnitVectors(
                _upVec,
                _slopeNormal
              );
              oil.mesh.quaternion.copy(slopeQ);
              oil.mesh.visible = true;
              break;
            }
          }
        }

        // Check Oil Slick Collisions
        if (!v.isAirborne && v.spinOutTimer <= 0) {
          for (const oil of oilPool) {
            if (!oil.active) continue;
            if (oil.ownerSlot === v.slotIndex && oil.immuneTimer > 0) continue;
            const odx = v.position.x - oil.position.x;
            const odz = v.position.z - oil.position.z;
            if (
              odx * odx + odz * odz <
              (oil.radius + 0.7) * (oil.radius + 0.7)
            ) {
              v.spinOutTimer = 1.1;
              soundEngine.playSpinOut();
              inputManager.triggerRumble(
                v.config.gamepadIndex,
                340,
                0.95,
                0.8
              );
              const ownerVeh = vehicles.find(
                (ov) => ov.slotIndex === oil.ownerSlot
              );
              if (ownerVeh && ownerVeh.slotIndex !== v.slotIndex) {
                ownerVeh.spinOutsCaused++;
              }
              oil.active = false;
              oil.mesh.visible = false;
              break;
            }
          }
        }

        // Lap & Checkpoint Progression — Refreshes 3 Gun Shots, 2 Oil Slicks & 3 Nitro Boosts Each Lap!
        v.prevSplineT = v.splineT;
        v.splineT = _queryResult.t;

        if (v.splineT > 0.42 && v.splineT < 0.65) {
          v.passedHalfway = true;
        }
        if (
          v.passedHalfway &&
          v.prevSplineT > 0.88 &&
          v.splineT < 0.12 &&
          canDrive &&
          !v.finished
        ) {
          v.passedHalfway = false;
          const lapDuration = nowMs - v.lapStartTimeMs;
          v.lastLapMs = lapDuration;
          if (v.bestLapMs === null || lapDuration < v.bestLapMs) {
            v.bestLapMs = lapDuration;
          }
          v.lapStartTimeMs = nowMs;

          // Refresh 3 Gun Shots, 2 Oil Slicks, and 3 Nitro Boosts on every new lap
          v.gunAmmo = MAX_GUN_SHOTS_PER_LAP;
          v.oilAmmo = MAX_OIL_SLICKS_PER_LAP;
          v.nitroAmmo = MAX_NITRO_PER_LAP;

          if (v.lap >= propMaxLaps) {
            v.finished = true;
            v.finishTimeMs = nowMs - raceClockStartMs;
            soundEngine.playPickup();
          } else {
            v.lap++;
            soundEngine.playPickup();
          }
        }
      }

      // Vehicle-to-Vehicle Bumper Collisions (Both cars slow down by 10% for 4 seconds on hit!)
      for (let i = 0; i < vehicles.length; i++) {
        for (let j = i + 1; j < vehicles.length; j++) {
          const a = vehicles[i];
          const b = vehicles[j];
          const dx = b.position.x - a.position.x;
          const dz = b.position.z - a.position.z;
          const distSq = dx * dx + dz * dz;
          const minSep = 2.35;
          if (distSq > 0.0001 && distSq < minSep * minSep) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const nz = dz / dist;
            const overlap = (minSep - dist) * 0.52;

            a.position.x -= nx * overlap;
            a.position.z -= nz * overlap;
            b.position.x += nx * overlap;
            b.position.z += nz * overlap;

            // Both cars slow down 10% for 4.0 seconds when they hit each other during racing
            if (canDrive) {
              a.collisionSlowTimer = 4.0;
              b.collisionSlowTimer = 4.0;
            }

            const relVx = a.velocity.x - b.velocity.x;
            const relVz = a.velocity.z - b.velocity.z;
            const sepVel = relVx * nx + relVz * nz;
            if (sepVel > 0) {
              const impulse = sepVel * 0.68;
              a.velocity.x -= nx * impulse;
              a.velocity.z -= nz * impulse;
              b.velocity.x += nx * impulse;
              b.velocity.z += nz * impulse;
            }

            if (
              canDrive &&
              (a.collisionImpactCooldown <= 0 || b.collisionImpactCooldown <= 0)
            ) {
              a.collisionImpactCooldown = 0.55;
              b.collisionImpactCooldown = 0.55;
              a.velocity.multiplyScalar(0.92);
              b.velocity.multiplyScalar(0.92);
              inputManager.triggerRumble(a.config.gamepadIndex, 120, 0.5, 0.5);
              inputManager.triggerRumble(b.config.gamepadIndex, 120, 0.5, 0.5);
              spawnParticleBurst(
                (a.position.x + b.position.x) * 0.5,
                a.position.y + 0.5,
                (a.position.z + b.position.z) * 0.5,
                5,
                0xfbbf24,
                5.5,
                0.7
              );
            }
          }
        }
      }

      // Advance Forward Projectiles & Check Vehicle Hits
      for (const p of projectilePool) {
        if (!p.active) continue;
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          p.mesh.visible = false;
          continue;
        }

        p.position.addScaledVector(p.velocity, dt);
        queryTrackSurface(p.position.x, p.position.z, bakedTrack, _queryResult);
        p.position.y = _queryResult.groundY + 0.68;
        p.mesh.position.copy(p.position);

        for (const target of vehicles) {
          if (target.slotIndex === p.ownerSlot) continue;
          const dx = target.position.x - p.position.x;
          const dz = target.position.z - p.position.z;
          if (dx * dx + dz * dz < 2.45) {
            p.active = false;
            p.mesh.visible = false;
            // Extend gun hit slow-down time by 1.5 more seconds (1.9s -> 3.4s, or +1.5s if hit by a follow-up shot)
            target.damageSlowTimer =
              target.damageSlowTimer > 0 && target.damageSlowTimer < 3.0
                ? target.damageSlowTimer + 1.5
                : 3.4;
            target.velocity.multiplyScalar(0.55);
            soundEngine.playWeaponHit();
            inputManager.triggerRumble(
              target.config.gamepadIndex,
              220,
              0.9,
              0.7
            );

            const shooter = vehicles.find((s) => s.slotIndex === p.ownerSlot);
            if (shooter) {
              shooter.totalHits++;
              inputManager.triggerRumble(
                shooter.config.gamepadIndex,
                90,
                0.4,
                0.4
              );
            }

            spawnParticleBurst(
              target.position.x,
              target.position.y + 0.75,
              target.position.z,
              12,
              0xf97316,
              9.5,
              1.05
            );
            break;
          }
        }
      }

      // Advance Oil Slick Timers
      for (const oil of oilPool) {
        if (!oil.active) continue;
        if (oil.immuneTimer > 0) oil.immuneTimer -= dt;
        oil.life -= dt;
        if (oil.life <= 0) {
          oil.active = false;
          oil.mesh.visible = false;
        }
      }

      // Update Instanced Burst Particles
      let activeParticleCount = 0;
      for (let i = 0; i < maxParticles; i++) {
        const b = burstPool[i];
        if (!b.active) {
          _dummyObj.position.set(0, -100, 0);
          _dummyObj.scale.setScalar(0.001);
          _dummyObj.updateMatrix();
          particleInstanced.setMatrixAt(i, _dummyObj.matrix);
          continue;
        }
        b.life += dt;
        if (b.life >= b.maxLife) {
          b.active = false;
          _dummyObj.position.set(0, -100, 0);
          _dummyObj.scale.setScalar(0.001);
          _dummyObj.updateMatrix();
          particleInstanced.setMatrixAt(i, _dummyObj.matrix);
          continue;
        }
        activeParticleCount++;
        b.velocity.y -= 9.8 * dt;
        b.position.addScaledVector(b.velocity, dt);
        const fade = 1 - b.life / b.maxLife;
        _dummyObj.position.copy(b.position);
        _dummyObj.scale.setScalar(b.scale * fade);
        _dummyObj.updateMatrix();
        particleInstanced.setMatrixAt(i, _dummyObj.matrix);
        particleInstanced.setColorAt(i, b.color);
      }
      if (activeParticleCount > 0 || propRaceState === 'racing') {
        particleInstanced.instanceMatrix.needsUpdate = true;
        if (particleInstanced.instanceColor) {
          particleInstanced.instanceColor.needsUpdate = true;
        }
      }

      // Rotate Trackside Windmill & Turbine Blades
      if (builtDiorama && propRaceState !== 'paused') {
        for (let r = 0; r < builtDiorama.animatedRotors.length; r++) {
          builtDiorama.animatedRotors[r].rotation.z +=
            dt * (1.55 + (r % 3) * 0.25);
        }
      }

      // 8. Shared Zoom-Adaptive Overhead Camera + Dynamic Shadow Frustum Tracking
      if (propRaceState === 'lobby') {
        lobbyOrbitAngle += dt * 0.14;
        const orbitRadius = 210;
        camera.position.set(
          Math.cos(lobbyOrbitAngle) * orbitRadius,
          125,
          Math.sin(lobbyOrbitAngle) * orbitRadius
        );
        camera.lookAt(0, 4, 0);
      } else {
        let minX = Infinity;
        let maxX = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;
        let avgY = 0;
        let trackedCount = 0;

        for (const v of vehicles) {
          if (v.config.controlType !== 'ai' && !v.finished) {
            if (v.position.x < minX) minX = v.position.x;
            if (v.position.x > maxX) maxX = v.position.x;
            if (v.position.z < minZ) minZ = v.position.z;
            if (v.position.z > maxZ) maxZ = v.position.z;
            avgY += v.position.y;
            trackedCount++;
          }
        }

        if (trackedCount === 0 && vehicles.length > 0) {
          const v0 = vehicles[0];
          minX = maxX = v0.position.x;
          minZ = maxZ = v0.position.z;
          avgY = v0.position.y;
          trackedCount = 1;
        }

        avgY /= Math.max(1, trackedCount);
        _camTarget.set((minX + maxX) * 0.5, avgY, (minZ + maxZ) * 0.5);

        const spread = Math.hypot(maxX - minX, maxZ - minZ);
        let baseDist = 56;
        if (propCamPreset === 'high_overhead') baseDist = 88;
        else if (propCamPreset === 'tight_action') baseDist = 42;

        const targetDist = THREE.MathUtils.clamp(
          baseDist + spread * 0.78,
          40,
          155
        );

        smoothedCamTarget.x = THREE.MathUtils.damp(
          smoothedCamTarget.x,
          _camTarget.x,
          8.0,
          dt
        );
        smoothedCamTarget.y = THREE.MathUtils.damp(
          smoothedCamTarget.y,
          _camTarget.y,
          8.0,
          dt
        );
        smoothedCamTarget.z = THREE.MathUtils.damp(
          smoothedCamTarget.z,
          _camTarget.z,
          8.0,
          dt
        );
        smoothedCamDist = THREE.MathUtils.damp(
          smoothedCamDist,
          targetDist,
          5.0,
          dt
        );

        const elevRatio = propCamPreset === 'high_overhead' ? 1.12 : 0.92;
        const zOffsetRatio = propCamPreset === 'high_overhead' ? 0.55 : 0.78;

        _camDesiredPos.set(
          smoothedCamTarget.x,
          smoothedCamTarget.y + smoothedCamDist * elevRatio,
          smoothedCamTarget.z + smoothedCamDist * zOffsetRatio
        );
        camera.position.copy(_camDesiredPos);
        camera.lookAt(smoothedCamTarget);

        sunLight.target.position.copy(smoothedCamTarget);
        sunLight.position.set(
          smoothedCamTarget.x + 55,
          smoothedCamTarget.y + 95,
          smoothedCamTarget.z + 48
        );
      }

      // Update Web Audio Engine & Retro Circuit Soundtrack
      if (vehicles.length > 0) {
        const v0 = vehicles[0];
        const leadSpeed = v0.velocity.length() / 34.2;
        soundEngine.updateEngineRpm(
          leadSpeed,
          v0.isAirborne,
          propRaceState !== 'racing',
          propTrackId
        );
      }

      // Compute Standings & Push Telemetry to React HUD (~12 Hz)
      telemetryAccumulator += dt;
      if (telemetryAccumulator >= 0.08) {
        telemetryAccumulator = 0;

        const telemetryList: VehicleTelemetry[] = vehicles.map((v) => ({
          slotIndex: v.slotIndex,
          name: v.config.name,
          colorHex: v.config.colorHex,
          controlType: v.config.controlType,
          gamepadIndex: v.config.gamepadIndex,
          positionRank: v.currentRank,
          lap: v.lap,
          maxLaps: propMaxLaps,
          speedKmh: Math.round(v.velocity.length() * 4.8),
          gunAmmo: v.gunAmmo,
          maxGunAmmo: v.maxGunAmmo,
          oilAmmo: v.oilAmmo,
          maxOilAmmo: v.maxOilAmmo,
          nitroAmmo: v.nitroAmmo,
          maxNitroAmmo: v.maxNitroAmmo,
          isAirborne: v.isAirborne,
          isInTunnel: v.isInTunnel,
          isSlipstreaming: v.isSlipstreaming,
          isLastPlaceBoost: v.isLastPlaceBoost,
          isLeaderPenalty: v.isLeaderPenalty,
          isCollisionSlowed: v.collisionSlowTimer > 0,
          surface: v.surface,
          bankAngleDeg: Math.round(THREE.MathUtils.radToDeg(v.bankAngle)),
          isDrifting: v.isDrifting,
          driftAngleDeg: Math.round(
            Math.abs(THREE.MathUtils.radToDeg(v.driftAngle))
          ),
          isSpinningOut: v.spinOutTimer > 0,
          isDamaged: v.damageSlowTimer > 0,
          isBoosting: v.boostTimer > 0,
          bestLapMs: v.bestLapMs,
          lastLapMs: v.lastLapMs,
          totalHits: v.totalHits,
          spinOutsCaused: v.spinOutsCaused,
          finished: v.finished,
          finishTimeMs: v.finishTimeMs,
        }));

        const connectedPads = inputManager.getConnectedGamepads();
        cbTelemetry(telemetryList, connectedPads, activeCountdownNum);

        if (propRaceState === 'racing') {
          const humanCars = vehicles.filter((v) => v.config.controlType !== 'ai');
          const checkCars = humanCars.length > 0 ? humanCars : [vehicles[0]];
          if (checkCars.every((hc) => hc.finished)) {
            const finalSorted = [...telemetryList].sort(
              (a, b) => a.positionRank - b.positionRank
            );
            cbFinished(finalSorted);
          }
        }
      }

      inputManager.endFrame();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      inputManager.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={canvasMountRef}
      className="fixed inset-0 w-full h-full overflow-hidden bg-[#0B0F17]"
      aria-label="Sage Rally 3D WebGL Viewport"
    />
  );
};
