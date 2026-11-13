import * as THREE from 'three';
import { BakedTrack, queryTrackSurface, TrackSurfaceQueryResult } from './tracks';
import { WeatherType } from '../types/game';

/**
 * Generates a high-anisotropy procedural road texture with asphalt grain, racing lane dashes, and surface strips.
 */
export function createRoadCanvasTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d4d8e0';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = 190 + Math.floor(Math.random() * 50);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Crisp white edge lines
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(18, 0, 10, 512);
  ctx.fillRect(484, 0, 10, 512);

  // Center dashed racing line
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  for (let y = 0; y < 512; y += 64) {
    ctx.fillRect(252, y + 10, 8, 34);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Generates a soft radial contact shadow texture for grounding cars and props.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface VehicleRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  wheels: THREE.Group[];
  frontLeftPivot: THREE.Group;
  frontRightPivot: THREE.Group;
  muzzleFlashLeft: THREE.Mesh;
  muzzleFlashRight: THREE.Mesh;
  boostFlameLeft: THREE.Mesh;
  boostFlameRight: THREE.Mesh;
  shieldRing: THREE.Mesh;
}

/**
 * Builds a composite 10-part low-poly Rally/GT combat race car (GeneRally 2 + R.C. Pro-Am style)
 */
export function createCompositeRaceCar(
  primaryHex: string,
  shadowTexture: THREE.Texture
): VehicleRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const primaryMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(primaryHex),
    roughness: 0.26,
    metalness: 0.35,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x181c24,
    roughness: 0.65,
    metalness: 0.25,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.85,
  });

  const gunMetalMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.3,
    metalness: 0.85,
  });

  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.32,
    metalness: 0.15,
  });

  // 1. Primary Silhouette: Sculpted Aerodynamic Lower Chassis
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-1.55, 0.24);
  hullShape.lineTo(1.45, 0.24);
  hullShape.lineTo(1.68, 0.42);
  hullShape.lineTo(1.52, 0.68);
  hullShape.lineTo(0.65, 0.76);
  hullShape.lineTo(-1.35, 0.82);
  hullShape.lineTo(-1.62, 0.56);
  hullShape.closePath();

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: 1.56,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  hullGeo.translate(0, 0, -0.78);
  hullGeo.rotateY(-Math.PI / 2);

  const hullMesh = new THREE.Mesh(hullGeo, primaryMat);
  hullMesh.castShadow = true;
  hullMesh.receiveShadow = true;
  bodyGroup.add(hullMesh);

  // Center Racing Stripe
  const stripeGeo = new THREE.BoxGeometry(0.36, 0.04, 3.05);
  const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
  stripeMesh.position.set(0, 0.81, -0.02);
  bodyGroup.add(stripeMesh);

  // 2. Secondary Read: Sloped Cockpit Canopy & Tinted Windshield
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-0.78, 0.72);
  cabinShape.lineTo(0.58, 0.72);
  cabinShape.lineTo(0.22, 1.18);
  cabinShape.lineTo(-0.56, 1.16);
  cabinShape.closePath();

  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, {
    depth: 1.18,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  cabinGeo.translate(0, 0, -0.59);
  cabinGeo.rotateY(-Math.PI / 2);

  const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
  cabinMesh.castShadow = true;
  bodyGroup.add(cabinMesh);

  const scoopGeo = new THREE.BoxGeometry(0.42, 0.14, 0.55);
  const scoopMesh = new THREE.Mesh(scoopGeo, primaryMat);
  scoopMesh.position.set(0, 1.22, -0.15);
  bodyGroup.add(scoopMesh);

  // 3. Secondary Read: Raised Rear GT Wing Spoiler & Struts
  const wingGroup = new THREE.Group();
  const wingBladeGeo = new THREE.BoxGeometry(1.72, 0.08, 0.42);
  const wingBlade = new THREE.Mesh(wingBladeGeo, trimMat);
  wingBlade.position.set(0, 1.18, -1.42);
  wingBlade.rotation.x = 0.16;
  wingBlade.castShadow = true;
  wingGroup.add(wingBlade);

  const strutGeo = new THREE.BoxGeometry(0.08, 0.38, 0.24);
  const strutL = new THREE.Mesh(strutGeo, trimMat);
  strutL.position.set(-0.52, 0.98, -1.38);
  const strutR = new THREE.Mesh(strutGeo, trimMat);
  strutR.position.set(0.52, 0.98, -1.38);
  wingGroup.add(strutL, strutR);

  const endplateGeo = new THREE.BoxGeometry(0.05, 0.26, 0.52);
  const plateL = new THREE.Mesh(endplateGeo, primaryMat);
  plateL.position.set(-0.86, 1.18, -1.42);
  const plateR = new THREE.Mesh(endplateGeo, primaryMat);
  plateR.position.set(0.86, 1.18, -1.42);
  wingGroup.add(plateL, plateR);
  bodyGroup.add(wingGroup);

  // 4. Accent Detail: Front Splitter, Bumper & Twin LED Headlights
  const splitterGeo = new THREE.BoxGeometry(1.74, 0.1, 0.45);
  const splitterMesh = new THREE.Mesh(splitterGeo, trimMat);
  splitterMesh.position.set(0, 0.24, 1.54);
  bodyGroup.add(splitterMesh);

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfef08a,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });
  const hlGeo = new THREE.BoxGeometry(0.32, 0.14, 0.08);
  const hlL = new THREE.Mesh(hlGeo, headlightMat);
  hlL.position.set(-0.54, 0.54, 1.69);
  const hlR = new THREE.Mesh(hlGeo, headlightMat);
  hlR.position.set(0.54, 0.54, 1.69);
  bodyGroup.add(hlL, hlR);

  // Rear Brake Light Bar
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });
  const tlGeo = new THREE.BoxGeometry(1.36, 0.14, 0.08);
  const tlMesh = new THREE.Mesh(tlGeo, taillightMat);
  tlMesh.position.set(0, 0.64, -1.64);
  bodyGroup.add(tlMesh);

  // 5. Accent Detail: Twin R.C. Pro-Am Forward Autocannon Barrels + Muzzle Flashes
  const barrelGeo = new THREE.CylinderGeometry(0.065, 0.08, 0.85, 10);
  barrelGeo.rotateX(Math.PI / 2);
  const barrelL = new THREE.Mesh(barrelGeo, gunMetalMat);
  barrelL.position.set(-0.62, 0.78, 1.18);
  barrelL.castShadow = true;
  const barrelR = new THREE.Mesh(barrelGeo, gunMetalMat);
  barrelR.position.set(0.62, 0.78, 1.18);
  barrelR.castShadow = true;
  bodyGroup.add(barrelL, barrelR);

  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.95,
  });
  const flashGeo = new THREE.ConeGeometry(0.16, 0.45, 8);
  flashGeo.rotateX(Math.PI / 2);
  const muzzleFlashLeft = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlashLeft.position.set(-0.62, 0.78, 1.82);
  muzzleFlashLeft.visible = false;
  const muzzleFlashRight = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlashRight.position.set(0.62, 0.78, 1.82);
  muzzleFlashRight.visible = false;
  bodyGroup.add(muzzleFlashLeft, muzzleFlashRight);

  // 6. Accent Detail: Twin Boost Exhaust Flames
  const boostMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9,
  });
  const boostGeo = new THREE.ConeGeometry(0.15, 0.65, 8);
  boostGeo.rotateX(-Math.PI / 2);
  const boostFlameLeft = new THREE.Mesh(boostGeo, boostMat);
  boostFlameLeft.position.set(-0.38, 0.36, -1.92);
  boostFlameLeft.visible = false;
  const boostFlameRight = new THREE.Mesh(boostGeo, boostMat);
  boostFlameRight.position.set(0.38, 0.36, -1.92);
  boostFlameRight.visible = false;
  bodyGroup.add(boostFlameLeft, boostFlameRight);

  // 7–10. Four Independent Wheel Assemblies
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x17191c,
    roughness: 0.85,
    metalness: 0.1,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.25,
    metalness: 0.8,
  });

  const tireGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.36, 16);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.38, 10);
  rimGeo.rotateZ(Math.PI / 2);

  const wheels: THREE.Group[] = [];
  const frontLeftPivot = new THREE.Group();
  const frontRightPivot = new THREE.Group();
  frontLeftPivot.position.set(-0.88, 0.4, 1.02);
  frontRightPivot.position.set(0.88, 0.4, 1.02);
  root.add(frontLeftPivot, frontRightPivot);

  const wheelPositions = [
    { parent: frontLeftPivot, x: 0, y: 0, z: 0 },
    { parent: frontRightPivot, x: 0, y: 0, z: 0 },
    { parent: root, x: -0.9, y: 0.4, z: -1.02 },
    { parent: root, x: 0.9, y: 0.4, z: -1.02 },
  ];

  for (const wp of wheelPositions) {
    const wGroup = new THREE.Group();
    wGroup.position.set(wp.x, wp.y, wp.z);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wGroup.add(tire, rim);
    wp.parent.add(wGroup);
    wheels.push(wGroup);
  }

  // Contact Shadow Grounding Plane
  const shadowGeo = new THREE.PlaneGeometry(2.6, 4.2);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0.58,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.position.y = 0.04;
  root.add(shadowPlane);

  // Subtle Player Ring Indicator on Ground
  const ringGeo = new THREE.RingGeometry(1.35, 1.52, 24);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(primaryHex),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shieldRing = new THREE.Mesh(ringGeo, ringMat);
  shieldRing.position.y = 0.06;
  root.add(shieldRing);

  return {
    root,
    bodyGroup,
    wheels,
    frontLeftPivot,
    frontRightPivot,
    muzzleFlashLeft,
    muzzleFlashRight,
    boostFlameLeft,
    boostFlameRight,
    shieldRing,
  };
}

export interface BuiltTrackScene {
  group: THREE.Group;
  roadMaterial: THREE.MeshStandardMaterial;
  gantryLights: THREE.Mesh[];
  animatedRotors: THREE.Object3D[];
  staticHazards: {
    worldPos: THREE.Vector3;
    radius: number;
    type: 'mud_pit' | 'water_puddle' | 'rough_ground';
  }[];
}

/**
 * 1. Composite Multi-Tiered Arena Stadium Complex (9 parts + twin floodlight towers)
 */
function createMegaStadium(weather: WeatherType): THREE.Group {
  const group = new THREE.Group();

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.78,
    metalness: 0.12,
  });
  const wallAccentMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.25,
  });
  const canopyMat = new THREE.MeshStandardMaterial({
    color: weather === 'snow' ? 0xe2e8f0 : 0xe11d48,
    roughness: 0.35,
    metalness: 0.4,
  });
  const glassBoothMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.65,
    roughness: 0.15,
    metalness: 0.85,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.32,
    metalness: 0.78,
  });
  const floodlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfef08a,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });

  const seatColors = [0xe11d48, 0xf59e0b, 0x0ea5e9, 0xf8fafc, 0x10b981];

  // Foundation Plinth
  const plinthGeo = new THREE.BoxGeometry(34, 2.2, 12.5);
  const plinth = new THREE.Mesh(plinthGeo, wallAccentMat);
  plinth.position.set(0, 0.3, -3.2);
  plinth.receiveShadow = true;
  group.add(plinth);

  // 5 Stepped Seating Bowl Tiers + Colorful Spectator Bands
  for (let tier = 0; tier < 5; tier++) {
    const tierW = 32 - tier * 0.4;
    const tierGeo = new THREE.BoxGeometry(tierW, 1.05, 1.9);
    const tierMesh = new THREE.Mesh(tierGeo, concreteMat);
    tierMesh.position.set(0, 1.2 + tier * 1.0, -tier * 1.55);
    tierMesh.castShadow = true;
    tierMesh.receiveShadow = true;
    group.add(tierMesh);

    const bandMat = new THREE.MeshStandardMaterial({
      color: seatColors[tier % seatColors.length],
      roughness: 0.5,
      metalness: 0.15,
    });
    const bandGeo = new THREE.BoxGeometry(tierW - 1.2, 0.32, 0.45);
    const bandMesh = new THREE.Mesh(bandGeo, bandMat);
    bandMesh.position.set(0, 1.78 + tier * 1.0, -tier * 1.55 + 0.55);
    group.add(bandMesh);
  }

  // Rear Stadium Concourse Wall & VIP Skybox Press Booth
  const backWallGeo = new THREE.BoxGeometry(32.5, 6.8, 1.4);
  const backWall = new THREE.Mesh(backWallGeo, wallAccentMat);
  backWall.position.set(0, 3.8, -7.2);
  backWall.castShadow = true;
  group.add(backWall);

  const vipBoxGeo = new THREE.BoxGeometry(14.0, 1.6, 2.2);
  const vipBox = new THREE.Mesh(vipBoxGeo, glassBoothMat);
  vipBox.position.set(0, 6.8, -5.8);
  group.add(vipBox);

  // Cantilevered Steel Roof Canopy
  const roofGeo = new THREE.BoxGeometry(33.5, 0.45, 8.2);
  const roofMesh = new THREE.Mesh(roofGeo, canopyMat);
  roofMesh.position.set(0, 8.2, -3.6);
  roofMesh.rotation.x = 0.16;
  roofMesh.castShadow = true;
  group.add(roofMesh);

  // Twin Towering Floodlight Pylons on Stadium Flanks
  const mastGeo = new THREE.CylinderGeometry(0.28, 0.42, 13.5, 8);
  const bankFrameGeo = new THREE.BoxGeometry(3.2, 1.6, 0.45);
  const bankGlowGeo = new THREE.BoxGeometry(2.9, 1.3, 0.15);

  for (const side of [-1, 1]) {
    const mast = new THREE.Mesh(mastGeo, steelMat);
    mast.position.set(side * 17.5, 6.5, -5.5);
    mast.castShadow = true;
    group.add(mast);

    const headGroup = new THREE.Group();
    headGroup.position.set(side * 17.5, 13.2, -5.2);
    headGroup.rotation.x = 0.38;
    const frame = new THREE.Mesh(bankFrameGeo, wallAccentMat);
    const glow = new THREE.Mesh(bankGlowGeo, floodlightMat);
    glow.position.z = 0.22;
    headGroup.add(frame, glow);
    group.add(headGroup);
  }

  return group;
}

/**
 * 2. Composite Country / Ranch Farmstead (Red Barn, Gambrel Roof, Grain Silo, Hay Bales & Corral Fence)
 */
function createFarmComplex(weather: WeatherType): THREE.Group {
  const group = new THREE.Group();

  const barnRedMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.78,
    metalness: 0.08,
  });
  const whiteTrimMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.55,
    metalness: 0.1,
  });
  const roofSlateMat = new THREE.MeshStandardMaterial({
    color: weather === 'snow' ? 0xe2e8f0 : 0x1e293b,
    roughness: 0.65,
    metalness: 0.15,
  });
  const siloMetalMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.28,
    metalness: 0.76,
  });
  const hayMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.9,
    metalness: 0.02,
  });
  const woodFenceMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.88,
    metalness: 0.05,
  });

  // Ground Pad
  const padGeo = new THREE.BoxGeometry(18, 1.5, 14);
  const padMesh = new THREE.Mesh(padGeo, woodFenceMat);
  padMesh.position.set(0, -0.45, 0);
  group.add(padMesh);

  // Main Barn Hull
  const barnGeo = new THREE.BoxGeometry(9.2, 5.2, 11.4);
  const barnMesh = new THREE.Mesh(barnGeo, barnRedMat);
  barnMesh.position.set(-2.0, 2.6, 0);
  barnMesh.castShadow = true;
  barnMesh.receiveShadow = true;
  group.add(barnMesh);

  // Gambrel Pitched Barn Roof (ExtrudeGeometry)
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-5.2, 0);
  roofShape.lineTo(-3.4, 2.2);
  roofShape.lineTo(0, 3.4);
  roofShape.lineTo(3.4, 2.2);
  roofShape.lineTo(5.2, 0);
  roofShape.closePath();

  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth: 12.2,
    bevelEnabled: false,
  });
  roofGeo.translate(0, 0, -6.1);
  const roofMesh = new THREE.Mesh(roofGeo, roofSlateMat);
  roofMesh.position.set(-2.0, 5.0, 0);
  roofMesh.castShadow = true;
  group.add(roofMesh);

  // White Barn Double Doors & Hayloft Window
  const doorGeo = new THREE.BoxGeometry(3.8, 3.4, 0.25);
  const doorMesh = new THREE.Mesh(doorGeo, whiteTrimMat);
  doorMesh.position.set(-2.0, 1.75, 5.72);
  group.add(doorMesh);

  const loftGeo = new THREE.BoxGeometry(1.8, 1.5, 0.28);
  const loftMesh = new THREE.Mesh(loftGeo, whiteTrimMat);
  loftMesh.position.set(-2.0, 6.1, 5.72);
  group.add(loftMesh);

  // Cylindrical Metallic Grain Silo + Dome Cap
  const siloTowerGeo = new THREE.CylinderGeometry(2.1, 2.1, 10.5, 14);
  const siloTower = new THREE.Mesh(siloTowerGeo, siloMetalMat);
  siloTower.position.set(4.8, 5.2, -1.8);
  siloTower.castShadow = true;
  siloTower.receiveShadow = true;
  group.add(siloTower);

  const siloDomeGeo = new THREE.SphereGeometry(
    2.1,
    14,
    10,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.5
  );
  const siloDome = new THREE.Mesh(siloDomeGeo, whiteTrimMat);
  siloDome.position.set(4.8, 10.45, -1.8);
  siloDome.castShadow = true;
  group.add(siloDome);

  // Golden Cylindrical Hay Bales in Farmyard
  const baleGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.4, 10);
  baleGeo.rotateZ(Math.PI / 2);
  const balePositions = [
    [4.2, 0.85, 3.2],
    [4.4, 0.85, 5.0],
    [4.3, 2.35, 4.1],
  ];
  for (const [bx, by, bz] of balePositions) {
    const bale = new THREE.Mesh(baleGeo, hayMat);
    bale.position.set(bx, by, bz);
    bale.rotation.y = bx * 0.4;
    bale.castShadow = true;
    group.add(bale);
  }

  // Timber Corral Fence Rails
  const railGeo = new THREE.BoxGeometry(7.5, 0.18, 0.18);
  const r1 = new THREE.Mesh(railGeo, woodFenceMat);
  r1.position.set(3.5, 0.7, 6.4);
  const r2 = new THREE.Mesh(railGeo, woodFenceMat);
  r2.position.set(3.5, 1.25, 6.4);
  group.add(r1, r2);

  return group;
}

/**
 * 3. Composite Spinning Windmill (Classic Dutch/Country Windmill OR Modern Wind Turbine)
 */
function createWindmill(
  weather: WeatherType,
  isModernTurbine: boolean
): { group: THREE.Group; rotor: THREE.Group } {
  const group = new THREE.Group();
  const rotor = new THREE.Group();

  if (isModernTurbine) {
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.45,
    });
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.75,
      metalness: 0.15,
    });
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.4,
    });

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 1.6, 10), baseMat);
    pad.position.y = 0.2;
    group.add(pad);

    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 1.25, 16.5, 12),
      towerMat
    );
    tower.position.y = 8.4;
    tower.castShadow = true;
    group.add(tower);

    const nacelle = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.6, 3.8),
      towerMat
    );
    nacelle.position.set(0, 16.8, 0.2);
    nacelle.castShadow = true;
    group.add(nacelle);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), beaconMat);
    beacon.position.set(0, 17.8, -0.8);
    group.add(beacon);

    rotor.position.set(0, 16.8, 2.25);
    const hub = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.6, 10), towerMat);
    hub.rotation.x = Math.PI / 2;
    rotor.add(hub);

    const bladeGeo = new THREE.BoxGeometry(0.52, 7.6, 0.14);
    bladeGeo.translate(0, 3.8, 0);
    for (let b = 0; b < 3; b++) {
      const bladePivot = new THREE.Group();
      bladePivot.rotation.z = (b * Math.PI * 2) / 3;
      const blade = new THREE.Mesh(bladeGeo, towerMat);
      blade.rotation.y = 0.22;
      blade.castShadow = true;
      bladePivot.add(blade);
      rotor.add(bladePivot);
    }

    group.add(rotor);
    return { group, rotor };
  }

  // Classic Octagonal Dutch / Ranch Windmill with 4 Lattice Sails
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.85,
    metalness: 0.08,
  });
  const towerWoodMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.78,
    metalness: 0.1,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: weather === 'snow' ? 0xe2e8f0 : 0x1e293b,
    roughness: 0.55,
    metalness: 0.2,
  });
  const sailCanvasMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.65,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(3.4, 3.8, 2.6, 8),
    stoneMat
  );
  plinth.position.y = 0.8;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 3.1, 9.8, 8),
    towerWoodMat
  );
  body.position.y = 6.8;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Wooden Balcony Deck Ring
  const deck = new THREE.Mesh(
    new THREE.CylinderGeometry(3.5, 3.5, 0.32, 8),
    sailCanvasMat
  );
  deck.position.y = 4.2;
  group.add(deck);

  // Domed Cap
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(1.85, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
    capMat
  );
  cap.position.y = 11.5;
  cap.castShadow = true;
  group.add(cap);

  // 4-Blade Rotating Sail Assembly
  rotor.position.set(0, 10.6, 2.05);
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 1.2, 8),
    capMat
  );
  hub.rotation.x = Math.PI / 2;
  rotor.add(hub);

  const sparGeo = new THREE.BoxGeometry(0.24, 6.6, 0.22);
  sparGeo.translate(0, 3.3, 0);
  const sailGeo = new THREE.BoxGeometry(1.35, 5.4, 0.08);
  sailGeo.translate(0.68, 3.6, 0.06);

  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    const spar = new THREE.Mesh(sparGeo, towerWoodMat);
    const sail = new THREE.Mesh(sailGeo, sailCanvasMat);
    sail.rotation.y = 0.18;
    sail.castShadow = true;
    arm.add(spar, sail);
    rotor.add(arm);
  }

  group.add(rotor);
  return { group, rotor };
}

/**
 * 4. Composite Pit Lane Garage & Cantilevered Race Control Tower
 */
function createPitBuildingAndTower(weather: WeatherType): THREE.Group {
  const group = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.45,
    metalness: 0.25,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.55,
    metalness: 0.45,
  });
  const awningMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.35,
    metalness: 0.2,
  });
  const glassGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.75,
    roughness: 0.12,
    metalness: 0.9,
  });

  // Main Pit Garage Block
  const garage = new THREE.Mesh(
    new THREE.BoxGeometry(20.0, 4.4, 8.2),
    wallMat
  );
  garage.position.set(0, 2.0, 0);
  garage.castShadow = true;
  garage.receiveShadow = true;
  group.add(garage);

  // 3 Dark Recessed Pit Garage Bays + Awning
  for (let b = -1; b <= 1; b++) {
    const bay = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 3.0, 0.35),
      darkMetalMat
    );
    bay.position.set(b * 6.0, 1.5, 4.05);
    group.add(bay);
  }

  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(20.6, 0.45, 2.4),
    awningMat
  );
  awning.position.set(0, 3.5, 4.8);
  group.add(awning);

  // Second-Floor Hospitality Glass Lounge
  const lounge = new THREE.Mesh(
    new THREE.BoxGeometry(18.0, 2.6, 6.8),
    glassGlowMat
  );
  lounge.position.set(0, 5.4, -0.2);
  group.add(lounge);

  const roofCap = new THREE.Mesh(
    new THREE.BoxGeometry(19.2, 0.5, 7.6),
    darkMetalMat
  );
  roofCap.position.set(0, 6.9, -0.2);
  group.add(roofCap);

  // Cantilevered Race Control Tower on One End
  const towerCore = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 12.8, 5.2),
    darkMetalMat
  );
  towerCore.position.set(7.2, 6.4, -0.5);
  towerCore.castShadow = true;
  group.add(towerCore);

  const deckPod = new THREE.Mesh(
    new THREE.BoxGeometry(7.4, 2.4, 6.6),
    glassGlowMat
  );
  deckPod.position.set(6.8, 11.4, 0.4);
  deckPod.castShadow = true;
  group.add(deckPod);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.2, 4.5, 8),
    wallMat
  );
  mast.position.set(7.2, 14.8, -0.5);
  group.add(mast);

  if (weather === 'snow') {
    const snowCap = new THREE.Mesh(
      new THREE.BoxGeometry(7.6, 0.35, 6.8),
      wallMat
    );
    snowCap.position.set(6.8, 12.75, 0.4);
    group.add(snowCap);
  }

  return group;
}

/**
 * 5. Composite Alpine Timber Chalet (A-Frame Roof, Stone Chimney, Warm Glowing Cabin Windows)
 */
function createAlpineChalet(weather: WeatherType): THREE.Group {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.88,
    metalness: 0.08,
  });
  const cedarMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.75,
    metalness: 0.08,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: weather === 'snow' ? 0xf1f5f9 : 0x334155,
    roughness: 0.65,
    metalness: 0.1,
  });
  const warmWindowMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.15,
    roughness: 0.2,
  });

  // Stone Plinth Foundation
  const base = new THREE.Mesh(new THREE.BoxGeometry(8.6, 1.8, 9.6), stoneMat);
  base.position.y = 0.4;
  group.add(base);

  // Timber Cabin Walls
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(7.8, 4.4, 8.8), cedarMat);
  cabin.position.y = 3.2;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  group.add(cabin);

  // Steep Pitched A-Frame Roof
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-4.8, 0);
  roofShape.lineTo(0, 3.8);
  roofShape.lineTo(4.8, 0);
  roofShape.closePath();

  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth: 10.2,
    bevelEnabled: false,
  });
  roofGeo.translate(0, 0, -5.1);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 5.1;
  roof.castShadow = true;
  group.add(roof);

  // Stone Chimney Stack
  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 6.2, 1.3),
    stoneMat
  );
  chimney.position.set(2.8, 5.8, -1.5);
  chimney.castShadow = true;
  group.add(chimney);

  // Warm Glowing Chalet Windows
  const winGeo = new THREE.BoxGeometry(1.5, 1.3, 0.25);
  for (const wx of [-1.8, 1.8]) {
    const wFront = new THREE.Mesh(winGeo, warmWindowMat);
    wFront.position.set(wx, 3.2, 4.38);
    const wBack = new THREE.Mesh(winGeo, warmWindowMat);
    wBack.position.set(wx, 3.2, -4.38);
    group.add(wFront, wBack);
  }

  return group;
}

/**
 * 6. Composite Industrial Power Plant & Cooling Towers
 */
function createIndustrialPlant(weather: WeatherType): THREE.Group {
  const group = new THREE.Group();

  const steelHallMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.55,
    metalness: 0.5,
  });
  const concreteTowerMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.82,
    metalness: 0.1,
  });
  const hazardStripeMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    roughness: 0.45,
    metalness: 0.2,
  });
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.3,
  });

  // Main Turbine Hall
  const hall = new THREE.Mesh(
    new THREE.BoxGeometry(13.5, 6.2, 9.5),
    steelHallMat
  );
  hall.position.set(-2.2, 2.8, 0);
  hall.castShadow = true;
  hall.receiveShadow = true;
  group.add(hall);

  // Twin Tapered Cooling Towers / Smokestacks
  for (const tz of [-2.8, 2.8]) {
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 3.2, 11.5, 14),
      concreteTowerMat
    );
    tower.position.set(5.4, 5.5, tz);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.15, 0.8, 14),
      hazardStripeMat
    );
    rim.position.set(5.4, 10.9, tz);
    group.add(rim);
  }

  // Tall Flue Stack with Beacon
  const stack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.95, 15.5, 10),
    steelHallMat
  );
  stack.position.set(-6.2, 7.5, -2.5);
  stack.castShadow = true;
  group.add(stack);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 8, 8),
    beaconMat
  );
  beacon.position.set(-6.2, 15.4, -2.5);
  group.add(beacon);

  if (weather === 'snow') {
    const roofSnow = new THREE.Mesh(
      new THREE.BoxGeometry(13.6, 0.3, 9.6),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 })
    );
    roofSnow.position.set(-2.2, 6.0, 0);
    group.add(roofSnow);
  }

  return group;
}

/**
 * Builds the 400%-scale 3D Diorama Circuit:
 * - Sculpted 620x620 3D terrain table with distinct Biome Palettes, Mountains, Valley Dips, and Canyons
 * - Parametric 3D ribbon road with hills, banked corners, straightaway jump ramps, and red/white kerbs
 * - 3D Tunnel Portals, Arched Ribs, and glowing ceiling light strips
 * - Trackside Buildings, Farms, Spinning Windmills, Chalets, Industrial Plants, and Mega-Stadiums
 */
export function buildTrackDiorama(
  baked: BakedTrack,
  roadTexture: THREE.Texture,
  weather: WeatherType
): BuiltTrackScene {
  const group = new THREE.Group();
  const samples = baked.samples;
  const n = samples.length;
  const animatedRotors: THREE.Object3D[] = [];

  // 1. Sculpted 620x620 3D Terrain Table with Biome-Specific Palettes
  const terrainSize = 620;
  const terrainSegs = 136;
  const terrainGeo = new THREE.PlaneGeometry(
    terrainSize,
    terrainSize,
    terrainSegs,
    terrainSegs
  );
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  const terrainColors = new Float32Array(posAttr.count * 3);
  const queryOut: TrackSurfaceQueryResult = {
    closestIndex: 0,
    t: 0,
    groundY: 0,
    lateralDist: 0,
    normalizedLateral: 0,
    surface: 'grass',
    bankAngle: 0,
    tangentX: 0,
    tangentY: 0,
    tangentZ: 1,
    upX: 0,
    upY: 1,
    upZ: 0,
    onRoad: false,
    isTunnel: false,
  };

  const biome = baked.definition.biome;

  // Distinct Biome Palettes so every track looks visually unique even with randomized weather
  let grassColor = new THREE.Color(0x2e6f40);
  let hillRockColor = new THREE.Color(0x57534e);
  let snowPeakColor = new THREE.Color(0xf1f5f9);
  let shoulderDirtColor = new THREE.Color(0x78553a);
  let valleyColor = new THREE.Color(0x1e4628);

  if (biome === 'desert_canyon') {
    grassColor = new THREE.Color(0xc27838);
    hillRockColor = new THREE.Color(0x9a3412);
    snowPeakColor = new THREE.Color(0xfed7aa);
    shoulderDirtColor = new THREE.Color(0x92400e);
    valleyColor = new THREE.Color(0x78350f);
  } else if (biome === 'neon_stadium') {
    grassColor = new THREE.Color(0x1b4d44);
    hillRockColor = new THREE.Color(0x334155);
    snowPeakColor = new THREE.Color(0xcbd5e1);
    shoulderDirtColor = new THREE.Color(0x475569);
    valleyColor = new THREE.Color(0x0f2926);
  } else if (biome === 'alpine_glacier') {
    grassColor = new THREE.Color(0x94a3b8);
    hillRockColor = new THREE.Color(0x64748b);
    snowPeakColor = new THREE.Color(0xf8fafc);
    shoulderDirtColor = new THREE.Color(0xcbd5e1);
    valleyColor = new THREE.Color(0x7dd3fc);
  } else if (biome === 'industrial_gorge') {
    grassColor = new THREE.Color(0x4d5e28);
    hillRockColor = new THREE.Color(0x3f3f46);
    snowPeakColor = new THREE.Color(0xd4d4d8);
    shoulderDirtColor = new THREE.Color(0x57534e);
    valleyColor = new THREE.Color(0x273314);
  }

  if (weather === 'snow') {
    grassColor.lerp(new THREE.Color(0xdbeafe), 0.72);
    shoulderDirtColor.lerp(new THREE.Color(0xcbd5e1), 0.7);
    valleyColor.lerp(new THREE.Color(0xbfdbfe), 0.65);
  } else if (weather === 'rain') {
    grassColor.multiplyScalar(0.84);
    hillRockColor.multiplyScalar(0.82);
  }

  const mountains = baked.definition.mountains || [];

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    queryTrackSurface(vx, vz, baked, queryOut);

    let y = queryOut.groundY;
    if (queryOut.onRoad) {
      // Depress terrain slightly beneath road ribbon so road never Z-fights
      y -= 0.35;
    } else {
      const roadHalfW = baked.samples[queryOut.closestIndex].width * 0.5;
      const distFromEdge = Math.abs(queryOut.lateralDist) - roadHalfW;

      // Add sculpted mountain peaks outside the track corridor
      let mountainBoost = 0;
      for (const m of mountains) {
        const md = Math.hypot(vx - m.x, vz - m.z);
        if (md < m.radius) {
          const factor = 0.5 * (1 + Math.cos((Math.PI * md) / m.radius));
          mountainBoost = Math.max(mountainBoost, m.height * factor);
        }
      }

      // Smoothly mask mountain boost near open road (keep road clear; tunnel ribs cover tunnel road)
      const roadClearMask = THREE.MathUtils.smoothstep(distFromEdge, 2.5, 26.0);
      y += mountainBoost * roadClearMask;

      if (distFromEdge > 16) {
        const hillNoise =
          Math.sin(vx * 0.024) * Math.cos(vz * 0.024) * 3.8 +
          Math.max(0, (Math.hypot(vx, vz) - 235) * 0.22);
        y += hillNoise * roadClearMask;
      } else {
        y -= 0.18;
      }
    }
    posAttr.setY(i, y);

    let c = grassColor;
    if (y > 16.5) {
      c = snowPeakColor;
    } else if (y > 6.5) {
      c = hillRockColor;
    } else if (y < -1.0) {
      c = valleyColor;
    } else if (Math.abs(queryOut.normalizedLateral) < 1.45) {
      c = shoulderDirtColor;
    }

    terrainColors[i * 3] = c.r;
    terrainColors[i * 3 + 1] = c.g;
    terrainColors[i * 3 + 2] = c.b;
  }

  terrainGeo.setAttribute(
    'color',
    new THREE.BufferAttribute(terrainColors, 3)
  );
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: weather === 'rain' ? 0.55 : 0.88,
    metalness: 0.05,
    flatShading: true,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  // Diorama Table Pedestal Base
  const baseGeo = new THREE.BoxGeometry(terrainSize + 8, 12, terrainSize + 8);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    metalness: 0.2,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = -9.5;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Parametric 3D Road Ribbon Mesh + 3D Red/White Alternating Kerbs
  const roadVertices: number[] = [];
  const roadNormals: number[] = [];
  const roadUvs: number[] = [];
  const roadColors: number[] = [];
  const roadIndices: number[] = [];

  const kerbVertices: number[] = [];
  const kerbNormals: number[] = [];
  const kerbColors: number[] = [];
  const kerbIndices: number[] = [];

  const cAsphalt = new THREE.Color(weather === 'rain' ? 0x1e242d : 0x2c333f);
  const cDirt = new THREE.Color(
    biome === 'desert_canyon' ? 0xb45309 : 0x9a5b32
  );
  const cIce = new THREE.Color(0x93c5fd);
  const cBoost = new THREE.Color(0xf59e0b);
  const cJump = new THREE.Color(0x475569);

  const kerbRed = new THREE.Color(
    biome === 'neon_stadium'
      ? 0x06b6d4
      : biome === 'alpine_glacier'
        ? 0x2563eb
        : 0xe11d48
  );
  const kerbWhite = new THREE.Color(0xf8fafc);

  let runningDistance = 0;

  for (let i = 0; i <= n; i++) {
    const idx = i % n;
    const s = samples[idx];
    if (i > 0) {
      const prev = samples[(i - 1) % n];
      runningDistance += s.position.distanceTo(prev.position);
    }

    const hw = s.width * 0.5;
    const leftPt = s.position.clone().addScaledVector(s.right, -hw);
    const rightPt = s.position.clone().addScaledVector(s.right, hw);

    leftPt.y += 0.06;
    rightPt.y += 0.06;

    roadVertices.push(
      leftPt.x,
      leftPt.y,
      leftPt.z,
      rightPt.x,
      rightPt.y,
      rightPt.z
    );
    roadNormals.push(
      s.up.x,
      s.up.y,
      s.up.z,
      s.up.x,
      s.up.y,
      s.up.z
    );

    const vCoord = runningDistance * 0.12;
    roadUvs.push(0, vCoord, 1, vCoord);

    let surfCol = cAsphalt;
    if (s.surface === 'dirt') surfCol = cDirt;
    else if (s.surface === 'ice') surfCol = cIce;
    else if (s.surface === 'boost') surfCol = cBoost;
    else if (s.surface === 'jump_ramp') surfCol = cJump;

    roadColors.push(
      surfCol.r,
      surfCol.g,
      surfCol.b,
      surfCol.r,
      surfCol.g,
      surfCol.b
    );

    if (i < n) {
      const base = i * 2;
      roadIndices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }

    // Build 3D raised kerbs on corners
    if (i < n) {
      const nextS = samples[(i + 1) % n];
      const kerbCol = Math.floor(i / 3) % 2 === 0 ? kerbRed : kerbWhite;

      const addKerbSegment = (sideSign: number) => {
        const kInner0 = s.position
          .clone()
          .addScaledVector(s.right, sideSign * (hw - 0.15));
        const kOuter0 = s.position
          .clone()
          .addScaledVector(s.right, sideSign * (hw + 0.75));
        const kInner1 = nextS.position
          .clone()
          .addScaledVector(nextS.right, sideSign * (nextS.width * 0.5 - 0.15));
        const kOuter1 = nextS.position
          .clone()
          .addScaledVector(nextS.right, sideSign * (nextS.width * 0.5 + 0.75));

        kInner0.y += 0.15;
        kOuter0.y += 0.20;
        kInner1.y += 0.15;
        kOuter1.y += 0.20;

        const vStart = kerbVertices.length / 3;
        kerbVertices.push(
          kInner0.x,
          kInner0.y,
          kInner0.z,
          kOuter0.x,
          kOuter0.y,
          kOuter0.z,
          kInner1.x,
          kInner1.y,
          kInner1.z,
          kOuter1.x,
          kOuter1.y,
          kOuter1.z
        );
        for (let k = 0; k < 4; k++) {
          kerbNormals.push(s.up.x, s.up.y, s.up.z);
          kerbColors.push(kerbCol.r, kerbCol.g, kerbCol.b);
        }
        if (sideSign > 0) {
          kerbIndices.push(
            vStart,
            vStart + 1,
            vStart + 2,
            vStart + 1,
            vStart + 3,
            vStart + 2
          );
        } else {
          kerbIndices.push(
            vStart,
            vStart + 2,
            vStart + 1,
            vStart + 1,
            vStart + 2,
            vStart + 3
          );
        }
      };

      if (s.kerbLeft) addKerbSegment(-1);
      if (s.kerbRight) addKerbSegment(1);
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(roadVertices, 3)
  );
  roadGeo.setAttribute(
    'normal',
    new THREE.Float32BufferAttribute(roadNormals, 3)
  );
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeo.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(roadColors, 3)
  );
  roadGeo.setIndex(roadIndices);

  const roadMaterial = new THREE.MeshStandardMaterial({
    map: roadTexture,
    vertexColors: true,
    roughness: weather === 'rain' ? 0.18 : weather === 'snow' ? 0.65 : 0.72,
    metalness: weather === 'rain' ? 0.45 : 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const roadMesh = new THREE.Mesh(roadGeo, roadMaterial);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  if (kerbVertices.length > 0) {
    const kerbGeo = new THREE.BufferGeometry();
    kerbGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(kerbVertices, 3)
    );
    kerbGeo.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(kerbNormals, 3)
    );
    kerbGeo.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(kerbColors, 3)
    );
    kerbGeo.setIndex(kerbIndices);

    const kerbMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.5,
      metalness: 0.1,
    });
    const kerbMesh = new THREE.Mesh(kerbGeo, kerbMat);
    kerbMesh.receiveShadow = true;
    kerbMesh.castShadow = true;
    group.add(kerbMesh);
  }

  // 3. 3D Mountain Tunnels & Cutaway Arch Ribs (GeneRally / Pro-Am Style)
  const tunnelWallMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.65,
    metalness: 0.25,
  });
  const tunnelCapMat = new THREE.MeshStandardMaterial({
    color:
      weather === 'snow' || biome === 'alpine_glacier'
        ? 0x94a3b8
        : biome === 'desert_canyon'
          ? 0x9a4e24
          : 0x475569,
    roughness: 0.8,
    metalness: 0.1,
    flatShading: true,
  });
  const tunnelLightMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });

  for (let i = 0; i < n; i++) {
    const s = samples[i];
    if (!s.isTunnel) continue;

    const prevS = samples[(i - 1 + n) % n];
    const nextS = samples[(i + 1) % n];
    const isPortalStart = !prevS.isTunnel;
    const isPortalEnd = !nextS.isTunnel;

    // Place a structural tunnel arch rib every 10 samples or at portal entrances/exits
    if (isPortalStart || isPortalEnd || i % 10 === 0) {
      const archGroup = new THREE.Group();
      archGroup.position.copy(s.position);
      const yaw = Math.atan2(s.tangent.x, s.tangent.z);
      archGroup.rotation.y = yaw;

      const spanHalf = s.width * 0.5 + 1.1;
      const archHeight = isPortalStart || isPortalEnd ? 6.8 : 5.8;
      const depth = isPortalStart || isPortalEnd ? 2.4 : 1.5;

      // Left & Right Tunnel Wall Pillars
      const wallGeo = new THREE.BoxGeometry(1.4, archHeight, depth);
      const leftWall = new THREE.Mesh(wallGeo, tunnelWallMat);
      leftWall.position.set(-spanHalf, archHeight * 0.5, 0);
      leftWall.castShadow = true;
      leftWall.receiveShadow = true;

      const rightWall = new THREE.Mesh(wallGeo, tunnelWallMat);
      rightWall.position.set(spanHalf, archHeight * 0.5, 0);
      rightWall.castShadow = true;
      rightWall.receiveShadow = true;

      // Overhead Mountain Rock / Concrete Arch Beam
      const roofGeo = new THREE.BoxGeometry(
        spanHalf * 2 + 2.4,
        isPortalStart || isPortalEnd ? 2.2 : 1.3,
        depth
      );
      const roofMesh = new THREE.Mesh(roofGeo, tunnelCapMat);
      roofMesh.position.set(0, archHeight + 0.5, 0);
      roofMesh.castShadow = true;
      roofMesh.receiveShadow = true;

      // Glowing Amber Tunnel Ceiling Light Strip
      const lightGeo = new THREE.BoxGeometry(spanHalf * 1.3, 0.22, depth * 0.8);
      const lightMesh = new THREE.Mesh(lightGeo, tunnelLightMat);
      lightMesh.position.set(0, archHeight - 0.2, 0);

      archGroup.add(leftWall, rightWall, roofMesh, lightMesh);
      group.add(archGroup);
    }
  }

  // 4. Start / Finish Gantry & 3D Countdown Lights
  const startSample = samples[0];
  const gantryGroup = new THREE.Group();
  gantryGroup.position.copy(startSample.position);
  const startYaw = Math.atan2(startSample.tangent.x, startSample.tangent.z);
  gantryGroup.rotation.y = startYaw;

  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.35,
    metalness: 0.6,
  });
  const bannerMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
    metalness: 0.3,
  });

  const halfW = startSample.width * 0.5 + 1.2;
  const pillarGeo = new THREE.CylinderGeometry(0.32, 0.38, 6.6, 10);
  const pLeft = new THREE.Mesh(pillarGeo, pillarMat);
  pLeft.position.set(-halfW, 3.3, 0);
  pLeft.castShadow = true;
  const pRight = new THREE.Mesh(pillarGeo, pillarMat);
  pRight.position.set(halfW, 3.3, 0);
  pRight.castShadow = true;

  const crossbarGeo = new THREE.BoxGeometry(halfW * 2 + 1.0, 1.2, 0.7);
  const crossbar = new THREE.Mesh(crossbarGeo, bannerMat);
  crossbar.position.set(0, 6.0, 0);
  crossbar.castShadow = true;

  // Checkered Finish Strip on Track
  const checkerGeo = new THREE.PlaneGeometry(startSample.width, 2.6);
  checkerGeo.rotateX(-Math.PI / 2);
  const checkerCanvas = document.createElement('canvas');
  checkerCanvas.width = 256;
  checkerCanvas.height = 64;
  const cCtx = checkerCanvas.getContext('2d')!;
  for (let cx = 0; cx < 16; cx++) {
    for (let cy = 0; cy < 4; cy++) {
      cCtx.fillStyle = (cx + cy) % 2 === 0 ? '#ffffff' : '#0f172a';
      cCtx.fillRect(cx * 16, cy * 16, 16, 16);
    }
  }
  const checkerTex = new THREE.CanvasTexture(checkerCanvas);
  checkerTex.colorSpace = THREE.SRGBColorSpace;
  const checkerMat = new THREE.MeshBasicMaterial({
    map: checkerTex,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const checkerStrip = new THREE.Mesh(checkerGeo, checkerMat);
  checkerStrip.position.set(0, 0.1, 0);

  const gantryLights: THREE.Mesh[] = [];
  const lightSphereGeo = new THREE.SphereGeometry(0.35, 12, 12);
  for (let li = 0; li < 3; li++) {
    const lMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      emissive: 0x000000,
      emissiveIntensity: 1,
      roughness: 0.2,
    });
    const lMesh = new THREE.Mesh(lightSphereGeo, lMat);
    lMesh.position.set((li - 1) * 1.5, 6.0, -0.4);
    gantryGroup.add(lMesh);
    gantryLights.push(lMesh);
  }

  gantryGroup.add(pLeft, pRight, crossbar, checkerStrip);
  group.add(gantryGroup);

  const placedLandmarkPositions: Array<{ x: number; z: number; radius: number }> = [];

  const findNearestOpenSampleIndex = (wx: number, wz: number): { index: number; sideSign: number } => {
    queryTrackSurface(wx, wz, baked, queryOut);
    let idx = queryOut.closestIndex;
    const sideSign = queryOut.lateralDist >= 0 ? 1 : -1;
    if (samples[idx].isTunnel) {
      for (let offset = 1; offset < n / 2; offset++) {
        const fwd = (idx + offset) % n;
        if (!samples[fwd].isTunnel) {
          idx = fwd;
          break;
        }
        const bwd = (idx - offset + n) % n;
        if (!samples[bwd].isTunnel) {
          idx = bwd;
          break;
        }
      }
    }
    return { index: idx, sideSign };
  };

  /**
   * Verifies that all 9 points of a structure's oriented 3D bounding box (center, 4 corners, 4 edge midpoints)
   * stay strictly clear of ALL road segments and kerbs across the entire track (including curved corners).
   * Automatically steps outward or flips to the outside of a tight curve if needed.
   */
  const resolveSafeTracksidePlacement = (
    sampleIdx: number,
    preferredSideSign: number,
    baseOffsetFromEdge: number,
    halfWidthX: number,
    frontExtentZ: number,
    backExtentZ: number,
    minClearanceFromRoadEdge: number
  ): { x: number; z: number; groundY: number; rotY: number; sideSign: number } | null => {
    const s = samples[sampleIdx];
    const roadHalfW = s.width * 0.5;

    for (const sideTry of [preferredSideSign, -preferredSideSign]) {
      const rotY = Math.atan2(-s.right.x * sideTry, -s.right.z * sideTry);
      const cosR = Math.cos(rotY);
      const sinR = Math.sin(rotY);

      for (let extraPush = 0; extraPush <= 16; extraPush += 1.5) {
        const dist = roadHalfW + baseOffsetFromEdge + extraPush;
        const cx = s.position.x + s.right.x * sideTry * dist;
        const cz = s.position.z + s.right.z * sideTry * dist;

        let allCornersClear = true;
        const localXs = [-halfWidthX, -halfWidthX * 0.5, 0, halfWidthX * 0.5, halfWidthX];
        const localZs = [frontExtentZ, (frontExtentZ - backExtentZ) * 0.5, -backExtentZ];

        for (let ix = 0; ix < 5 && allCornersClear; ix++) {
          for (let iz = 0; iz < 3; iz++) {
            const lx = localXs[ix];
            const lz = localZs[iz];
            const wx = cx + lx * cosR + lz * sinR;
            const wz = cz - lx * sinR + lz * cosR;
            queryTrackSurface(wx, wz, baked, queryOut);
            const nearestS = samples[queryOut.closestIndex];
            const requiredDist = nearestS.width * 0.5 + minClearanceFromRoadEdge;
            if (Math.abs(queryOut.lateralDist) < requiredDist) {
              allCornersClear = false;
              break;
            }
          }
        }

        if (allCornersClear) {
          queryTrackSurface(cx, cz, baked, queryOut);
          return {
            x: cx,
            z: cz,
            groundY: Math.min(s.position.y, queryOut.groundY),
            rotY,
            sideSign: sideTry,
          };
        }
      }
    }
    return null;
  };

  // 5. Composite Stadium Grandstands (Snapped Close to Track Verge with Full Corner Clearance)
  for (const gs of baked.definition.grandstands) {
    const { index: gsSampleIdx, sideSign } = findNearestOpenSampleIndex(gs.x, gs.z);
    const placement = resolveSafeTracksidePlacement(
      gsSampleIdx,
      sideSign,
      5.5,
      9.8,
      1.2,
      4.5,
      4.2
    );
    if (!placement) continue;

    const gsGroup = new THREE.Group();
    gsGroup.position.set(placement.x, placement.groundY, placement.z);
    gsGroup.rotation.y = placement.rotY;
    placedLandmarkPositions.push({ x: placement.x, z: placement.z, radius: 14.5 });

    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
    });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: biome === 'neon_stadium' ? 0x06b6d4 : 0xe11d48,
      roughness: 0.4,
    });

    for (let tier = 0; tier < 3; tier++) {
      const tierGeo = new THREE.BoxGeometry(18, 0.9, 1.8);
      const tierMesh = new THREE.Mesh(tierGeo, stepMat);
      tierMesh.position.set(0, 0.45 + tier * 0.9, -tier * 1.4);
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      gsGroup.add(tierMesh);
    }

    const roofGeo = new THREE.BoxGeometry(19.0, 0.35, 5.6);
    const roofMesh = new THREE.Mesh(roofGeo, canopyMat);
    roofMesh.position.set(0, 4.8, -1.4);
    roofMesh.rotation.x = 0.18;
    roofMesh.castShadow = true;
    gsGroup.add(roofMesh);

    group.add(gsGroup);
  }

  // 5B. Trackside Aesthetic Landmarks (Buildings, Farms, Spinning Windmills, Stadiums, Chalets & Plants)
  // Placed right beside the trackside shoulder while guaranteeing all 4 corners clear curved road sections!
  const baseSceneryProps = [...(baked.definition.sceneryProps || [])];

  const biomeLandmarkCycle: Array<
    'stadium' | 'farm' | 'windmill' | 'pit_building' | 'alpine_chalet' | 'industrial_plant' | 'modern_turbine'
  > =
    biome === 'forest_valley'
      ? ['farm', 'windmill', 'alpine_chalet', 'stadium', 'farm', 'windmill', 'pit_building']
      : biome === 'neon_stadium'
        ? ['stadium', 'pit_building', 'modern_turbine', 'industrial_plant', 'stadium', 'pit_building']
        : biome === 'desert_canyon'
          ? ['windmill', 'farm', 'industrial_plant', 'stadium', 'windmill', 'farm', 'pit_building']
          : biome === 'alpine_glacier'
            ? ['alpine_chalet', 'modern_turbine', 'stadium', 'pit_building', 'alpine_chalet', 'windmill']
            : ['industrial_plant', 'modern_turbine', 'stadium', 'pit_building', 'industrial_plant', 'windmill'];

  const stepInterval = Math.max(42, Math.floor(n / 18));
  let cycleIdx = 0;
  for (let i = 28; i < n - 24; i += stepInterval) {
    const s = samples[i];
    if (s.isTunnel) continue;
    const sideSign = cycleIdx % 2 === 0 ? 1 : -1;
    const probeX = s.position.x + s.right.x * sideSign * (s.width * 0.5 + 8.0);
    const probeZ = s.position.z + s.right.z * sideSign * (s.width * 0.5 + 8.0);
    const propType = biomeLandmarkCycle[cycleIdx % biomeLandmarkCycle.length];
    cycleIdx++;
    baseSceneryProps.push({
      type: propType,
      x: probeX,
      z: probeZ,
      rotationY: 0,
      scale: 0.96,
    });
  }

  for (const prop of baseSceneryProps) {
    const { index: nearestIdx, sideSign } = findNearestOpenSampleIndex(prop.x, prop.z);
    const propScale = prop.scale ?? 1.0;

    // Bounding-box extents in local space (+Z is facing the road, -Z is away from the road)
    const footprint =
      prop.type === 'stadium'
        ? { baseOffset: 6.4, halfW: 13.0, frontZ: 2.1, backZ: 8.2 }
        : prop.type === 'windmill' || prop.type === 'modern_turbine'
          ? { baseOffset: 5.5, halfW: 4.2, frontZ: 3.6, backZ: 3.6 }
          : prop.type === 'alpine_chalet'
            ? { baseOffset: 7.8, halfW: 5.0, frontZ: 4.8, backZ: 5.2 }
            : prop.type === 'industrial_plant'
              ? { baseOffset: 8.4, halfW: 9.2, frontZ: 5.0, backZ: 6.0 }
              : prop.type === 'pit_building'
                ? { baseOffset: 9.2, halfW: 10.5, frontZ: 6.2, backZ: 5.5 }
                : { baseOffset: 9.6, halfW: 9.2, frontZ: 6.6, backZ: 7.0 }; // farm

    const placement = resolveSafeTracksidePlacement(
      nearestIdx,
      sideSign,
      footprint.baseOffset * propScale,
      footprint.halfW * propScale,
      footprint.frontZ * propScale,
      footprint.backZ * propScale,
      3.8
    );
    if (!placement) continue;

    // Avoid overlapping another landmark already placed right next to this spot
    let tooClose = false;
    for (const placed of placedLandmarkPositions) {
      const dx = placement.x - placed.x;
      const dz = placement.z - placed.z;
      if (dx * dx + dz * dz < 21 * 21) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    let propObj: THREE.Group;
    if (prop.type === 'stadium') {
      propObj = createMegaStadium(weather);
    } else if (prop.type === 'farm') {
      propObj = createFarmComplex(weather);
    } else if (prop.type === 'windmill' || prop.type === 'modern_turbine') {
      const wm = createWindmill(weather, prop.type === 'modern_turbine');
      propObj = wm.group;
      animatedRotors.push(wm.rotor);
    } else if (prop.type === 'pit_building') {
      propObj = createPitBuildingAndTower(weather);
    } else if (prop.type === 'alpine_chalet') {
      propObj = createAlpineChalet(weather);
    } else {
      propObj = createIndustrialPlant(weather);
    }

    propObj.position.set(placement.x, placement.groundY - 0.08, placement.z);
    propObj.rotation.y = placement.rotY;
    if (prop.scale) {
      propObj.scale.setScalar(prop.scale);
    }
    group.add(propObj);
    placedLandmarkPositions.push({
      x: placement.x,
      z: placement.z,
      radius: Math.max(13.5, footprint.halfW + 2.5) * propScale,
    });
  }

  // 6. InstancedMesh Low-Poly Pine Trees & Boulders Across the 400%-Scale Diorama
  const treeCount = 340;
  const trunkGeo = new THREE.CylinderGeometry(0.24, 0.36, 1.5, 7);
  trunkGeo.translate(0, 0.75, 0);
  const foliageGeo = new THREE.ConeGeometry(1.55, 4.2, 7);
  foliageGeo.translate(0, 2.9, 0);

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    roughness: 0.9,
  });
  const foliageMat = new THREE.MeshStandardMaterial({
    color:
      weather === 'snow' || biome === 'alpine_glacier'
        ? 0xbfdbfe
        : biome === 'desert_canyon'
          ? 0x4d7c0f
          : 0x166534,
    roughness: 0.75,
    flatShading: true,
  });

  const instTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const instFoliage = new THREE.InstancedMesh(
    foliageGeo,
    foliageMat,
    treeCount
  );
  instTrunks.castShadow = true;
  instFoliage.castShadow = true;
  instFoliage.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const tintColor = new THREE.Color();
  let placedTrees = 0;
  let seed = baked.definition.scenerySeed;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let attempt = 0; attempt < 1400 && placedTrees < treeCount; attempt++) {
    const tx = (rand() - 0.5) * 540;
    const tz = (rand() - 0.5) * 480;
    queryTrackSurface(tx, tz, baked, queryOut);

    if (Math.abs(queryOut.normalizedLateral) > 1.55) {
      let insideLandmark = false;
      for (const lm of placedLandmarkPositions) {
        const dx = tx - lm.x;
        const dz = tz - lm.z;
        if (dx * dx + dz * dz < lm.radius * lm.radius) {
          insideLandmark = true;
          break;
        }
      }
      if (insideLandmark) continue;

      const scale = 0.85 + rand() * 0.85;
      dummy.position.set(tx, queryOut.groundY - 0.1, tz);
      dummy.rotation.set(0, rand() * Math.PI * 2, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();

      instTrunks.setMatrixAt(placedTrees, dummy.matrix);
      instFoliage.setMatrixAt(placedTrees, dummy.matrix);

      if (weather === 'snow' || biome === 'alpine_glacier') {
        tintColor.setHSL(0.58, 0.35, 0.75 + (rand() - 0.5) * 0.15);
      } else if (biome === 'desert_canyon') {
        tintColor.setHSL(0.24 + (rand() - 0.5) * 0.06, 0.48, 0.32 + (rand() - 0.5) * 0.08);
      } else if (biome === 'industrial_gorge') {
        tintColor.setHSL(0.14 + (rand() - 0.5) * 0.08, 0.55, 0.28 + (rand() - 0.5) * 0.08);
      } else {
        tintColor.setHSL(
          0.36 + (rand() - 0.5) * 0.05,
          0.58,
          0.26 + (rand() - 0.5) * 0.08
        );
      }
      instFoliage.setColorAt(placedTrees, tintColor);
      placedTrees++;
    }
  }

  instTrunks.count = placedTrees;
  instFoliage.count = placedTrees;
  instTrunks.instanceMatrix.needsUpdate = true;
  instFoliage.instanceMatrix.needsUpdate = true;
  if (instFoliage.instanceColor) instFoliage.instanceColor.needsUpdate = true;
  instTrunks.computeBoundingSphere();
  instFoliage.computeBoundingSphere();
  group.add(instTrunks, instFoliage);

  // 7. Static Track Hazards (Rough Ground Rubble Patches, Mud Pits & Water Puddles)
  const staticHazards: BuiltTrackScene['staticHazards'] = [];
  const rubbleBumpGeo = new THREE.DodecahedronGeometry(0.42, 0);
  const rubbleBumpMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.92,
    metalness: 0.05,
    flatShading: true,
  });
  const roughBorderMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });

  for (const h of baked.definition.hazards) {
    const sIdx = Math.floor(h.t * n) % n;
    const s = samples[sIdx];
    const worldPos = s.position
      .clone()
      .addScaledVector(s.right, h.lateralOffset * s.width * 0.5);
    worldPos.y += 0.09;

    const hazardGroup = new THREE.Group();
    hazardGroup.position.copy(worldPos);
    const slopeQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      s.up
    );
    hazardGroup.quaternion.copy(slopeQuat);

    const puddleGeo = new THREE.CircleGeometry(
      h.radius,
      h.type === 'rough_ground' ? 11 : 20
    );
    puddleGeo.rotateX(-Math.PI / 2);
    const puddleMat = new THREE.MeshStandardMaterial({
      color:
        h.type === 'rough_ground'
          ? 0x92400e
          : h.type === 'mud_pit'
            ? 0x451a03
            : 0x0284c7,
      roughness:
        h.type === 'rough_ground'
          ? 0.95
          : h.type === 'mud_pit'
            ? 0.65
            : 0.08,
      metalness: h.type === 'water_puddle' ? 0.85 : 0.08,
      flatShading: h.type === 'rough_ground',
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const puddleMesh = new THREE.Mesh(puddleGeo, puddleMat);
    hazardGroup.add(puddleMesh);

    if (h.type === 'rough_ground') {
      // High-visibility dashed/ringed warning border + 3D low-poly rock bumps
      const ringGeo = new THREE.RingGeometry(h.radius * 0.86, h.radius, 11);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMesh = new THREE.Mesh(ringGeo, roughBorderMat);
      ringMesh.position.y = 0.02;
      hazardGroup.add(ringMesh);

      for (let b = 0; b < 7; b++) {
        const angle = (b / 7) * Math.PI * 2 + h.t * 12.0;
        const dist = (b % 2 === 0 ? 0.32 : 0.62) * h.radius;
        const bump = new THREE.Mesh(rubbleBumpGeo, rubbleBumpMat);
        bump.position.set(
          Math.cos(angle) * dist,
          0.12,
          Math.sin(angle) * dist
        );
        bump.scale.set(1.25, 0.55, 1.15);
        bump.rotation.y = angle;
        bump.castShadow = true;
        hazardGroup.add(bump);
      }
    }

    group.add(hazardGroup);

    staticHazards.push({
      worldPos: worldPos.clone(),
      radius: h.radius,
      type: h.type,
    });
  }

  return {
    group,
    roadMaterial,
    gantryLights,
    animatedRotors,
    staticHazards,
  };
}
