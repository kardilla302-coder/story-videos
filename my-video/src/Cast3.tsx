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
const HAIR_STYLE: string = "lowBrush";
const CLOSE = true;
const SKIN = "#c68a62";
const HAIR = "#0d0a09";
const SHIRT = "#e0a82e";
const PANTS = "#23293f";
const SHOES = "#f2f2f2";
const HEAD_UP = 0.075;
const HEAD_FWD = 0.01;
const HEAD_W = 0.15;
const HEAD_H = 0.22;
const HEAD_D = 0.19;
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
  if (CLOSE) {
    camera.position.set(0, 1.62, 1.5);
    camera.lookAt(0, 1.58, 0);
  } else {
    camera.position.set(0, 1.25, 3.6);
    camera.lookAt(0, 0.95, 0);
  }
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
  const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), mat, Math.max(1, pts.length));
  const m = new THREE.Matrix4();
  const id = new THREE.Quaternion();
  pts.forEach((p, i) => {
    const r = rMin + rand() * (rMax - rMin);
    m.compose(p, id, new THREE.Vector3(r, r, r));
    inst.setMatrixAt(i, m);
  });
  inst.count = pts.length;
  inst.castShadow = true;
  inst.frustumCulled = false;
  return inst;
};

const mixHex = (t: number) =>
  "#" + new THREE.Color(HAIR).lerp(new THREE.Color(SKIN), t).getHexString();

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const hairLine = (d: THREE.Vector3, high: boolean) => {
  const top = high ? 0.42 : 0.4;
  const side = high ? 0.2 : 0.16;
  if (d.z <= 0.1) return side;
  return top + (side - top) * smooth(0.52, 0.58, Math.abs(d.x));
};

const shell = (f: Map3, keep: (d: THREE.Vector3) => boolean, color: string) => {
  const geo = new THREE.SphereGeometry(1, 48, 32).toNonIndexed();
  const pos = geo.attributes.position;
  const out: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    const mid = a.clone().add(b).add(c).divideScalar(3).normalize();
    if (!keep(mid)) continue;
    [a, b, c].forEach((v) => {
      const q = f(v.clone().normalize());
      out.push(q.x, q.y, q.z);
    });
  }
  const g2 = new THREE.BufferGeometry();
  g2.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  g2.computeVertexNormals();
  const mesh = new THREE.Mesh(
    g2,
    new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide })
  );
  mesh.castShadow = true;
  return mesh;
};

const curlPts = (n: number, keep: (d: THREE.Vector3) => boolean, f: Map3, jit: number) => {
  const out: THREE.Vector3[] = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 60) {
    const y = rand() * 2 - 1;
    const r = Math.sqrt(1 - y * y);
    const ph = rand() * Math.PI * 2;
    const d = new THREE.Vector3(r * Math.cos(ph), y, r * Math.sin(ph));
    if (!keep(d)) continue;
    out.push(f(d).add(d.clone().multiplyScalar(rand() * jit)));
  }
  return out;
};

const MOUTH: string = "smile";
const BROWS = false;
const FACE_OUT = 0.004;

const face = (g: THREE.Group, sx: number, sy: number, sz: number) => {
  const surf = (x: number, y: number) =>
    sz * Math.sqrt(Math.max(0, 1 - (x / sx) ** 2 - (y / sy) ** 2)) + FACE_OUT;
  const dark = new THREE.MeshStandardMaterial({ color: "#0c0a09", roughness: 0.6 });
  [-1, 1].forEach((s) => {
    const x = s * 0.034;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), dark);
    eye.scale.set(0.0095, 0.0145, 0.005);
    eye.position.set(x, 0.004, surf(x, 0.004));
    eye.rotation.y = s * 0.42;
    g.add(eye);
    if (BROWS) {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.005, 0.005), dark);
      brow.position.set(x, 0.034, surf(x, 0.034));
      brow.rotation.y = s * 0.42;
      brow.rotation.z = s * 0.12;
      g.add(brow);
    }
  });
  if (MOUTH === "flat") {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.005, 0.005), dark);
    m.position.set(0, -0.048, surf(0, -0.048));
    g.add(m);
  } else {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0035, 8, 20, Math.PI), dark);
    m.rotation.z = Math.PI;
    m.position.set(0, -0.034, surf(0, -0.034));
    g.add(m);
  }
};


const robloxHair = (style: string, sx: number, sy: number, sz: number) => {
  seed = 11;
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.75, flatShading: true });
  const cap = (d: THREE.Vector3) =>
    new THREE.Vector3(d.x * (sx + 0.012), d.y * (sy + 0.012), d.z * (sz + 0.012));
  const keep = (d: THREE.Vector3) => d.y > (d.z > 0.1 ? 0.5 : 0.1);
  g.add(shell(cap, keep, HAIR));
  if (style === "spiky") {
    for (let i = 0; i < 28; i++) {
      const y = 0.45 + rand() * 0.55;
      const r = Math.sqrt(1 - y * y);
      const ph = rand() * Math.PI * 2;
      const d = new THREE.Vector3(r * Math.cos(ph), y, r * Math.sin(ph));
      if (!keep(d)) continue;
      const dir = d.clone().add(new THREE.Vector3(0, 0.5, 0.15)).normalize();
      const h = 0.045 + rand() * 0.035;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.014 + rand() * 0.006, h, 6), mat);
      cone.position.copy(cap(d)).add(dir.clone().multiplyScalar(h * 0.35));
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      cone.castShadow = true;
      g.add(cone);
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const u = (i / 6) * 2 - 1;
      const d = new THREE.Vector3(u * 0.55, 0.62, 0.55).normalize();
      const lock = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat);
      lock.scale.set(0.017, 0.036 + rand() * 0.012, 0.009);
      lock.position.copy(cap(d)).add(new THREE.Vector3(0, -0.02, 0.012));
      lock.rotation.z = -u * 0.55;
      lock.castShadow = true;
      g.add(lock);
    }
  }
  return g;
};

const buildHead = (style: string) => {
  seed = 7;
  const g = new THREE.Group();
  const sx = (HEAD_W / 2) * 1.06;
  const sy = (HEAD_H / 2) * 1.06;
  const sz = (HEAD_D / 2) * 1.06;
  const skin = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 24),
    new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.55 })
  );
  skin.scale.set(sx, sy, sz);
  skin.castShadow = true;
  g.add(skin);
  face(g, sx, sy, sz);
  if (style === "fringe" || style === "spiky") {
    g.add(robloxHair(style, sx, sy, sz));
    g.name = "headRig";
    return g;
  }
  const high = style === "highTop";
  const puff = style === "puff";
  const topT = high ? 0.022 : puff ? 0.012 : 0.008;
  const sideT = high ? 0.007 : 0.005;
  const th = (d: THREE.Vector3) => sideT + (topT - sideT) * smooth(0.45, 0.85, d.y);
  const at = (d: THREE.Vector3, add: number) =>
    new THREE.Vector3(d.x * (sx + add), d.y * (sy + add), d.z * (sz + add));
  const f: Map3 = (d) => at(d, th(d));
  const fb: Map3 = (d) => at(d, th(d) * 0.5);
  const keep = (d: THREE.Vector3) => d.y > hairLine(d, high);
  g.add(shell(fb, keep, HAIR));
  g.add(
    makeCurls(
      curlPts(high ? 1200 : 900, (d) => keep(d) && d.y >= 0.5, f, topT * 0.5),
      high ? 0.01 : puff ? 0.008 : 0.005,
      high ? 0.015 : puff ? 0.012 : 0.008,
      HAIR
    )
  );
  g.add(makeCurls(curlPts(900, (d) => keep(d) && d.y < 0.5, f, sideT * 0.4), 0.0035, 0.006, HAIR));
  if (puff) {
    const c = new THREE.Vector3(0, sy * 0.9, -sz * 0.6);
    const R = sx * 1.1;
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(R, 24, 16),
      new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.9 })
    );
    ball.position.copy(c);
    ball.castShadow = true;
    g.add(ball);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 500; i++) {
      const y = rand() * 2 - 1;
      const r = Math.sqrt(1 - y * y);
      const ph = rand() * Math.PI * 2;
      pts.push(
        new THREE.Vector3(r * Math.cos(ph), y, r * Math.sin(ph))
          .multiplyScalar(R + rand() * 0.008)
          .add(c)
      );
    }
    g.add(makeCurls(pts, 0.011, 0.016, HAIR));
  } else {
    const band = (from: number, to: number, m: number) => {
      const kb = (d: THREE.Vector3) => {
        const L = hairLine(d, high);
        return (
          (Math.abs(d.x) > 0.5 || d.z < 0.1) &&
          d.z < 0.5 &&
          d.y <= L - from &&
          d.y > L - to &&
          d.y > -0.4
        );
      };
      g.add(makeCurls(curlPts(450, kb, (d) => at(d, 0.001), 0), 0.0035, 0.0055, mixHex(m)));
    };
    band(0, 0.1, 0.25);
    band(0.1, 0.2, 0.5);
    band(0.2, 0.3, 0.75);
  }
  g.name = "headRig";
  return g;
};

type Part = {
  a: string;
  b: string;
  f1?: string;
  f2?: string;
  from: number;
  to: number;
  ext: number;
  rx: number;
  rz: number;
  color: string;
  fz?: number;
};

const CLOTH: Part[] = [
  { a: "hips", b: "neck", f1: "leftarm", f2: "rightarm", from: 0, to: 1, ext: 0.05, rx: 0.19, rz: 0.15, fz: 0.03, color: SHIRT },
  { a: "spine1", b: "neck", f1: "leftarm", f2: "rightarm", from: 0.1, to: 1.2, ext: 0.04, rx: 0.2, rz: 0.155, fz: 0.04, color: SHIRT },
  { a: "hips", b: "spine", f1: "leftupleg", f2: "rightupleg", from: -1.8, to: 1.2, ext: 0.05, rx: 0.2, rz: 0.16, fz: 0.01, color: PANTS },
  { a: "neck", b: "head", from: -0.4, to: 1.1, ext: 0.012, rx: 0.056, rz: 0.056, color: SKIN },
  ...["left", "right"].flatMap((s): Part[] => [
    { a: s + "shoulder", b: s + "arm", from: -0.3, to: 1.3, ext: 0.03, rx: 0.085, rz: 0.085, color: SHIRT },
    { a: s + "arm", b: s + "forearm", from: -0.1, to: 1.08, ext: 0.02, rx: 0.068, rz: 0.068, color: SHIRT },
    { a: s + "forearm", b: s + "hand", from: -0.12, to: 1.02, ext: 0.012, rx: 0.056, rz: 0.056, color: SKIN },
    { a: s + "hand", b: s + "handmiddle1", from: -0.4, to: 1.9, ext: 0.03, rx: 0.05, rz: 0.05, color: SKIN },
    { a: s + "upleg", b: s + "leg", from: -0.25, to: 1.1, ext: 0.03, rx: 0.13, rz: 0.13, color: PANTS },
    { a: s + "leg", b: s + "foot", from: -0.2, to: 0.98, ext: 0.02, rx: 0.088, rz: 0.088, color: PANTS },
    { a: s + "foot", b: s + "toebase", from: -0.35, to: 1.5, ext: 0.04, rx: 0.07, rz: 0.07, color: SHOES },
  ]),
];

const Actor: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const gltf = useGLTF(staticFile("Xbot.glb"));
  const rig = useMemo(() => {
    const paint = (m: any) => {
      const c = m.clone();
      c.map = null;
      c.color.set(SKIN);
      c.roughness = 0.55;
      c.metalness = 0;
      return c;
    };
    gltf.scene.position.set(0, 0, 0);
    gltf.scene.traverse((o: any) => {
      if (o.isSkinnedMesh) o.skeleton.pose();
    });
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o: any) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false;
        o.material = Array.isArray(o.material) ? o.material.map(paint) : paint(o.material);
      }
    });
    const find = (key: string) => {
      const hits: THREE.Object3D[] = [];
      gltf.scene.traverse((o) => {
        if (o.name.toLowerCase().endsWith(key)) hits.push(o);
      });
      return hits[0];
    };
    const head = find("head");
    head.children.filter((c) => c.name === "headRig").forEach((c) => c.removeFromParent());
    const headRig = buildHead(HAIR_STYLE);
    head.updateWorldMatrix(true, false);
    headRig.position.setFromMatrixPosition(head.matrixWorld).add(new THREE.Vector3(0, HEAD_UP, HEAD_FWD));
    headRig.updateMatrixWorld(true);
    head.attach(headRig);
    const cloth = CLOTH.map((c) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 24, 16),
        new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.85 })
      );
      mesh.castShadow = true;
      mesh.frustumCulled = false;
      return { c, A: find(c.a), B: find(c.b), F1: c.f1 ? find(c.f1) : undefined, F2: c.f2 ? find(c.f2) : undefined, mesh };
    }).filter((k) => k.A && k.B);
    return { mixer: new THREE.AnimationMixer(gltf.scene), head, headRig, cloth };
  }, [gltf.scene]);

  const seg = SEGS.find((x) => frame >= x.from && frame < x.to) ?? SEGS[SEGS.length - 1];
  const clip =
    gltf.animations.find((a) => a.name.toLowerCase() === seg.name.toLowerCase()) ??
    gltf.animations[0];
  rig.mixer.stopAllAction();
  rig.mixer.clipAction(clip).play();
  rig.mixer.setTime((frame - seg.from) / fps);
  gltf.scene.updateMatrixWorld(true);


  const inv = new THREE.Matrix4().copy(gltf.scene.matrixWorld).invert();
  const P = (o: THREE.Object3D) =>
    new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).applyMatrix4(inv);
  rig.cloth.forEach(({ c, A, B, F1, F2, mesh }) => {
    const a = P(A);
    const ab = P(B).sub(a);
    const dist = ab.length();
    const y = ab.clone().normalize();
    const alt = Math.abs(y.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    let ref = F1 && F2 ? P(F2).sub(P(F1)) : alt;
    ref = ref.clone().sub(y.clone().multiplyScalar(ref.dot(y)));
    if (ref.lengthSq() < 1e-8) ref = alt.clone().sub(y.clone().multiplyScalar(alt.dot(y)));
    const x = ref.normalize();
    const zz = new THREE.Vector3().crossVectors(x, y);
    mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, zz));
    mesh.position.copy(a).add(ab.clone().multiplyScalar((c.from + c.to) / 2));
    if (F1 && F2 && c.fz) mesh.position.add(zz.clone().multiplyScalar(-c.fz));
    mesh.scale.set(c.rx, (dist * (c.to - c.from)) / 2 + c.ext, c.rz);
  });

  const wz = interpolate(frame, [0, 120], [-6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <group position={[0, 0, wz]}>
      <primitive object={gltf.scene} />
      {rig.cloth.map((k, i) => (
        <primitive key={i} object={k.mesh} />
      ))}
    </group>
  );
};
export const Cast3: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: SKY }}>
      <ThreeCanvas shadows width={width} height={height} camera={{ position: [0, 1.25, 3.6], fov: 40 }}>
        <Cam />
        <ambientLight intensity={0.45} />
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
