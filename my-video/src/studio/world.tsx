import React, {useMemo} from 'react';
import * as THREE from 'three';

type V3 = [number, number, number];
export type ThemeName = 'dusk' | 'day' | 'winter';

type Theme = {
  horizon: string;
  skyTop: string;
  fog: [number, number];
  hemi: [string, string, number];
  ambient: [string, number];
  key: {pos: V3; color: string; intensity: number};
  fill: {pos: V3; color: string; intensity: number};
  sun: null | {pos: V3; r: number; color: string; glow: string; glowOpacity: number};
  road: string;
  curb: string;
  walk: string;
  lawn: string;
  walls: string[];
  roofs: string[];
  hedge: string;
  windows: 'lit' | 'glass';
  lamps: boolean;
  tree: 'round' | 'pine';
  leaf: string[];
  clouds: boolean;
  snow: boolean;
  houses: number;
};

export const THEMES: Record<ThemeName, Theme> = {
  dusk: {
    horizon: '#c9a66b',
    skyTop: '#665766',
    fog: [8, 48],
    hemi: ['#ffdca8', '#3a3028', 0.55],
    ambient: ['#ffd9a0', 0.3],
    key: {pos: [0, 6, -50], color: '#ffbf80', intensity: 0.7},
    fill: {pos: [3, 5, 12], color: '#ffd9b0', intensity: 0.9},
    sun: {pos: [0, 9, -150], r: 7, color: '#ffe9b8', glow: '#ffd9a0', glowOpacity: 0.25},
    road: '#3a3836',
    curb: '#7d786e',
    walk: '#9a9486',
    lawn: '#4a6b35',
    walls: ['#8794a3', '#a89a84', '#76897c', '#9a7b6d', '#8c97ae', '#b0a58f'],
    roofs: ['#2b2f3a', '#3d2b25', '#2f3a34', '#40363a'],
    hedge: '#35502d',
    windows: 'lit',
    lamps: true,
    tree: 'round',
    leaf: ['#436b3a', '#3a5e33', '#4c7640'],
    clouds: false,
    snow: false,
    houses: 7,
  },
  day: {
    horizon: '#d3e6f2',
    skyTop: '#4d8fe0',
    fog: [28, 90],
    hemi: ['#ffffff', '#8fa07a', 0.65],
    ambient: ['#ffffff', 0.3],
    key: {pos: [12, 30, 18], color: '#fff4dc', intensity: 1.0},
    fill: {pos: [-10, 8, 10], color: '#dfeaff', intensity: 0.3},
    sun: null,
    road: '#45464a',
    curb: '#a8a398',
    walk: '#bdb8ad',
    lawn: '#5e9f43',
    walls: ['#e8dcc0', '#b9d0e6', '#f0e6d2', '#d9c7a8', '#cfe0d0', '#e9d3c4'],
    roofs: ['#35384a', '#4a3a35', '#3c4a44', '#44404a'],
    hedge: '#3f8a3a',
    windows: 'glass',
    lamps: false,
    tree: 'round',
    leaf: ['#49a845', '#3c9440', '#5cbb52'],
    clouds: true,
    snow: false,
    houses: 11,
  },
  winter: {
    horizon: '#c9d3df',
    skyTop: '#808fad',
    fog: [6, 46],
    hemi: ['#e3ecfa', '#9aa4b4', 0.6],
    ambient: ['#eaf1ff', 0.25],
    key: {pos: [0, 5, -50], color: '#ffd9b0', intensity: 0.35},
    fill: {pos: [3, 6, 12], color: '#e4ecff', intensity: 0.7},
    sun: {pos: [0, 8, -150], r: 6, color: '#fff1d8', glow: '#ffe8c8', glowOpacity: 0.35},
    road: '#4b4e57',
    curb: '#b5bdca',
    walk: '#cfd7e3',
    lawn: '#cdd6e4',
    walls: ['#8f9bb0', '#a39a8e', '#7f8f8a', '#9a8a8a', '#8c97ae', '#b0a89a'],
    roofs: ['#dfe6f1', '#d6deeb', '#e4eaf4', '#d2dae8'],
    hedge: '#c4cfdd',
    windows: 'lit',
    lamps: true,
    tree: 'pine',
    leaf: ['#2f5a46', '#285040', '#366650'],
    clouds: false,
    snow: true,
    houses: 7,
  },
};

const rgb = (hex: string) => {
  const c = parseInt(hex.slice(1), 16);
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v) => (v / 255).toFixed(4));
};

const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* ---------- Sky ---------- */
const Sky: React.FC<{T: Theme}> = ({T}) => {
  const h = rgb(T.horizon);
  const t = rgb(T.skyTop);
  return (
    <group>
      <mesh>
        <sphereGeometry args={[180, 24, 16]} />
        <shaderMaterial
          side={THREE.BackSide}
          depthWrite={false}
          vertexShader={`
            varying vec3 vDir;
            void main() {
              vDir = normalize(position);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vDir;
            void main() {
              float k = smoothstep(0.0, 0.5, vDir.y);
              vec3 horizon = vec3(${h[0]}, ${h[1]}, ${h[2]});
              vec3 top = vec3(${t[0]}, ${t[1]}, ${t[2]});
              gl_FragColor = vec4(mix(horizon, top, k), 1.0);
            }
          `}
        />
      </mesh>
      {T.sun && (
        <>
          <mesh position={T.sun.pos}>
            <circleGeometry args={[T.sun.r, 32]} />
            <meshBasicMaterial color={T.sun.color} fog={false} />
          </mesh>
          <mesh position={[T.sun.pos[0], T.sun.pos[1], T.sun.pos[2] - 1]}>
            <circleGeometry args={[T.sun.r * 3.7, 32]} />
            <meshBasicMaterial color={T.sun.glow} transparent opacity={T.sun.glowOpacity} fog={false} depthWrite={false} />
          </mesh>
        </>
      )}
    </group>
  );
};

const Clouds: React.FC<{frame: number}> = ({frame}) => {
  const clouds = useMemo(() => {
    const r = rng(9);
    return Array.from({length: 10}, () => ({x: (r() - 0.5) * 260, y: 38 + r() * 30, z: -110 - r() * 50, s: 0.8 + r() * 0.8}));
  }, []);
  const puffs: [number, number, number, number][] = [
    [0, 0, 0, 9],
    [8, -1, 1, 7],
    [-8, -1, 0, 7],
    [3, 3, -1, 6],
    [-3, 2, 2, 5.5],
  ];
  return (
    <group>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x + frame * 0.02, c.y, c.z]} scale={[c.s, c.s, c.s]}>
          {puffs.map((p, j) => (
            <mesh key={j} position={[p[0], p[1], p[2]]} scale={[1, 0.65, 1]}>
              <sphereGeometry args={[p[3], 12, 10]} />
              <meshBasicMaterial color="#ffffff" fog={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

const Snow: React.FC<{frame: number; cx: number; cz: number}> = ({frame, cx, cz}) => {
  const count = 450;
  const seeds = useMemo(() => {
    const r = rng(5);
    return Array.from({length: count}, () => [r(), r(), r(), r()]);
  }, []);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [a, b, c, d] = seeds[i];
    const y = 9 - ((c * 9 + frame * 0.045 * (0.7 + 0.6 * d)) % 9);
    pos[i * 3] = cx + (a - 0.5) * 22 + Math.sin(frame * 0.025 + d * 6.28) * 0.4;
    pos[i * 3 + 1] = y + 0.05;
    pos[i * 3 + 2] = cz + 1 - b * 30;
  }
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.1} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
    </points>
  );
};

/* ---------- House ---------- */
const House: React.FC<{T: Theme; x: number; z: number; idx: number; side: 1 | -1; full?: boolean}> = ({
  T,
  x,
  z,
  idx,
  side,
  full = false,
}) => {
  const wall = T.walls[Math.abs(idx) % T.walls.length];
  const roof = T.roofs[Math.abs(idx * 3 + 1) % T.roofs.length];
  const H = 5.4;
  const front = -side * 3.03;
  const back = side * 3.03;
  const rotFront = -side * (Math.PI / 2);
  const rotBack = side * (Math.PI / 2);
  const lit = (k: number) => T.windows === 'lit' && (idx * 7 + k * 5) % 3 !== 0;
  const win = (key: string, p: V3, ry: number, k: number) => (
    <mesh key={key} position={p} rotation={[0, ry, 0]}>
      <planeGeometry args={[1.1, 1.3]} />
      {T.windows === 'glass' ? (
        <meshStandardMaterial color="#8fb7d0" metalness={0.1} roughness={0.25} />
      ) : (
        <meshStandardMaterial
          color={lit(k) ? '#ffd58a' : '#2a3140'}
          emissive={lit(k) ? '#ffae42' : '#000000'}
          emissiveIntensity={lit(k) ? 1.5 : 0}
          roughness={0.4}
        />
      )}
    </mesh>
  );
  const porchLight = (p: V3) => (
    <mesh position={p}>
      <boxGeometry args={[0.1, 0.22, 0.14]} />
      {T.lamps ? (
        <meshStandardMaterial color="#fff0c0" emissive="#ffc86a" emissiveIntensity={3} />
      ) : (
        <meshStandardMaterial color="#e9e5da" />
      )}
    </mesh>
  );
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, H / 2, 0]}>
        <boxGeometry args={[6, H, 7]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      <mesh position={[0, H + 0.73, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.373]}>
        <cylinderGeometry args={[3.93, 3.93, 7.6, 3]} />
        <meshStandardMaterial color={roof} roughness={1} />
      </mesh>
      <mesh position={[side * 1.2, H + 1.6, 1.6]}>
        <boxGeometry args={[0.7, 1.6, 0.7]} />
        <meshStandardMaterial color="#5b4a45" roughness={1} />
      </mesh>

      {win('f1', [front, 1.8, -2.2], rotFront, 1)}
      {win('f2', [front, 1.8, 2.2], rotFront, 2)}
      {win('f3', [front, 4.0, -2.2], rotFront, 3)}
      {win('f4', [front, 4.0, 0], rotFront, 4)}
      {win('f5', [front, 4.0, 2.2], rotFront, 5)}
      <mesh position={[-side * 3.05, 1.05, 0]}>
        <boxGeometry args={[0.12, 2.1, 1.1]} />
        <meshStandardMaterial color={idx % 2 ? '#5a2a26' : '#2a3a52'} roughness={0.8} />
      </mesh>
      <mesh position={[-side * 3.35, 0.08, 0]}>
        <boxGeometry args={[0.8, 0.16, 1.5]} />
        <meshStandardMaterial color={T.walk} />
      </mesh>
      {porchLight([-side * 3.1, 2.0, 0.95])}
      <mesh position={[-side * 3.5, 2.5, 0]}>
        <boxGeometry args={[1.0, 0.1, 1.9]} />
        <meshStandardMaterial color={roof} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-side * 4.9, 0.03, 0]}>
        <planeGeometry args={[3.8, 1.3]} />
        <meshStandardMaterial color={T.walk} roughness={1} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-side * 6.2, 0.4, s * 2.2]}>
          <boxGeometry args={[0.7, 0.8, 2.6]} />
          <meshStandardMaterial color={T.hedge} roughness={1} />
        </mesh>
      ))}

      {full && (
        <>
          {win('b1', [back, 1.8, 1.6], rotBack, 6)}
          {win('b2', [back, 4.0, -2.2], rotBack, 7)}
          {win('b3', [back, 4.0, 0], rotBack, 8)}
          {win('b4', [back, 4.0, 2.2], rotBack, 9)}
          {win('s1', [0, 1.8, 3.53], 0, 10)}
          {win('s2', [0, 4.0, 3.53], 0, 11)}
          {win('s3', [0, 1.8, -3.53], Math.PI, 12)}
          {win('s4', [0, 4.0, -3.53], Math.PI, 13)}
          <mesh position={[side * 3.05, 1.05, -1.5]}>
            <boxGeometry args={[0.12, 2.1, 1.1]} />
            <meshStandardMaterial color="#3a3f48" roughness={0.8} />
          </mesh>
          <mesh position={[side * 3.9, 0.08, -1.5]}>
            <boxGeometry args={[1.8, 0.16, 2.4]} />
            <meshStandardMaterial color="#6b5a48" roughness={1} />
          </mesh>
          {porchLight([side * 3.1, 2.0, -0.7])}
          <mesh position={[side * 3.45, 0.3, 2.8]}>
            <boxGeometry args={[0.6, 0.6, 0.7]} />
            <meshStandardMaterial color="#9aa0a6" roughness={0.6} />
          </mesh>
          <mesh position={[side * 8, 0.6, 0]}>
            <boxGeometry args={[0.1, 1.2, 12]} />
            <meshStandardMaterial color="#6b5a48" roughness={1} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={'fe' + s} position={[side * 5.5, 0.6, s * 6]}>
              <boxGeometry args={[5, 1.2, 0.1]} />
              <meshStandardMaterial color="#6b5a48" roughness={1} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
};

/* ---------- Trees ---------- */
const Tree: React.FC<{T: Theme; x: number; z: number; s: number}> = ({T, x, z, s}) => {
  if (T.tree === 'pine') {
    const tiers: [number, number, number][] = [
      [2.2, 1.45, 1.9],
      [3.3, 1.1, 1.6],
      [4.3, 0.75, 1.4],
    ];
    return (
      <group position={[x, 0, z]} scale={[s, s, s]}>
        <mesh position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.14, 0.2, 2.0, 7]} />
          <meshStandardMaterial color="#4a3426" roughness={1} />
        </mesh>
        {tiers.map((t, i) => (
          <React.Fragment key={i}>
            <mesh position={[0, t[0], 0]}>
              <coneGeometry args={[t[1], t[2], 8]} />
              <meshStandardMaterial color={T.leaf[i % T.leaf.length]} roughness={1} flatShading />
            </mesh>
            <mesh position={[0, t[0] + t[2] * 0.22, 0]}>
              <coneGeometry args={[t[1] * 0.74, t[2] * 0.58, 8]} />
              <meshStandardMaterial color="#eef3fa" roughness={1} flatShading />
            </mesh>
          </React.Fragment>
        ))}
      </group>
    );
  }
  return (
    <group position={[x, 0, z]} scale={[s, s, s]}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.14, 0.2, 2.4, 7]} />
        <meshStandardMaterial color="#4a3426" roughness={1} />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial color={T.leaf[0]} roughness={1} flatShading />
      </mesh>
      <mesh position={[0.7, 3.0, 0.3]}>
        <icosahedronGeometry args={[1.0, 1]} />
        <meshStandardMaterial color={T.leaf[1]} roughness={1} flatShading />
      </mesh>
      <mesh position={[-0.6, 3.1, -0.4]}>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial color={T.leaf[2]} roughness={1} flatShading />
      </mesh>
    </group>
  );
};

/* ---------- Lamp ---------- */
const Lamp: React.FC<{T: Theme; x: number; z: number; light?: boolean; off?: boolean}> = ({T, x, z, light, off = false}) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, 0.15, 0]}>
      <cylinderGeometry args={[0.16, 0.2, 0.3, 8]} />
      <meshStandardMaterial color="#1b1b1b" />
    </mesh>
    <mesh position={[0, 2.1, 0]}>
      <cylinderGeometry args={[0.06, 0.08, 4.2, 8]} />
      <meshStandardMaterial color="#1b1b1b" />
    </mesh>
    <mesh position={[0, 4.4, 0]}>
      <boxGeometry args={[0.34, 0.45, 0.34]} />
      {T.lamps && !off ? (
        <meshStandardMaterial color="#fff0c0" emissive="#ffd27a" emissiveIntensity={3} />
      ) : (
        <meshStandardMaterial color="#e9e5da" />
      )}
    </mesh>
    <mesh position={[0, 4.78, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[0.32, 0.3, 4]} />
      <meshStandardMaterial color="#1b1b1b" />
    </mesh>
    {T.lamps && light && <pointLight position={[0, 4.3, 0]} intensity={off ? 0 : 30} distance={15} color="#ffc680" />}
  </group>
);

/* ---------- Street (the whole town set) ---------- */
export const Street: React.FC<{
  theme?: ThemeName;
  detail?: boolean;
  frame?: number;
  focus?: [number, number];
  scroll?: boolean;
  darkZ?: number;
}> = ({theme = 'dusk', detail = false, frame = 0, focus = [0, 0], scroll = false, darkZ = 1e9}) => {
  const T = THEMES[theme];
  const fz = focus[1];
  const iMin = scroll ? Math.ceil((6 - (fz + 52)) / 10) : 0;
  const iMax = scroll ? Math.floor((6 - (fz - 62)) / 10) : T.houses - 1;
  const houses = Array.from({length: iMax - iMin + 1}, (_, k) => iMin + k);
  const lampCount = Math.ceil((T.houses * 10) / 14) + 1;
  const lMin = scroll ? Math.ceil((2 - (fz + 52)) / 14) : 0;
  const lMax = scroll ? Math.floor((2 - (fz - 62)) / 14) : lampCount - 1;
  const lamps = Array.from({length: lMax - lMin + 1}, (_, k) => lMin + k);
  const i0 = Math.ceil((2 - fz) / 14);
  return (
    <>
      <fog attach="fog" args={[T.horizon, T.fog[0], T.fog[1]]} />
      <hemisphereLight args={[T.hemi[0], T.hemi[1], T.hemi[2]]} />
      <ambientLight intensity={T.ambient[1]} color={T.ambient[0]} />
      <directionalLight position={T.key.pos} intensity={T.key.intensity} color={T.key.color} />
      <directionalLight position={T.fill.pos} intensity={T.fill.intensity} color={T.fill.color} />
      <group position={[0, 0, scroll ? fz : 0]}>
        <Sky T={T} />
        {T.clouds && <Clouds frame={frame} />}
      </group>
      {T.snow && <Snow frame={frame} cx={focus[0]} cz={focus[1]} />}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -80]}>
        <planeGeometry args={[7, 240]} />
        <meshStandardMaterial color={T.road} roughness={1} />
      </mesh>
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <mesh position={[s * 3.6, 0.06, -80]}>
            <boxGeometry args={[0.2, 0.12, 240]} />
            <meshStandardMaterial color={T.curb} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s * 4.7, 0.05, -80]}>
            <planeGeometry args={[2, 240]} />
            <meshStandardMaterial color={T.walk} roughness={1} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s * 18, 0, -80]}>
            <planeGeometry args={[24.6, 240]} />
            <meshStandardMaterial color={T.lawn} roughness={1} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s * 3.0, 0.015, -80]}>
            <planeGeometry args={[0.12, 240]} />
            <meshStandardMaterial color="#d8d4c8" roughness={1} />
          </mesh>
        </React.Fragment>
      ))}
      {Array.from({length: 40}).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 10 - i * 5]}>
          <planeGeometry args={[0.15, 2.2]} />
          <meshStandardMaterial color="#d9b23a" roughness={1} />
        </mesh>
      ))}

      {houses.map((i) => (
        <React.Fragment key={i}>
          <House T={T} x={12.5} z={6 - i * 10} idx={i} side={1} full={detail} />
          <House T={T} x={-12.5} z={3 - i * 10} idx={i + 3} side={-1} full={detail} />
          <Tree T={T} x={7.5} z={1 - i * 10} s={0.9 + (i % 3) * 0.12} />
          <Tree T={T} x={-7.5} z={-2 - i * 10} s={1.0 + ((i + 1) % 3) * 0.1} />
        </React.Fragment>
      ))}

      {lamps.map((i) => (
        <React.Fragment key={'lp' + i}>
          <Lamp T={T} x={5.2} z={2 - i * 14} light={scroll ? i >= i0 - 1 && i <= i0 + 1 : i < 3} off={2 - i * 14 > darkZ} />
          <Lamp T={T} x={-5.2} z={-5 - i * 14} off={-5 - i * 14 > darkZ} />
        </React.Fragment>
      ))}
    </>
  );
};
