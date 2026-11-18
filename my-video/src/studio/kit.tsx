import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

export const HORIZON = '#c9a66b';
type V3 = [number, number, number];

/* ---------- Captions ---------- */
export const Caption: React.FC<{text: string; dur: number}> = ({text, dur}) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, 8, dur - 8, dur], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 260}}>
      <div
        style={{
          opacity,
          color: 'white',
          fontSize: 72,
          fontWeight: 800,
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          padding: '0 70px',
          lineHeight: 1.2,
          textShadow: '0 4px 14px rgba(0,0,0,0.9), 0 0 4px black',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Camera ---------- */
export const Rig: React.FC<{pos: V3; look: V3}> = ({pos, look}) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(pos[0], pos[1], pos[2]);
  camera.lookAt(look[0], look[1], look[2]);
  return null;
};

// Orbit camera around a point. For Daniel (he faces -z): angle 0 = back view,
// 180 = front view, 90 / 270 = the two side views.
export const orbitCam = (target: V3, dist: number, angleDeg: number, height: number) => {
  const a = (angleDeg * Math.PI) / 180;
  const pos: V3 = [target[0] + Math.sin(a) * dist, height, target[2] + Math.cos(a) * dist];
  return {pos, look: target};
};

/* ---------- Sky: gradient + low sun ---------- */
export const Sky: React.FC = () => (
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
            float t = smoothstep(0.0, 0.5, vDir.y);
            vec3 horizon = vec3(0.788, 0.651, 0.420);
            vec3 top = vec3(0.40, 0.34, 0.40);
            gl_FragColor = vec4(mix(horizon, top, t), 1.0);
          }
        `}
      />
    </mesh>
    <mesh position={[0, 9, -150]}>
      <circleGeometry args={[7, 32]} />
      <meshBasicMaterial color="#ffe9b8" fog={false} />
    </mesh>
    <mesh position={[0, 9, -151]}>
      <circleGeometry args={[26, 32]} />
      <meshBasicMaterial color="#ffd9a0" transparent opacity={0.25} fog={false} depthWrite={false} />
    </mesh>
  </group>
);

/* ---------- House (front, back and both sides) ---------- */
const WALLS = ['#8794a3', '#a89a84', '#76897c', '#9a7b6d', '#8c97ae', '#b0a58f'];
const ROOFS = ['#2b2f3a', '#3d2b25', '#2f3a34', '#40363a'];

export const House: React.FC<{x: number; z: number; idx: number; side: 1 | -1; full?: boolean}> = ({
  x,
  z,
  idx,
  side,
  full = false,
}) => {
  const wall = WALLS[idx % WALLS.length];
  const roof = ROOFS[(idx * 3 + 1) % ROOFS.length];
  const H = 5.4;
  const front = -side * 3.03; // street-facing wall
  const back = side * 3.03; // back-yard wall
  const rotFront = -side * (Math.PI / 2);
  const rotBack = side * (Math.PI / 2);
  const lit = (k: number) => (idx * 7 + k * 5) % 3 !== 0;
  const win = (key: string, p: V3, ry: number, k: number) => (
    <mesh key={key} position={p} rotation={[0, ry, 0]}>
      <planeGeometry args={[1.1, 1.3]} />
      <meshStandardMaterial
        color={lit(k) ? '#ffd58a' : '#2a3140'}
        emissive={lit(k) ? '#ffae42' : '#000000'}
        emissiveIntensity={lit(k) ? 1.5 : 0}
        roughness={0.4}
      />
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

      {/* FRONT (street side) */}
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
        <meshStandardMaterial color="#8a8478" />
      </mesh>
      <mesh position={[-side * 3.1, 2.0, 0.95]}>
        <boxGeometry args={[0.1, 0.22, 0.14]} />
        <meshStandardMaterial color="#fff0c0" emissive="#ffc86a" emissiveIntensity={3} />
      </mesh>
      <mesh position={[-side * 3.5, 2.5, 0]}>
        <boxGeometry args={[1.0, 0.1, 1.9]} />
        <meshStandardMaterial color={roof} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-side * 4.9, 0.03, 0]}>
        <planeGeometry args={[3.8, 1.3]} />
        <meshStandardMaterial color="#8a8478" roughness={1} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-side * 6.2, 0.4, s * 2.2]}>
          <boxGeometry args={[0.7, 0.8, 2.6]} />
          <meshStandardMaterial color="#35502d" roughness={1} />
        </mesh>
      ))}

      {/* BACK + SIDES (only when full) */}
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
          <mesh position={[side * 3.1, 2.0, -0.7]}>
            <boxGeometry args={[0.1, 0.22, 0.14]} />
            <meshStandardMaterial color="#fff0c0" emissive="#ffc86a" emissiveIntensity={3} />
          </mesh>
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

/* ---------- Tree ---------- */
export const Tree: React.FC<{x: number; z: number; s: number}> = ({x, z, s}) => (
  <group position={[x, 0, z]} scale={[s, s, s]}>
    <mesh position={[0, 1.2, 0]}>
      <cylinderGeometry args={[0.14, 0.2, 2.4, 7]} />
      <meshStandardMaterial color="#4a3426" roughness={1} />
    </mesh>
    <mesh position={[0, 3.5, 0]}>
      <icosahedronGeometry args={[1.5, 1]} />
      <meshStandardMaterial color="#436b3a" roughness={1} flatShading />
    </mesh>
    <mesh position={[0.7, 3.0, 0.3]}>
      <icosahedronGeometry args={[1.0, 1]} />
      <meshStandardMaterial color="#3a5e33" roughness={1} flatShading />
    </mesh>
    <mesh position={[-0.6, 3.1, -0.4]}>
      <icosahedronGeometry args={[1.1, 1]} />
      <meshStandardMaterial color="#4c7640" roughness={1} flatShading />
    </mesh>
  </group>
);

/* ---------- Lamp ---------- */
export const Lamp: React.FC<{x: number; z: number; light?: boolean}> = ({x, z, light}) => (
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
      <meshStandardMaterial color="#fff0c0" emissive="#ffd27a" emissiveIntensity={3} />
    </mesh>
    <mesh position={[0, 4.78, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[0.32, 0.3, 4]} />
      <meshStandardMaterial color="#1b1b1b" />
    </mesh>
    {light && <pointLight position={[0, 4.3, 0]} intensity={30} distance={15} color="#ffc680" />}
  </group>
);

/* ---------- Daniel (faces -z) ---------- */
const SKIN = '#c99a74';
const JACKET = '#44546b';
const PANTS = '#2b2e38';
const HAIR = '#33241a';
const LEATHER = '#5a4632';

const Leg: React.FC<{x: number; hip: number; knee: number}> = ({x, hip, knee}) => (
  <group position={[x, 0.9, 0]} rotation={[hip, 0, 0]}>
    <mesh position={[0, -0.23, 0]}>
      <boxGeometry args={[0.2, 0.46, 0.22]} />
      <meshStandardMaterial color={PANTS} />
    </mesh>
    <group position={[0, -0.46, 0]} rotation={[knee, 0, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.095, 0.095, 0.19, 10]} />
        <meshStandardMaterial color={PANTS} />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[0.18, 0.4, 0.2]} />
        <meshStandardMaterial color={PANTS} />
      </mesh>
      <mesh position={[0, -0.4, -0.05]}>
        <boxGeometry args={[0.2, 0.1, 0.32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>
    </group>
  </group>
);

const Arm: React.FC<{x: number; shoulder: number; elbow: number}> = ({x, shoulder, elbow}) => (
  <group position={[x, 1.46, 0]} rotation={[shoulder, 0, 0]}>
    <mesh>
      <sphereGeometry args={[0.085, 10, 10]} />
      <meshStandardMaterial color={JACKET} />
    </mesh>
    <mesh position={[0, -0.15, 0]}>
      <boxGeometry args={[0.14, 0.3, 0.16]} />
      <meshStandardMaterial color={JACKET} />
    </mesh>
    <group position={[0, -0.3, 0]} rotation={[elbow, 0, 0]}>
      <mesh>
        <sphereGeometry args={[0.075, 10, 10]} />
        <meshStandardMaterial color={JACKET} />
      </mesh>
      <mesh position={[0, -0.14, 0]}>
        <boxGeometry args={[0.13, 0.28, 0.14]} />
        <meshStandardMaterial color={JACKET} />
      </mesh>
      <mesh position={[0, -0.31, 0]}>
        <sphereGeometry args={[0.065, 10, 10]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>
    </group>
  </group>
);

const Hair: React.FC = () => (
  <group>
    <mesh>
      <sphereGeometry args={[0.205, 24, 16, 0, Math.PI * 2, 0, 1.0]} />
      <meshStandardMaterial color={HAIR} roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
    <mesh>
      <sphereGeometry args={[0.205, 24, 16, -0.6, Math.PI + 1.2, 0, 1.45]} />
      <meshStandardMaterial color={HAIR} roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
    <mesh>
      <sphereGeometry args={[0.205, 24, 16, 0.55, Math.PI - 1.1, 0, 1.95]} />
      <meshStandardMaterial color={HAIR} roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 0.18, -0.07]} rotation={[0.35, 0, 0]}>
      <boxGeometry args={[0.2, 0.07, 0.17]} />
      <meshStandardMaterial color={HAIR} roughness={0.85} />
    </mesh>
  </group>
);

export type FaceSpec = {brow?: number; eye?: number; mouth?: number; open?: number; look?: number};

export const Face: React.FC<FaceSpec> = ({brow = 0, eye = 1, mouth = 0, open = 0, look = 0}) => {
  const wide = Math.max(0, eye - 1);
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={'eye' + s} position={[s * 0.07, 0.01, -0.172]} scale={[1 + 0.35 * wide, Math.max(0.12, eye), 1 + 0.35 * wide]}>
          <mesh>
            <sphereGeometry args={[0.027, 10, 10]} />
            <meshStandardMaterial color="#f2efe8" />
          </mesh>
          <mesh position={[look * 0.012, 0, -0.02]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={'br' + s} position={[s * 0.07, 0.055 + 0.018 * brow + 0.012 * wide, -0.172]} rotation={[0, 0, -s * 0.5 * brow]}>
          <boxGeometry args={[0.06, 0.012, 0.012]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>
      ))}
      <mesh position={[0, -0.03, -0.19]}>
        <boxGeometry args={[0.035, 0.05, 0.04]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>
      {open > 0.05 ? (
        <mesh position={[0, -0.085, -0.176]} scale={[1.3 + 0.3 * open, open * 1.6, 0.4]}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshStandardMaterial color="#2a0d0d" />
        </mesh>
      ) : (
        [-1, 1].map((s) => (
          <mesh key={'m' + s} position={[s * 0.0175, -0.08 + mouth * 0.004, -0.18]} rotation={[0, 0, s * 0.6 * mouth]}>
            <boxGeometry args={[0.037, 0.012, 0.01]} />
            <meshStandardMaterial color="#5a2f26" />
          </mesh>
        ))
      )}
    </>
  );
};

export const Person: React.FC<{frame: number; stand?: boolean; walk?: number; face?: FaceSpec}> = ({frame, stand = false, walk = 1, face = {}}) => {
  const p = frame * 0.34;
  const w = stand ? 0 : walk;
  const hipA = Math.sin(p) * 0.6 * w;
  const hipB = Math.sin(p + Math.PI) * 0.6 * w;
  const kneeA = -Math.max(0, Math.cos(p)) * 0.9 * w;
  const kneeB = -Math.max(0, Math.cos(p + Math.PI)) * 0.9 * w;
  const bob = Math.abs(Math.cos(p)) * 0.04 * w;
  const sway = Math.sin(p) * 0.06 * w;
  return (
    <group position={[0, bob, 0]} rotation={[0, sway, 0]}>
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[0.46, 0.18, 0.26]} />
        <meshStandardMaterial color={PANTS} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.5, 0.62, 0.28]} />
        <meshStandardMaterial color={JACKET} />
      </mesh>
      {/* jacket front: zip + pockets */}
      <mesh position={[0, 1.2, -0.142]}>
        <boxGeometry args={[0.015, 0.6, 0.01]} />
        <meshStandardMaterial color="#1c2230" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={'pk' + s} position={[s * 0.16, 1.0, -0.142]}>
          <boxGeometry args={[0.12, 0.02, 0.01]} />
          <meshStandardMaterial color="#1c2230" />
        </mesh>
      ))}
      {/* cross-body bag strap (front + back) and bag on the hip */}
      <mesh position={[0, 1.2, -0.146]} rotation={[0, 0, 0.55]}>
        <boxGeometry args={[0.05, 0.72, 0.012]} />
        <meshStandardMaterial color="#2a2118" />
      </mesh>
      <mesh position={[0, 1.2, 0.146]} rotation={[0, 0, 0.55]}>
        <boxGeometry args={[0.05, 0.72, 0.012]} />
        <meshStandardMaterial color="#2a2118" />
      </mesh>
      <mesh position={[0.08, 1.02, 0.19]}>
        <boxGeometry args={[0.28, 0.2, 0.1]} />
        <meshStandardMaterial color={LEATHER} roughness={0.8} />
      </mesh>
      <mesh position={[0.08, 1.11, 0.192]}>
        <boxGeometry args={[0.29, 0.05, 0.104]} />
        <meshStandardMaterial color="#3d2f21" roughness={0.8} />
      </mesh>
      <mesh position={[0.08, 1.06, 0.245]}>
        <boxGeometry args={[0.05, 0.06, 0.012]} />
        <meshStandardMaterial color="#9a9a8c" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* scarf + neck */}
      <mesh position={[0, 1.53, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.3]} />
        <meshStandardMaterial color="#9a3a32" />
      </mesh>
      <mesh position={[0, 1.58, 0]}>
        <cylinderGeometry args={[0.065, 0.075, 0.14, 10]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>
      {/* head */}
      <group position={[0, 1.74, 0]}>
        <mesh scale={[1, 1.08, 1]}>
          <sphereGeometry args={[0.19, 20, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.8} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={'ear' + s} position={[s * 0.19, -0.02, 0]}>
            <boxGeometry args={[0.04, 0.09, 0.05]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>
        ))}
        <Face {...face} />
        <Hair />
      </group>
      <Leg x={-0.12} hip={hipA} knee={kneeA} />
      <Leg x={0.12} hip={hipB} knee={kneeB} />
      <Arm x={-0.33} shoulder={-hipA * 0.8} elbow={0.1 + 0.15 * w} />
      <Arm x={0.33} shoulder={-hipB * 0.8} elbow={0.1 + 0.15 * w} />
    </group>
  );
};

/* ---------- Car (front faces +z) ---------- */
const Wheel: React.FC<{x: number; z: number; spin: number}> = ({x, z, spin}) => {
  const out = x > 0 ? 1 : -1;
  return (
    <group position={[x, 0.38, z]} rotation={[spin, 0, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.38, 0.38, 0.26, 20]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.95} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[out * 0.131, 0, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 0.02, 16]} />
        <meshStandardMaterial color="#8a8d92" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[out * 0.14, 0, 0]}>
        <boxGeometry args={[0.02, 0.4, 0.06]} />
        <meshStandardMaterial color="#3a3c40" />
      </mesh>
      <mesh position={[out * 0.14, 0, 0]}>
        <boxGeometry args={[0.02, 0.06, 0.4]} />
        <meshStandardMaterial color="#3a3c40" />
      </mesh>
    </group>
  );
};

export const Car: React.FC<{frame: number; startFrame?: number; still?: boolean}> = ({
  frame,
  startFrame = 210,
  still = false,
}) => {
  const f = Math.max(0, frame - startFrame);
  const z = still
    ? 0
    : interpolate(f, [0, 80], [-48, -28], {
        easing: Easing.out(Easing.cubic),
        extrapolateRight: 'clamp',
        extrapolateLeft: 'clamp',
      });
  const spin = still ? 0 : (z + 48) / 0.38;

  const bodyGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-2.2, 0.35);
    s.lineTo(2.2, 0.35);
    s.lineTo(2.2, 0.82);
    s.lineTo(1.3, 0.95);
    s.lineTo(0.55, 1.5);
    s.lineTo(-0.8, 1.5);
    s.lineTo(-1.5, 0.95);
    s.lineTo(-2.2, 0.92);
    s.lineTo(-2.2, 0.35);
    const g = new THREE.ExtrudeGeometry(s, {depth: 1.9, bevelEnabled: false});
    g.translate(0, 0, -0.95);
    g.rotateY(-Math.PI / 2);
    return g;
  }, []);

  const glassGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(1.242, 1.0);
    s.lineTo(0.669, 1.42);
    s.lineTo(-0.912, 1.42);
    s.lineTo(-1.446, 1.0);
    s.lineTo(1.242, 1.0);
    const g = new THREE.ExtrudeGeometry(s, {depth: 1.94, bevelEnabled: false});
    g.translate(0, 0, -0.97);
    g.rotateY(-Math.PI / 2);
    return g;
  }, []);

  return (
    <group position={[still ? 0 : -1.8, 0, z]}>
      <mesh geometry={bodyGeo}>
        <meshStandardMaterial color="#1c2636" metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh geometry={glassGeo}>
        <meshStandardMaterial color="#0a0f16" metalness={0.8} roughness={0.15} />
      </mesh>
      {/* bumpers, grille, plates */}
      <mesh position={[0, 0.45, 2.2]}>
        <boxGeometry args={[1.95, 0.2, 0.12]} />
        <meshStandardMaterial color="#0b0b0d" />
      </mesh>
      <mesh position={[0, 0.45, -2.2]}>
        <boxGeometry args={[1.95, 0.2, 0.12]} />
        <meshStandardMaterial color="#0b0b0d" />
      </mesh>
      <mesh position={[0, 0.65, 2.21]}>
        <boxGeometry args={[0.9, 0.14, 0.04]} />
        <meshStandardMaterial color="#050506" />
      </mesh>
      <mesh position={[0, 0.45, 2.27]}>
        <boxGeometry args={[0.5, 0.12, 0.02]} />
        <meshStandardMaterial color="#d8d8cc" />
      </mesh>
      <mesh position={[0, 0.45, -2.27]}>
        <boxGeometry args={[0.5, 0.12, 0.02]} />
        <meshStandardMaterial color="#d8d8cc" />
      </mesh>
      <mesh position={[0.6, 0.36, -2.32]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.2, 10]} />
        <meshStandardMaterial color="#555a60" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* sides: door seams, handles, skirts, mirrors */}
      {[-1, 1].map((s) => (
        <React.Fragment key={'side' + s}>
          {[0.95, -0.1, -1.15].map((dz) => (
            <mesh key={dz} position={[s * 0.957, 0.72, dz]}>
              <boxGeometry args={[0.012, 0.46, 0.02]} />
              <meshStandardMaterial color="#070a10" />
            </mesh>
          ))}
          {[0.45, -0.65].map((dz) => (
            <mesh key={'h' + dz} position={[s * 0.965, 0.88, dz]}>
              <boxGeometry args={[0.03, 0.04, 0.2]} />
              <meshStandardMaterial color="#8a8d92" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          <mesh position={[s * 0.96, 0.42, 0]}>
            <boxGeometry args={[0.04, 0.1, 2.6]} />
            <meshStandardMaterial color="#0b0b0d" />
          </mesh>
          <mesh position={[s * 1.02, 1.08, 0.75]}>
            <boxGeometry args={[0.1, 0.1, 0.18]} />
            <meshStandardMaterial color="#1c2636" />
          </mesh>
        </React.Fragment>
      ))}
      <Wheel x={-0.88} z={1.35} spin={spin} />
      <Wheel x={0.88} z={1.35} spin={spin} />
      <Wheel x={-0.88} z={-1.35} spin={spin} />
      <Wheel x={0.88} z={-1.35} spin={spin} />
      {/* headlights, beams, taillights */}
      {[-0.65, 0.65].map((hx) => (
        <React.Fragment key={hx}>
          <mesh position={[hx, 0.7, 2.21]}>
            <boxGeometry args={[0.38, 0.14, 0.06]} />
            <meshStandardMaterial color="white" emissive="#fff6d0" emissiveIntensity={6} />
          </mesh>
          {!still && (
            <mesh position={[hx, 0.7, 6.7]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[1.3, 9, 20, 1, true]} />
              <meshBasicMaterial
                color="#fff0c0"
                transparent
                opacity={0.07}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
          <mesh position={[hx * 1.05, 0.76, -2.21]}>
            <boxGeometry args={[0.4, 0.1, 0.05]} />
            <meshStandardMaterial color="#440000" emissive="#ff1a1a" emissiveIntensity={2} />
          </mesh>
        </React.Fragment>
      ))}
      {!still && <pointLight position={[0, 0.8, 3.4]} intensity={30} distance={11} color="#fff2cc" />}
    </group>
  );
};

/* ---------- Street (the whole town set) ---------- */
export const Street: React.FC<{detail?: boolean}> = ({detail = false}) => {
  const houses = [0, 1, 2, 3, 4, 5, 6];
  return (
    <>
      <fog attach="fog" args={[HORIZON, 8, 48]} />
      <hemisphereLight args={['#ffdca8', '#3a3028', 0.55]} />
      <ambientLight intensity={0.3} color="#ffd9a0" />
      <directionalLight position={[0, 6, -50]} intensity={0.7} color="#ffbf80" />
      <directionalLight position={[3, 5, 12]} intensity={0.9} color="#ffd9b0" />
      <Sky />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -80]}>
        <planeGeometry args={[7, 240]} />
        <meshStandardMaterial color="#3a3836" roughness={1} />
      </mesh>
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <mesh position={[s * 3.6, 0.06, -80]}>
            <boxGeometry args={[0.2, 0.12, 240]} />
            <meshStandardMaterial color="#7d786e" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s * 4.7, 0.05, -80]}>
            <planeGeometry args={[2, 240]} />
            <meshStandardMaterial color="#9a9486" roughness={1} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s * 18, 0, -80]}>
            <planeGeometry args={[24.6, 240]} />
            <meshStandardMaterial color="#4a6b35" roughness={1} />
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
          <House x={12.5} z={6 - i * 10} idx={i} side={1} full={detail} />
          <House x={-12.5} z={3 - i * 10} idx={i + 3} side={-1} full={detail} />
          <Tree x={7.5} z={1 - i * 10} s={0.9 + (i % 3) * 0.12} />
          <Tree x={-7.5} z={-2 - i * 10} s={1.0 + ((i + 1) % 3) * 0.1} />
        </React.Fragment>
      ))}

      {Array.from({length: 7}).map((_, i) => (
        <React.Fragment key={'lp' + i}>
          <Lamp x={5.2} z={2 - i * 14} light={i < 3} />
          <Lamp x={-5.2} z={-5 - i * 14} />
        </React.Fragment>
      ))}
    </>
  );
};

/* ---------- Story frame: portrait canvas + captions ---------- */
export type CaptionDef = {from: number; dur: number; text: string};

export const StoryFrame: React.FC<{captions: CaptionDef[]; children: React.ReactNode; overlay?: React.ReactNode}> = ({captions, children, overlay}) => (
  <AbsoluteFill style={{backgroundColor: HORIZON}}>
    <ThreeCanvas width={1080} height={1920} camera={{fov: 62, position: [0, 2, 8], near: 0.1, far: 220}}>
      {children}
    </ThreeCanvas>
    {overlay}
    {captions.map((c, i) => (
      <Sequence key={i} from={c.from} durationInFrames={c.dur}>
        <Caption dur={c.dur} text={c.text} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

/* ---------- Turnaround sheet: 4 views (front, side, back, side) ---------- */
export const Sheet: React.FC<{
  cols: number;
  sx: number;
  sz: number;
  dist: number;
  lookY: number;
  base: number;
  children: React.ReactNode;
}> = ({cols, sx, sz, dist, lookY, base, children}) => {
  const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
  const rows = Math.ceil(4 / cols);
  return (
    <AbsoluteFill style={{backgroundColor: '#2a2c30'}}>
      <ThreeCanvas width={1920} height={1080} camera={{fov: 30, position: [0, 3, 10], near: 0.1, far: 300}}>
        <color attach="background" args={['#2a2c30']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 8, 8]} intensity={1.1} />
        <directionalLight position={[-6, 4, -6]} intensity={0.6} />
        <Rig pos={[0, lookY + dist * 0.3, dist]} look={[0, lookY, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color="#383b41" roughness={1} />
        </mesh>
        {angles.map((a, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          const x = (c - (cols - 1) / 2) * sx;
          const z = (r - (rows - 1) / 2) * sz;
          return (
            <group key={i} position={[x, 0, z]} rotation={[0, a + base, 0]}>
              {children}
            </group>
          );
        })}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
