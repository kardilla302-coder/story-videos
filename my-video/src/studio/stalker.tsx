import React from 'react';

const SUIT = '#0b0b0e';
const PALE = '#d9d5cb';

const Limb: React.FC<{x: number; y: number; a: number; b: number}> = ({x, y, a, b}) => (
  <group position={[x, y, 0]} rotation={[a, 0, 0]}>
    <mesh position={[0, -0.28, 0]}>
      <boxGeometry args={[0.13, 0.56, 0.13]} />
      <meshStandardMaterial color={SUIT} roughness={0.9} />
    </mesh>
    <group position={[0, -0.56, 0]} rotation={[b, 0, 0]}>
      <mesh position={[0, -0.28, 0]}>
        <boxGeometry args={[0.11, 0.56, 0.11]} />
        <meshStandardMaterial color={SUIT} roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.56, -0.08]}>
        <boxGeometry args={[0.13, 0.07, 0.3]} />
        <meshStandardMaterial color="#050506" />
      </mesh>
    </group>
  </group>
);

const Arm: React.FC<{x: number; a: number; b: number}> = ({x, a, b}) => (
  <group position={[x, 0.82, 0]} rotation={[a, 0, 0]}>
    <mesh position={[0, -0.29, 0]}>
      <boxGeometry args={[0.09, 0.58, 0.09]} />
      <meshStandardMaterial color={SUIT} roughness={0.9} />
    </mesh>
    <group position={[0, -0.58, 0]} rotation={[b, 0, 0]}>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[0.08, 0.6, 0.08]} />
        <meshStandardMaterial color={SUIT} roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.64, 0]}>
        <boxGeometry args={[0.07, 0.1, 0.04]} />
        <meshStandardMaterial color={PALE} />
      </mesh>
      {[-0.025, -0.008, 0.008, 0.025].map((fx, i) => (
        <mesh key={i} position={[fx, -0.76 - (i % 2) * 0.02, 0]}>
          <boxGeometry args={[0.011, 0.16, 0.011]} />
          <meshStandardMaterial color={PALE} />
        </mesh>
      ))}
    </group>
  </group>
);

const Head: React.FC<{mouth: number}> = ({mouth}) => (
  <group>
    <mesh scale={[0.95, 1.35, 0.95]}>
      <sphereGeometry args={[0.15, 18, 14]} />
      <meshStandardMaterial color={PALE} roughness={0.7} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.055, 0.04, -0.125]} scale={[1, 1.7, 0.5]}>
        <sphereGeometry args={[0.028, 10, 10]} />
        <meshStandardMaterial color="#050505" />
      </mesh>
    ))}
    {[-1, -0.5, 0, 0.5, 1].map((u) => (
      <mesh key={u} position={[u * 0.07, -0.085 + 0.04 * u * u, -0.131]} rotation={[0, 0, Math.atan(1.1 * u)]}>
        <boxGeometry args={[0.04, 0.008, 0.01]} />
        <meshStandardMaterial color="#080808" />
      </mesh>
    ))}
    {mouth > 0.05 && (
      <mesh position={[0, -0.095, -0.13]} scale={[2.2, mouth * 2.6, 0.5]}>
        <sphereGeometry args={[0.028, 10, 10]} />
        <meshStandardMaterial color="#030303" />
      </mesh>
    )}
  </group>
);

// Tall, thin, pale-faced. Faces -z like Daniel. lean: 0 = upright, 1 = bent over to whisper in his ear.
export const Stalker: React.FC<{phase: number; walk?: number; lean?: number; mouth?: number}> = ({
  phase,
  walk = 1,
  lean = 0,
  mouth = 0,
}) => {
  const w = Math.min(1.2, walk);
  const sA = Math.sin(phase) * 0.42 * w;
  const kA = -Math.max(0, Math.cos(phase)) * 0.55 * w;
  const kB = -Math.max(0, Math.cos(phase + Math.PI)) * 0.55 * w;
  const bob = Math.abs(Math.cos(phase)) * 0.03 * w;
  const a = -1.05 * lean;
  const tilt = 0.17 * (1 - lean);
  return (
    <group position={[0, bob, 0]}>
      <Limb x={-0.1} y={1.12} a={sA} b={kA} />
      <Limb x={0.1} y={1.12} a={-sA} b={kB} />
      <group position={[0, 1.12, 0]} rotation={[a, 0, 0]}>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.34, 0.85, 0.2]} />
          <meshStandardMaterial color={SUIT} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.93, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.14, 8]} />
          <meshStandardMaterial color={PALE} />
        </mesh>
        <Arm x={-0.26} a={-sA * 0.7 - a} b={0.08} />
        <Arm x={0.26} a={sA * 0.7 - a} b={0.08} />
        <group position={[0, 1.18, 0]} rotation={[-a, (Math.PI / 2) * lean, tilt]}>
          <Head mouth={mouth} />
        </group>
      </group>
    </group>
  );
};
