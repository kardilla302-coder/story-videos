import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';

const CUT_FRAME = 210;
const CAR_START = -48;
const CAR_END = -30;

/* ---------- Captions ---------- */
const Caption: React.FC<{text: string; dur: number}> = ({text, dur}) => {
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
const Rig: React.FC<{pos: [number, number, number]; look: [number, number, number]}> = ({pos, look}) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(...pos);
  camera.lookAt(...look);
  return null;
};

/* ---------- Gable roof geometry ---------- */
const gableShape = new THREE.Shape();
gableShape.moveTo(-2.9, 0);
gableShape.lineTo(2.9, 0);
gableShape.lineTo(0, 1.9);
gableShape.closePath();
const gableGeo = new THREE.ExtrudeGeometry(gableShape, {depth: 6.6, bevelEnabled: false});
gableGeo.translate(0, 0, -3.3);

/* ---------- House ---------- */
const House: React.FC<{x: number; z: number; color: string; side: 1 | -1; lit: boolean[]}> = ({
  x,
  z,
  color,
  side,
  lit,
}) => {
  const dir = -side; // direction toward the street
  const rotY = (dir * Math.PI) / 2;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[5, 4, 6]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh geometry={gableGeo} position={[0, 4, 0]}>
        <meshStandardMaterial color="#2a2623" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[1.2, 5.4, 1.8]}>
        <boxGeometry args={[0.6, 1.6, 0.6]} />
        <meshStandardMaterial color="#3a2f2a" />
      </mesh>
      {/* door */}
      <mesh position={[dir * 2.51, 1.0, 0]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[1.0, 2.0]} />
        <meshStandardMaterial color="#3b2418" />
      </mesh>
      <mesh position={[dir * 2.9, 0.07, 0]}>
        <boxGeometry args={[0.8, 0.15, 1.6]} />
        <meshStandardMaterial color="#6f6a60" />
      </mesh>
      <mesh position={[dir * 2.6, 2.3, 0.9]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#fff0c0" emissive="#ffc260" emissiveIntensity={3} />
      </mesh>
      {/* windows */}
      {[-1.8, 1.8].map((wz, k) => (
        <React.Fragment key={wz}>
          <mesh position={[dir * 2.505, 2.5, wz]} rotation={[0, rotY, 0]}>
            <planeGeometry args={[1.1, 1.4]} />
            <meshStandardMaterial color="#17120e" />
          </mesh>
          <mesh position={[dir * 2.515, 2.5, wz]} rotation={[0, rotY, 0]}>
            <planeGeometry args={[0.9, 1.2]} />
            <meshStandardMaterial
              color={lit[k] ? '#ffcf7a' : '#2b3138'}
              emissive={lit[k] ? '#ffb347' : '#000000'}
              emissiveIntensity={lit[k] ? 1.6 : 0}
            />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
};

/* ---------- Street lamp ---------- */
const Lamp: React.FC<{x: number; z: number; light?: boolean}> = ({x, z, light}) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, 2.2, 0]}>
      <cylinderGeometry args={[0.07, 0.1, 4.4, 8]} />
      <meshStandardMaterial color="#1b1b1b" />
    </mesh>
    <mesh position={[0, 0.15, 0]}>
      <cylinderGeometry args={[0.18, 0.22, 0.3, 8]} />
      <meshStandardMaterial color="#1b1b1b" />
    </mesh>
    <mesh position={[-0.3, 4.42, 0]}>
      <boxGeometry args={[0.7, 0.06, 0.06]} />
      <meshStandardMaterial color="#1b1b1b" />
    </mesh>
    <mesh position={[-0.65, 4.32, 0]}>
      <sphereGeometry args={[0.24, 12, 12]} />
      <meshStandardMaterial color="#fff0c0" emissive="#ffd27a" emissiveIntensity={3} />
    </mesh>
    <mesh position={[-0.65, 4.32, 0]}>
      <sphereGeometry args={[0.85, 12, 12]} />
      <meshBasicMaterial
        color="#ffcf80"
        transparent
        opacity={0.12}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
    {light && <pointLight position={[-0.65, 4.1, 0]} intensity={30} distance={14} color="#ffc680" />}
  </group>
);

/* ---------- Tree ---------- */
const Tree: React.FC<{x: number; z: number; s: number}> = ({x, z, s}) => (
  <group position={[x, 0, z]} scale={s}>
    <mesh position={[0, 1, 0]}>
      <cylinderGeometry args={[0.14, 0.2, 2, 8]} />
      <meshStandardMaterial color="#2e2118" />
    </mesh>
    <mesh position={[0, 2.8, 0]}>
      <icosahedronGeometry args={[1.1, 1]} />
      <meshStandardMaterial color="#2f3f22" flatShading />
    </mesh>
    <mesh position={[0.5, 2.2, 0.3]}>
      <icosahedronGeometry args={[0.75, 1]} />
      <meshStandardMaterial color="#3a4a28" flatShading />
    </mesh>
    <mesh position={[-0.5, 2.4, -0.3]}>
      <icosahedronGeometry args={[0.8, 1]} />
      <meshStandardMaterial color="#2a381e" flatShading />
    </mesh>
  </group>
);

/* ---------- Fence ---------- */
const Fence: React.FC<{x: number}> = ({x}) => (
  <group position={[x, 0, -25]}>
    <mesh position={[0, 0.72, 0]}>
      <boxGeometry args={[0.05, 0.06, 110]} />
      <meshStandardMaterial color="#6e6558" />
    </mesh>
    <mesh position={[0, 0.34, 0]}>
      <boxGeometry args={[0.05, 0.06, 110]} />
      <meshStandardMaterial color="#6e6558" />
    </mesh>
    {Array.from({length: 55}).map((_, i) => (
      <mesh key={i} position={[0, 0.45, -50 + i * 2]}>
        <boxGeometry args={[0.1, 0.9, 0.1]} />
        <meshStandardMaterial color="#7a7164" />
      </mesh>
    ))}
  </group>
);

/* ---------- Daniel ---------- */
const SKIN = '#b9855c';
const HAIR = '#1d140e';
const COAT = '#252a35';

const Person: React.FC<{frame: number}> = ({frame}) => {
  const swing = Math.sin(frame * 0.38) * 0.6;
  const bob = Math.abs(Math.sin(frame * 0.38)) * 0.05;
  const scarfSway = Math.sin(frame * 0.2) * 0.25;
  return (
    <group>
      {/* soft blob shadow on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[0.6, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} depthWrite={false} />
      </mesh>

      <group position={[0, bob, 0]}>
        {/* long coat */}
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.27, 0.34, 1.15, 14]} />
          <meshStandardMaterial color={COAT} roughness={0.9} />
        </mesh>
        {/* shoulders */}
        <mesh position={[0, 1.72, 0]} scale={[1.45, 0.55, 0.85]}>
          <sphereGeometry args={[0.24, 14, 12]} />
          <meshStandardMaterial color={COAT} roughness={0.9} />
        </mesh>
        {/* neck + scarf */}
        <mesh position={[0, 1.82, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.14, 10]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
        <mesh position={[0, 1.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.14, 0.055, 8, 18]} />
          <meshStandardMaterial color="#7a1f24" roughness={1} />
        </mesh>
        <group position={[0.06, 1.74, 0.17]} rotation={[scarfSway, 0, 0]}>
          <mesh position={[0, -0.25, 0.04]}>
            <boxGeometry args={[0.12, 0.5, 0.04]} />
            <meshStandardMaterial color="#7a1f24" roughness={1} />
          </mesh>
        </group>

        {/* head */}
        <group position={[0, 2.02, 0]}>
          <mesh scale={[1, 1.12, 1]}>
            <sphereGeometry args={[0.2, 24, 20]} />
            <meshStandardMaterial color={SKIN} roughness={0.8} />
          </mesh>
          {/* ears */}
          {[-1, 1].map((e) => (
            <mesh key={e} position={[e * 0.2, -0.01, 0.0]} scale={[0.5, 1, 0.8]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color={SKIN} />
            </mesh>
          ))}
          {/* eyes (visible when he turns around later) */}
          {[-1, 1].map((e) => (
            <mesh key={e} position={[e * 0.075, 0.02, -0.185]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshBasicMaterial color="#0a0a0a" />
            </mesh>
          ))}
          {/* HAIR: top cap, hairline sits high on forehead */}
          <mesh position={[0, 0.015, 0.01]} scale={[1, 1.12, 1.04]}>
            <sphereGeometry args={[0.215, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
            <meshStandardMaterial color={HAIR} roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
          {/* HAIR: sides + back, fades into a tapered nape, leaves the face open */}
          <mesh position={[0, 0.015, 0.01]} scale={[1, 1.12, 1.04]}>
            <sphereGeometry
              args={[0.208, 24, 16, -Math.PI * 0.2, Math.PI * 1.4, Math.PI * 0.4, Math.PI * 0.27]}
            />
            <meshStandardMaterial color={HAIR} roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
          {/* swept fringe / quiff */}
          <mesh position={[0.03, 0.2, -0.1]} rotation={[-0.35, 0, -0.15]} scale={[1, 0.4, 0.75]}>
            <sphereGeometry args={[0.13, 12, 10]} />
            <meshStandardMaterial color="#2a1c13" roughness={0.6} />
          </mesh>
        </group>

        {/* legs */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.13, 0.95, 0]} rotation={[s * swing, 0, 0]}>
            <mesh position={[0, -0.42, 0]}>
              <capsuleGeometry args={[0.09, 0.62, 4, 10]} />
              <meshStandardMaterial color="#14161b" roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.88, -0.05]}>
              <boxGeometry args={[0.17, 0.14, 0.34]} />
              <meshStandardMaterial color="#0c0c0c" roughness={0.5} />
            </mesh>
          </group>
        ))}

        {/* arms */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.34, 1.68, 0]} rotation={[-s * swing * 0.8, 0, 0]}>
            <mesh position={[0, -0.33, 0]}>
              <capsuleGeometry args={[0.075, 0.5, 4, 10]} />
              <meshStandardMaterial color={COAT} roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.68, 0]}>
              <sphereGeometry args={[0.075, 10, 10]} />
              <meshStandardMaterial color={SKIN} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

/* ---------- Mystery car ---------- */
const Wheel: React.FC<{x: number; z: number; spin: number}> = ({x, z, spin}) => {
  const out = x > 0 ? 1 : -1;
  return (
    <group position={[x, 0.34, z]}>
      <group rotation={[spin, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.26, 22]} />
          <meshStandardMaterial color="#0b0b0b" roughness={0.95} />
        </mesh>
        <mesh position={[out * 0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.19, 0.19, 0.04, 18]} />
          <meshStandardMaterial color="#8c8f94" metalness={0.8} roughness={0.35} />
        </mesh>
        <mesh position={[out * 0.165, 0, 0]}>
          <boxGeometry args={[0.03, 0.32, 0.06]} />
          <meshStandardMaterial color="#555a60" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[out * 0.165, 0, 0]}>
          <boxGeometry args={[0.03, 0.06, 0.32]} />
          <meshStandardMaterial color="#555a60" metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
};

const Car: React.FC<{frame: number}> = ({frame}) => {
  const f = Math.max(0, frame - CUT_FRAME);
  const z = interpolate(f, [0, 75], [CAR_START, CAR_END], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const spin = (z - CAR_START) / 0.34;
  const stopped = f > 75;
  const body = '#1c2430';
  return (
    <group position={[-1.8, 0, z]}>
      {/* lower body */}
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[1.9, 0.55, 4.3]} />
        <meshStandardMaterial color={body} metalness={0.55} roughness={0.35} />
      </mesh>
      {/* hood + trunk slight raise */}
      <mesh position={[0, 0.92, 1.35]}>
        <boxGeometry args={[1.8, 0.1, 1.4]} />
        <meshStandardMaterial color={body} metalness={0.55} roughness={0.35} />
      </mesh>
      {/* cabin */}
      <mesh position={[0, 1.2, -0.15]}>
        <boxGeometry args={[1.62, 0.52, 2.1]} />
        <meshStandardMaterial color={body} metalness={0.55} roughness={0.3} />
      </mesh>
      {/* glass */}
      <mesh position={[0, 1.22, 0.91]} rotation={[-0.25, 0, 0]}>
        <planeGeometry args={[1.45, 0.42]} />
        <meshStandardMaterial color="#0d1219" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.22, -1.22]} rotation={[0.25, Math.PI, 0]}>
        <planeGeometry args={[1.45, 0.42]} />
        <meshStandardMaterial color="#0d1219" metalness={0.9} roughness={0.1} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.815, 1.22, -0.15]} rotation={[0, (s * Math.PI) / 2, 0]}>
          <planeGeometry args={[1.8, 0.38]} />
          <meshStandardMaterial color="#0d1219" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
      {/* mirrors */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.0, 1.02, 0.75]}>
          <boxGeometry args={[0.14, 0.1, 0.2]} />
          <meshStandardMaterial color={body} />
        </mesh>
      ))}
      {/* grille + bumper + plate */}
      <mesh position={[0, 0.5, 2.16]}>
        <boxGeometry args={[1.7, 0.22, 0.1]} />
        <meshStandardMaterial color="#07090c" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.5, 2.22]}>
        <boxGeometry args={[0.45, 0.14, 0.02]} />
        <meshStandardMaterial color="#e8e4d8" />
      </mesh>
      {/* headlights + beams */}
      {[-0.65, 0.65].map((hx) => (
        <React.Fragment key={hx}>
          <mesh position={[hx, 0.7, 2.16]}>
            <boxGeometry args={[0.32, 0.18, 0.06]} />
            <meshStandardMaterial color="white" emissive="#fff6d0" emissiveIntensity={6} />
          </mesh>
          <mesh position={[hx, 0.68, 2.2 + 4.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[1.5, 9, 24, 1, true]} />
            <meshBasicMaterial
              color="#fff2c0"
              transparent
              opacity={0.1}
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <pointLight position={[hx, 0.8, 3.2]} intensity={22} distance={10} color="#fff2cc" />
        </React.Fragment>
      ))}
      {/* tail lights */}
      {[-0.7, 0.7].map((hx) => (
        <mesh key={hx} position={[hx, 0.75, -2.16]}>
          <boxGeometry args={[0.4, 0.14, 0.05]} />
          <meshStandardMaterial
            color="#ff2020"
            emissive="#ff1010"
            emissiveIntensity={stopped ? 4 : 1.2}
          />
        </mesh>
      ))}
      {/* wheels */}
      <Wheel x={-0.95} z={1.4} spin={spin} />
      <Wheel x={0.95} z={1.4} spin={spin} />
      <Wheel x={-0.95} z={-1.4} spin={spin} />
      <Wheel x={0.95} z={-1.4} spin={spin} />
      {/* ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[2.3, 4.6]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
};

/* ---------- World ---------- */
const houseColors = ['#4a5560', '#6b5b4a', '#52605a', '#5d4f55', '#4b5666'];

const World: React.FC<{frame: number}> = ({frame}) => {
  const walkZ = interpolate(frame, [0, CUT_FRAME], [4, -26], {extrapolateRight: 'clamp'});
  const walkX = 4.4; // on the right sidewalk
  const shot2 = frame >= CUT_FRAME;
  const f2 = Math.max(0, frame - CUT_FRAME);

  const camPos: [number, number, number] = shot2
    ? [3.4, 1.0, -14 - f2 * 0.02]
    : [3.0 + Math.sin(frame * 0.03) * 0.15, 2.0, walkZ + 4.2];
  const camLook: [number, number, number] = shot2 ? [-1.8, 1.1, -34] : [walkX, 1.4, walkZ - 3];

  return (
    <>
      <color attach="background" args={['#c9a66b']} />
      <fog attach="fog" args={['#c9a66b', 6, 40]} />
      <ambientLight intensity={0.55} color="#ffd9a0" />
      <directionalLight position={[-6, 8, 4]} intensity={0.6} color="#ffbf80" />
      <Rig pos={camPos} look={camLook} />

      {/* hazy sun on the horizon (ignores fog) */}
      <mesh position={[6, 14, -110]}>
        <circleGeometry args={[8, 32]} />
        <meshBasicMaterial color="#ffe3a3" transparent opacity={0.55} fog={false} />
      </mesh>

      {/* road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]}>
        <planeGeometry args={[7, 130]} />
        <meshStandardMaterial color="#26231f" roughness={0.7} />
      </mesh>
      {/* road edge lines */}
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[s * 3.2, 0.011, -20]}>
          <planeGeometry args={[0.1, 130]} />
          <meshStandardMaterial color="#a89f8a" roughness={1} />
        </mesh>
      ))}
      {/* dashed centre line */}
      {Array.from({length: 30}).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 10 - i * 4]}>
          <planeGeometry args={[0.15, 1.8]} />
          <meshStandardMaterial color="#c9b36a" roughness={1} />
        </mesh>
      ))}
      {/* curbs */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 3.6, 0.07, -20]}>
          <boxGeometry args={[0.2, 0.14, 130]} />
          <meshStandardMaterial color="#6f6a60" roughness={1} />
        </mesh>
      ))}
      {/* sidewalks */}
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[s * 4.6, 0.02, -20]}>
          <planeGeometry args={[2.2, 130]} />
          <meshStandardMaterial color="#8a8478" roughness={1} />
        </mesh>
      ))}
      {/* grass */}
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[s * 14, -0.01, -20]}>
          <planeGeometry args={[18, 130]} />
          <meshStandardMaterial color="#3d4a2a" roughness={1} />
        </mesh>
      ))}

      {/* houses */}
      {Array.from({length: 9}).map((_, i) => (
        <React.Fragment key={i}>
          <House
            x={-10}
            z={6 - i * 9}
            color={houseColors[i % 5]}
            side={-1}
            lit={[i % 3 !== 0, (i + 1) % 2 === 0]}
          />
          <House
            x={10}
            z={3 - i * 9}
            color={houseColors[(i + 2) % 5]}
            side={1}
            lit={[(i + 1) % 3 !== 0, i % 2 === 0]}
          />
        </React.Fragment>
      ))}

      {/* fences, trees, lamps */}
      <Fence x={-7.1} />
      <Fence x={7.1} />
      {Array.from({length: 9}).map((_, i) => (
        <React.Fragment key={i}>
          <Tree x={-6.0} z={1 - i * 9} s={0.95 + (i % 3) * 0.12} />
          <Tree x={6.0} z={-3 - i * 9} s={0.9 + ((i + 1) % 3) * 0.12} />
        </React.Fragment>
      ))}
      {Array.from({length: 9}).map((_, i) => (
        <Lamp key={i} x={5.6} z={2 - i * 9} light={i % 2 === 0} />
      ))}

      {/* Daniel */}
      <group position={[walkX, 0, walkZ]} visible={!shot2}>
        <Person frame={frame} />
      </group>

      <Car frame={frame} />
    </>
  );
};

/* ---------- Composition ---------- */
export const Daniel: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: '#c9a66b'}}>
      <ThreeCanvas width={1080} height={1920} camera={{fov: 55, position: [0, 2, 8], near: 0.1, far: 200}}>
        <World frame={frame} />
      </ThreeCanvas>

      {/* cinematic vignette */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <Sequence from={0} durationInFrames={90}>
        <Caption dur={90} text="Everyone in town knew Daniel was a quiet man." />
      </Sequence>
      <Sequence from={90} durationInFrames={110}>
        <Caption dur={110} text="Home at exactly 6 PM. Never spoke to his neighbours." />
      </Sequence>
      <Sequence from={210} durationInFrames={90}>
        <Caption dur={90} text="But one night... a car stopped outside." />
      </Sequence>
    </AbsoluteFill>
  );
};
