import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ====== EDIT THESE ======
const HAIR_STYLE: string = "highTop";
const SKIN = "#8a5a3c";
const SKIN_DARK = "#855639";
const HAIR = "#0d0a09";
const FADE = "#3b2b23";
const HEAD_UP = 0.07;
const HEAD_FWD = 0.02;
const SKY = "linear-gradient(#5db8f5, #d4eefc)";
const GROUND = "#4caf50";
// ========================

const SEGS = [
  { from: 0, to: 120, name: "walk" },
  { from: 120, to: 210, name: "headShake" },
  { from: 210, to: 300, name: "sad_pose" },
];

const Loading: React.FC = () => {
  const [handle] = useState(() => delayRender("loading model"));
  useEffect(() => () => continueRender(handle), [handle]);
  return null;
};

const Cam: React.FC = () => {
  const { camera } = useThree();
  camera.position.set(0, 1.7, 1.6);
  camera.lookAt(0, 1.62, 0);
  return null;
};

let seed = 7;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

type Map3 = (d: THREE.Vector3) => THREE.Vector3;

const makeCurls = (pts: THREE.Vector3[], rMin: number, rMax: number, color: string) => {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true });
  const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), mat, pts.length);
  const m = new THREE.Matrix4();
  const id = new THREE.Quaternion();
  pts.forEach((p, i) => {
    const r = rMin + rand() * (rMax - rMin);
    m.compose(p, id, new THREE.Vector3(r, r, r));
    inst.setMatrixAt(i, m);
  });
  inst.castShadow = true;
  inst.frustumCulled = false;
  return inst;
};

const capPoints = (n: number, thMax: number, f: Map3) => {
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const cosT = 1 - rand() * (1 - Math.cos(thMax));
    const sinT = Math.sqrt(1 - cosT * cosT);
    const ph = rand() * Math.PI * 2;
    out.push(f(new THREE.Vector3(sinT * Math.cos(ph), cosT, sinT * Math.sin(ph))));
  }
  return out;
};

const dome = (f: Map3, th: number, color: string) => {
  const geo = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, th);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const q = f(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
    pos.setXYZ(i, q.x, q.y, q.z);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
};

const fadeBand = () => {
  const pts: THREE.Vector3[] = [];
  while (pts.length < 700) {
    const y = rand() * 2 - 1;
    const r = Math.sqrt(1 - y * y);
    const ph = rand() * Math.PI * 2;
    const d = new THREE.Vector3(r * Math.cos(ph), y, r * Math.sin(ph));
    if (d.y < -0.31 || d.y > 0.45 || d.z > 0.35) continue;
    pts.push(new THREE.Vector3(d.x * 0.09, d.y * 0.112, d.z * 0.108));
  }
  return makeCurls(pts, 0.007, 0.011, FADE);
};

const buildHigh = (g: THREE.Group) => {
  const f: Map3 = (d) =>
    new THREE.Vector3(d.x * 0.125, 0.025 + d.y * 0.165, d.z * (d.z > 0 ? 0.108 : 0.135));
  const fj: Map3 = (d) => f(d).add(d.clone().multiplyScalar(rand() * 0.014 - 0.004));
  const th = 1.449;
  g.add(dome((d) => f(d).multiplyScalar(0.96), th, HAIR));
  g.add(makeCurls(capPoints(1500, th, fj), 0.017, 0.026, HAIR));
  g.add(fadeBand());
};

const buildLow = (g: THREE.Group) => {
  const f: Map3 = (d) =>
    new THREE.Vector3(d.x * 0.088, 0.005 + d.y * 0.115, d.z * (d.z > 0 ? 0.1 : 0.105));
  const fj: Map3 = (d) => f(d).add(d.clone().multiplyScalar(rand() * 0.006));
  const th = 1.26;
  g.add(dome(f, th, HAIR));
  g.add(makeCurls(capPoints(1400, th, fj), 0.007, 0.011, HAIR));
  g.add(fadeBand());
};

const buildPuff = (g: THREE.Group) => {
  const f: Map3 = (d) =>
    new THREE.Vector3(d.x * 0.088, 0.005 + d.y * 0.115, d.z * (d.z > 0 ? 0.1 : 0.105));
  g.add(dome(f, 1.2, HAIR));
  const c = new THREE.Vector3(0, 0.15, -0.045);
  const mat = new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.85 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.088, 24, 16), mat);
  ball.position.copy(c);
  ball.castShadow = true;
  g.add(ball);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 500; i++) {
    const y = rand() * 2 - 1;
    const r = Math.sqrt(1 - y * y);
    const ph = rand() * Math.PI * 2;
    const v = new THREE.Vector3(r * Math.cos(ph), y, r * Math.sin(ph));
    pts.push(v.multiplyScalar(0.098 + rand() * 0.012).add(c));
  }
  g.add(makeCurls(pts, 0.014, 0.022, HAIR));
};

const buildHair = (style: string) => {
  seed = 7;
  const g = new THREE.Group();
  if (style === "lowBrush") buildLow(g);
  else if (style === "puff") buildPuff(g);
  else buildHigh(g);
  return g;
};


const Actor: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const gltf = useGLTF(staticFile("Xbot.glb"));
  const rig = useMemo(() => {
    const paint = (m: any, meshName: string) => {
      const c = m.clone();
      c.map = null;
      const n = (meshName + " " + (m.name || "")).toLowerCase();
      c.color.set(n.includes("joint") ? SKIN_DARK : SKIN);
      c.roughness = 0.6;
      c.metalness = 0;
      return c;
    };
    const old: THREE.Object3D[] = [];
    gltf.scene.traverse((o) => {
      if (o.name === "silhouetteHead") old.push(o);
    });
    old.forEach((o) => o.removeFromParent());
    gltf.scene.position.set(0, 0, 0);
    gltf.scene.traverse((o: any) => {
      if (o.isSkinnedMesh) o.skeleton.pose();
    });
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o: any) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false;
        o.material = Array.isArray(o.material)
          ? o.material.map((m: any) => paint(m, o.name))
          : paint(o.material, o.name);
      }
    });
    const heads: THREE.Object3D[] = [];
    gltf.scene.traverse((o) => {
      if (o.name.toLowerCase().endsWith("head")) heads.push(o);
    });
    const head = heads[0];
    const bp = new THREE.Vector3();
    const bq = new THREE.Quaternion();
    const bs = new THREE.Vector3();
    new THREE.Matrix4()
      .multiplyMatrices(new THREE.Matrix4().copy(gltf.scene.matrixWorld).invert(), head.matrixWorld)
      .decompose(bp, bq, bs);
    const hb = measureHead(gltf.scene, head);
    const hc = hb.isEmpty() ? bp.clone().add(new THREE.Vector3(0, 0.1, 0.01)) : hb.getCenter(new THREE.Vector3());
    const hs = hb.isEmpty() ? new THREE.Vector3(0.16, 0.22, 0.19) : hb.getSize(new THREE.Vector3());
    const offsetLocal = hc.clone().sub(bp).applyQuaternion(bq.clone().invert());
    return { mixer: new THREE.AnimationMixer(gltf.scene), head, hair: buildSnug(HAIR_STYLE, hs), bq, offsetLocal };
  }, [gltf.scene]);
  const seg = SEGS.find((x) => frame >= x.from && frame < x.to) ?? SEGS[SEGS.length - 1];
  const clip =
    gltf.animations.find((a) => a.name.toLowerCase() === seg.name.toLowerCase()) ??
    gltf.animations[0];
  rig.mixer.stopAllAction();
  rig.mixer.clipAction(clip).play();
  rig.mixer.setTime((frame - seg.from) / fps);
  gltf.scene.updateMatrixWorld(true);
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  new THREE.Matrix4()
    .multiplyMatrices(new THREE.Matrix4().copy(gltf.scene.matrixWorld).invert(), rig.head.matrixWorld)
    .decompose(p, q, sc);
  rig.hair.position.copy(p).add(rig.offsetLocal.clone().applyQuaternion(q));
  rig.hair.quaternion.copy(q).multiply(rig.bq.clone().invert());

  const z = interpolate(frame, [0, 120], [-6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <group position={[0, 0, z]}>
      <primitive object={gltf.scene} />
      <primitive object={rig.hair} />
    </group>
  );
};

export const CastTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: SKY }}>
      <ThreeCanvas shadows width={width} height={height} camera={{ position: [0, 1.45, 3.4], fov: 40 }}>
        <Cam />
        <ambientLight intensity={0.4} />
        <hemisphereLight args={["#bfe3ff", "#4a7a3a", 0.6]} />
        <directionalLight
          position={[4, 8, 6]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0005}
          shadow-normalBias={0.03}
          shadow-camera-near={1}
          shadow-camera-far={40}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color={GROUND} />
        </mesh>
        <React.Suspense fallback={<Loading />}>
          <Actor frame={frame} fps={fps} />
        </React.Suspense>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

const measureHead = (scene: THREE.Object3D, head: THREE.Object3D) => {
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  const hp = new THREE.Vector3();
  head.getWorldPosition(hp);
  scene.traverse((o: any) => {
    if (!o.isSkinnedMesh) return;
    const idx = o.skeleton.bones.indexOf(head);
    if (idx < 0) return;
    const pos = o.geometry.attributes.position;
    const si = o.geometry.attributes.skinIndex;
    const sw = o.geometry.attributes.skinWeight;
    for (let i = 0; i < pos.count; i++) {
      let w = 0;
      for (let k = 0; k < 4; k++) {
        if (si.getComponent(i, k) === idx) w += sw.getComponent(i, k);
      }
      if (w < 0.5) continue;
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      if (v.y < hp.y - 0.02) continue;
      box.expandByPoint(v);
    }
  });
  return box;
};

const mix = (t: number) =>
  "#" + new THREE.Color(HAIR).lerp(new THREE.Color(SKIN), t).getHexString();

const stubble = (n: number, yMin: number, yMax: number, hs: THREE.Vector3, color: string) => {
  const hx = hs.x / 2;
  const hy = hs.y / 2;
  const hz = hs.z / 2;
  const pts: THREE.Vector3[] = [];
  let guard = 0;
  while (pts.length < n && guard++ < n * 60) {
    const y = rand() * 2 - 1;
    const r = Math.sqrt(1 - y * y);
    const ph = rand() * Math.PI * 2;
    const dx = r * Math.cos(ph);
    const dz = r * Math.sin(ph);
    if (y < yMin || y > yMax || dz > 0.5) continue;
    pts.push(new THREE.Vector3(dx * (hx + 0.002), y * (hy + 0.002), dz * (hz + 0.002)));
  }
  return makeCurls(pts, 0.0035, 0.0055, color);
};

const buildSnug = (style: string, hs: THREE.Vector3) => {
  seed = 7;
  const g = new THREE.Group();
  const hx = hs.x / 2;
  const hy = hs.y / 2;
  const hz = hs.z / 2;
  const high = style === "highTop";
  const t = high ? 0.02 : 0.009;
  const lift = high ? 2.2 : 1.2;
  const cut = high ? 0.38 : 0.28;
  const th = Math.acos(cut);
  const f: Map3 = (d) => new THREE.Vector3(d.x * (hx + t), d.y * (hy + t * lift), d.z * (hz + t));
  const base: Map3 = (d) =>
    new THREE.Vector3(d.x * (hx + t * 0.4), d.y * (hy + t * 0.4 * lift), d.z * (hz + t * 0.4));
  const fj: Map3 = (d) => f(d).add(d.clone().multiplyScalar(rand() * t * 0.5));
  g.add(dome(base, th, HAIR));
  g.add(makeCurls(capPoints(high ? 1700 : 1300, th, fj), high ? 0.012 : 0.0055, high ? 0.018 : 0.0085, HAIR));
  if (style === "puff") {
    const c = new THREE.Vector3(0, hy * 0.9, -hz * 0.55);
    const R = hx * 1.05;
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(R, 24, 16),
      new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.85 })
    );
    ball.position.copy(c);
    ball.castShadow = true;
    g.add(ball);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 500; i++) {
      const y = rand() * 2 - 1;
      const r = Math.sqrt(1 - y * y);
      const ph = rand() * Math.PI * 2;
      pts.push(new THREE.Vector3(r * Math.cos(ph), y, r * Math.sin(ph)).multiplyScalar(R + rand() * 0.008).add(c));
    }
    g.add(makeCurls(pts, 0.011, 0.016, HAIR));
  } else {
    g.add(stubble(500, cut - 0.15, cut, hs, mix(0.2)));
    g.add(stubble(500, cut - 0.35, cut - 0.15, hs, mix(0.5)));
    g.add(stubble(500, -0.3, cut - 0.35, hs, mix(0.8)));
  }
  return g;
};
