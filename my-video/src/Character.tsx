import React from "react";
import * as THREE from "three";
import { interpolate } from "remotion";

type V3 = [number, number, number];
type Kind = "sphere" | "capsule";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Geo: React.FC<{ kind: Kind; args: number[] }> = ({ kind, args }) =>
  kind === "sphere" ? (
    <sphereGeometry args={args as any} />
  ) : (
    <capsuleGeometry args={args as any} />
  );

const Blob: React.FC<{
  kind: Kind;
  args: number[];
  color: string;
  pos?: V3;
  scale?: V3;
  ol?: number;
}> = ({ kind, args, color, pos = [0, 0, 0], scale = [1, 1, 1], ol = 0.07 }) => (
  <group position={pos} scale={scale}>
    <mesh>
      <Geo kind={kind} args={args} />
      <meshStandardMaterial color={color} />
    </mesh>
    {ol > 0 && (
      <mesh scale={1 + ol}>
        <Geo kind={kind} args={args} />
        <meshBasicMaterial color="#000000" side={THREE.BackSide} />
      </mesh>
    )}
  </group>
);

export const Hero: React.FC<{ z: number; frame: number; walking?: boolean }> = ({ z, frame }) => {
  const SKIN = "#f2c9a0";
  const SHIRT = "#ff7a2f";
  const PANTS = "#2d3a8c";
  const SHOE = "#f5f5f5";
  const HAT = "#ffd23f";

  const t = frame / 4.5;
  const w = interpolate(frame, [80, 95], [1, 0], clamp);
  const bob = Math.abs(Math.sin(t)) * 0.09 * w;
  const lean = 0.12 * w;
  const twist = Math.sin(t) * 0.12 * w;
  const hipA = -Math.sin(t) * 0.65 * w;
  const hipB = Math.sin(t) * 0.65 * w;
  const kneeA = Math.max(0, Math.cos(t)) * 0.9 * w;
  const kneeB = Math.max(0, -Math.cos(t)) * 0.9 * w;
  const sway = Math.sin(frame / 20) * 0.03;
  const armL = Math.sin(t) * 0.6 * w + sway;
  const armR = -Math.sin(t) * 0.6 * w - sway;
  const elbow = -(0.15 + 0.3 * w);

  const sy = interpolate(frame, [88, 93, 105], [1, 0.9, 1], clamp);
  const sx = 1 + (1 - sy) * 0.8;
  const breathe = 1 + Math.sin(frame / 10) * 0.012;

  const shock = interpolate(frame, [150, 155, 190], [0, 1, 0.4], clamp);
  const shake =
    Math.sin(frame / 3) * 0.25 * interpolate(frame, [150, 156, 185, 195], [0, 1, 1, 0], clamp);
  const pitch = interpolate(frame, [70, 85, 150, 160], [0, -0.1, -0.1, 0.05], clamp);
  const headY = Math.sin(frame / 35) * 0.12 + Math.sin(t) * 0.06 * w + shake;
  const headZ = interpolate(frame, [150, 160, 200], [0, 0.22, 0.1], clamp);
  const blink = frame % 64 < 4 ? 0.08 : 1;
  const eyeS = 1 + 0.3 * shock;
  const lookX = Math.sin(frame / 50) * 0.04;

  const Leg: React.FC<{ x: number; hip: number; knee: number }> = ({ x, hip, knee }) => (
    <group position={[x, 0.9, 0]} rotation={[hip, 0, 0]}>
      <Blob kind="capsule" args={[0.16, 0.15, 6, 12]} color={PANTS} pos={[0, -0.23, 0]} />
      <group position={[0, -0.42, 0]} rotation={[knee, 0, 0]}>
        <Blob kind="capsule" args={[0.15, 0.1, 6, 12]} color={PANTS} pos={[0, -0.2, 0]} />
        <Blob kind="sphere" args={[0.2, 20, 14]} color={SHOE} pos={[0, -0.36, 0.07]} scale={[1, 0.6, 1.5]} ol={0.1} />
      </group>
    </group>
  );

  const Arm: React.FC<{ x: number; swing: number }> = ({ x, swing }) => (
    <group position={[x, 1.05, 0]} rotation={[swing, 0, x > 0 ? -0.08 : 0.08]}>
      <Blob kind="capsule" args={[0.13, 0.2, 6, 12]} color={SHIRT} pos={[0, -0.23, 0]} />
      <group position={[0, -0.42, 0]} rotation={[elbow, 0, 0]}>
        <Blob kind="capsule" args={[0.12, 0.15, 6, 12]} color={SHIRT} pos={[0, -0.2, 0]} />
        <Blob kind="sphere" args={[0.15, 16, 12]} color={SKIN} pos={[0, -0.42, 0]} ol={0.15} />
      </group>
    </group>
  );

  return (
    <group position={[0, bob, z]} scale={[sx, sy, sx]}>
      <Leg x={-0.2} hip={hipA} knee={kneeA} />
      <Leg x={0.2} hip={hipB} knee={kneeB} />
      <group position={[0, 0.9, 0]} rotation={[lean, twist, 0]} scale={[1, breathe, 1]}>
        <Blob kind="capsule" args={[0.42, 0.5, 8, 16]} color={SHIRT} pos={[0, 0.55, 0]} />
        <Arm x={-0.62} swing={armL} />
        <Arm x={0.62} swing={armR} />
        <group position={[0, 1.55, 0]} rotation={[pitch, headY, headZ]}>
          <Blob kind="sphere" args={[0.65, 32, 24]} color={SKIN} scale={[1, 1.05, 0.95]} />
          {[-1, 1].map((s) => (
            <group key={s}>
              <Blob kind="sphere" args={[0.17, 20, 14]} color="#ffffff" pos={[s * 0.23, 0.02, 0.54]} scale={[1, 1.2 * eyeS * blink, 0.5]} ol={0} />
              <Blob kind="sphere" args={[0.08, 16, 12]} color="#111111" pos={[s * 0.23 + lookX, 0.02, 0.6]} scale={[1, 1.3 * blink, 0.5]} ol={0} />
              <mesh position={[s * 0.23, 0.27 + 0.08 * shock, 0.54]} rotation={[0, 0, -s * 0.15]}>
                <boxGeometry args={[0.24, 0.05, 0.04]} />
                <meshStandardMaterial color="#2b1b10" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.3, 0.55]} scale={[1.6, 0.35 + 1.2 * shock, 0.4]}>
            <sphereGeometry args={[0.1, 16, 12]} />
            <meshStandardMaterial color="#7a2e2e" />
          </mesh>
          <Blob kind="sphere" args={[0.68, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} color={HAT} pos={[0, 0.35, 0]} ol={0.04} />
          <Blob kind="sphere" args={[0.16, 16, 12]} color="#ffffff" pos={[0, 1.12, 0]} ol={0.12} />
        </group>
      </group>
    </group>
  );
};
