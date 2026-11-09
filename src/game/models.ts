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
  staticHazards: { worldPos: THREE.Vector3; radius: number; type: 'mud_pit' | 'water_puddle' }[];
}

/**
 * Builds the 400%-scale 3D Diorama Circuit:
 * - Sculpted 620x620 3D terrain table with Mountains, Valley Dips, and Canyons
 * - Parametric 3D ribbon road with hills, banked corners, straightaway jump ramps, and red/white kerbs
 * - 3D Tunnel Portals, Arched Ribs, and glowing ceiling light strips
 * - Starting gantry with 3D countdown lights, grandstands, and InstancedMesh forest + boulders
 */
export function buildTrackDiorama(
  baked: BakedTrack,
  roadTexture: THREE.Texture,
  weather: WeatherType
): BuiltTrackScene {
  const group = new THREE.Group();
  const samples = baked.samples;
  const n = samples.length;

  // 1. Sculpted 620x620 3D Terrain Table with Mountains & Valley Basins
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

  const isDesert = baked.definition.id === 'ironman_baja';
  const grassColor =
    weather === 'snow'
      ? new THREE.Color(0xdbeafe)
      : isDesert
        ? new THREE.Color(0xb47b44)
        : weather === 'rain'
          ? new THREE.Color(0x245634)
          : new THREE.Color(0x2e6f40);
  const hillRockColor =
    weather === 'snow'
      ? new THREE.Color(0x94a3b8)
      : isDesert
        ? new THREE.Color(0x9a4e24)
        : new THREE.Color(0x57534e);
  const snowPeakColor = new THREE.Color(0xf1f5f9);
  const shoulderDirtColor =
    weather === 'snow'
      ? new THREE.Color(0xcbd5e1)
      : new THREE.Color(0x78553a);
  const valleyColor =
    weather === 'snow'
      ? new THREE.Color(0xbfdbfe)
      : isDesert
        ? new THREE.Color(0x854d0e)
        : new THREE.Color(0x1e4628);

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
  const cDirt = new THREE.Color(0x9a5b32);
  const cIce = new THREE.Color(0x93c5fd);
  const cBoost = new THREE.Color(0xf59e0b);
  const cJump = new THREE.Color(0x475569);

  const kerbRed = new THREE.Color(0xe11d48);
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
    color: weather === 'snow' ? 0x94a3b8 : isDesert ? 0x9a4e24 : 0x475569,
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

  // 5. Composite Stadium Grandstands
  for (const gs of baked.definition.grandstands) {
    const gsGroup = new THREE.Group();
    queryTrackSurface(gs.x, gs.z, baked, queryOut);
    gsGroup.position.set(gs.x, queryOut.groundY, gs.z);
    gsGroup.rotation.y = gs.rotationY;

    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
    });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      roughness: 0.4,
    });

    for (let tier = 0; tier < 3; tier++) {
      const tierGeo = new THREE.BoxGeometry(22, 0.9, 1.8);
      const tierMesh = new THREE.Mesh(tierGeo, stepMat);
      tierMesh.position.set(0, 0.45 + tier * 0.9, -tier * 1.4);
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      gsGroup.add(tierMesh);
    }

    const roofGeo = new THREE.BoxGeometry(23.0, 0.35, 5.6);
    const roofMesh = new THREE.Mesh(roofGeo, canopyMat);
    roofMesh.position.set(0, 4.8, -1.4);
    roofMesh.rotation.x = 0.18;
    roofMesh.castShadow = true;
    gsGroup.add(roofMesh);

    group.add(gsGroup);
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
    color: weather === 'snow' ? 0xbfdbfe : 0x166534,
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

  for (let attempt = 0; attempt < 1200 && placedTrees < treeCount; attempt++) {
    const tx = (rand() - 0.5) * 540;
    const tz = (rand() - 0.5) * 480;
    queryTrackSurface(tx, tz, baked, queryOut);

    if (Math.abs(queryOut.normalizedLateral) > 1.85) {
      const scale = 0.85 + rand() * 0.85;
      dummy.position.set(tx, queryOut.groundY - 0.1, tz);
      dummy.rotation.set(0, rand() * Math.PI * 2, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();

      instTrunks.setMatrixAt(placedTrees, dummy.matrix);
      instFoliage.setMatrixAt(placedTrees, dummy.matrix);

      if (weather === 'snow') {
        tintColor.setHSL(0.58, 0.35, 0.75 + (rand() - 0.5) * 0.15);
      } else if (isDesert) {
        tintColor.setHSL(0.28 + (rand() - 0.5) * 0.05, 0.45, 0.32 + (rand() - 0.5) * 0.08);
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

  // 7. Static Track Hazards (Mud Pits & Water Puddles)
  const staticHazards: BuiltTrackScene['staticHazards'] = [];

  for (const h of baked.definition.hazards) {
    const sIdx = Math.floor(h.t * n) % n;
    const s = samples[sIdx];
    const worldPos = s.position
      .clone()
      .addScaledVector(s.right, h.lateralOffset * s.width * 0.5);
    worldPos.y += 0.09;

    const puddleGeo = new THREE.CircleGeometry(h.radius, 20);
    puddleGeo.rotateX(-Math.PI / 2);
    const puddleMat = new THREE.MeshStandardMaterial({
      color: h.type === 'mud_pit' ? 0x451a03 : 0x0284c7,
      roughness: h.type === 'mud_pit' ? 0.65 : 0.08,
      metalness: h.type === 'mud_pit' ? 0.1 : 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const puddleMesh = new THREE.Mesh(puddleGeo, puddleMat);
    puddleMesh.position.copy(worldPos);
    const slopeQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      s.up
    );
    puddleMesh.quaternion.copy(slopeQuat);
    group.add(puddleMesh);

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
    staticHazards,
  };
}
