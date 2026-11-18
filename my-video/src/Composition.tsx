import React from "react";
import { Hero } from "./Character";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// ====== EDIT THESE ======
const CAPTION_COLOR = "#FFE600";
const CAPTIONS = [
  { from: 0, to: 75, text: "THIS GUY WALKS UP TO THE HEIGHT GATE" },
  { from: 75, to: 150, text: "HE THINKS HE'S TALL ENOUGH" },
  { from: 150, to: 225, text: "THE GATE DISAGREES" },
  { from: 225, to: 300, text: "WHAT IF...?" },
];
// ========================

type V3 = [number, number, number];
type Shot = { from: number; to: number; start: V3; end: V3; look: V3 };

const SHOTS: Shot[] = [
  { from: 0, to: 75, start: [0, 1.2, 10], end: [0, 1.4, 7.5], look: [0, 1.8, 0] },
  { from: 75, to: 150, start: [1.2, 2.4, 3.2], end: [0.8, 2.4, 2.6], look: [0, 2.35, 0] },
  { from: 150, to: 225, start: [6, 1.8, 3], end: [5, 1.9, 4], look: [0, 1.7, 0] },
  { from: 225, to: 300, start: [0, 2.2, 7], end: [0, 2.2, 4], look: [0, 2, 0] },
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Part: React.FC<{ pos: V3; size: V3; color: string }> = ({ pos, size, color }) => (
  <mesh position={pos}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} />
  </mesh>
);

const Blocky: React.FC<{ z: number; swing: number; shirt: string; bob: number }> = ({ z, swing, shirt, bob }) => (
  <group position={[0, bob, z]}>
    <Part pos={[0, 1.5, 0]} size={[1, 1, 0.5]} color={shirt} />
    <Part pos={[0, 2.35, 0]} size={[0.8, 0.8, 0.8]} color="#d9a066" />
    <Part pos={[0, 2.82, 0]} size={[0.84, 0.2, 0.84]} color="#2b1b10" />
    <Part pos={[-0.18, 2.4, 0.41]} size={[0.1, 0.14, 0.02]} color="#111" />
    <Part pos={[0.18, 2.4, 0.41]} size={[0.1, 0.14, 0.02]} color="#111" />
    <Part pos={[0, 2.18, 0.41]} size={[0.3, 0.06, 0.02]} color="#7a3b1e" />
    <group position={[-0.75, 2, 0]} rotation={[swing, 0, 0]}>
      <Part pos={[0, -0.5, 0]} size={[0.5, 1, 0.5]} color={shirt} />
    </group>
    <group position={[0.75, 2, 0]} rotation={[-swing, 0, 0]}>
      <Part pos={[0, -0.5, 0]} size={[0.5, 1, 0.5]} color={shirt} />
    </group>
    <group position={[-0.25, 1, 0]} rotation={[-swing, 0, 0]}>
      <Part pos={[0, -0.5, 0]} size={[0.5, 1, 0.5]} color="#1b2a4a" />
    </group>
    <group position={[0.25, 1, 0]} rotation={[swing, 0, 0]}>
      <Part pos={[0, -0.5, 0]} size={[0.5, 1, 0.5]} color="#1b2a4a" />
    </group>
  </group>
);

const Tree: React.FC<{ x: number; z: number }> = ({ x, z }) => (
  <group position={[x, 0, z]}>
    <Part pos={[0, 1, 0]} size={[0.5, 2, 0.5]} color="#5b3a1e" />
    <mesh position={[0, 2.8, 0]}>
      <icosahedronGeometry args={[1.4, 0]} />
      <meshStandardMaterial color="#2e7d32" flatShading />
    </mesh>
  </group>
);

const Building: React.FC<{ x: number; z: number; h: number; color: string }> = ({ x, z, h, color }) => (
  <Part pos={[x, h / 2, z]} size={[4, h, 4]} color={color} />
);

const Rig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const shot = SHOTS.find((s) => frame >= s.from && frame < s.to) ?? SHOTS[SHOTS.length - 1];
  const t = interpolate(frame, [shot.from, shot.to], [0, 1], clamp);
  const p = shot.start.map((v, i) => v + (shot.end[i] - v) * t);
  camera.position.set(p[0], p[1], p[2]);
  camera.lookAt(shot.look[0], shot.look[1], shot.look[2]);
  return null;
};

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const walkZ = interpolate(frame, [0, 90], [-8, 0], clamp);
  const walking = frame < 90;
  const swing = walking ? Math.sin(frame / 3) * 0.7 : Math.sin(frame / 15) * 0.06;
  const bob = walking ? Math.abs(Math.sin(frame / 3)) * 0.08 : 0;

  const cap = CAPTIONS.find((c) => frame >= c.from && frame < c.to);
  const capScale = cap ? interpolate(frame, [cap.from, cap.from + 6], [0.6, 1], clamp) : 1;
  const capOpacity = cap ? interpolate(frame, [cap.from, cap.from + 4], [0, 1], clamp) : 0;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(#5db8f5, #d4eefc)" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 45, position: [0, 1.9, 8] }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 6]} intensity={1.6} />
        <Rig frame={frame} />
        <Part pos={[0, -0.01, -20]} size={[60, 0.02, 80]} color="#4caf50" />
        <Part pos={[0, 0.01, -20]} size={[5, 0.02, 80]} color="#333" />
        {[-30, -22, -14, -6, 2, 10].map((dz) => (
          <Part key={dz} pos={[0, 0.03, dz]} size={[0.2, 0.02, 2]} color="#f5c518" />
        ))}
        <Tree x={-4} z={-3} />
        <Tree x={4.2} z={-9} />
        <Tree x={-4.5} z={-15} />
        <Tree x={-4.5} z={4} />
        <Building x={-8} z={-6} h={7} color="#c0563b" />
        <Building x={8} z={-12} h={9} color="#e0b040" />
        <Building x={-8} z={-16} h={6} color="#7aa2d6" />
        <Hero z={walkZ} frame={frame} walking={walking} />
      </ThreeCanvas>
      <AbsoluteFill
        style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 300 }}
        from={262}
        durationInFrames={38}
        trimBefore={262}
      >
        {cap && (
          <div
            style={{
              opacity: capOpacity,
              transform: `scale(${capScale})`,
              fontFamily: "Arial Black, Impact, sans-serif",
              fontSize: 92,
              fontWeight: 900,
              color: CAPTION_COLOR,
              WebkitTextStroke: "8px #000",
              paintOrder: "stroke fill",
              textAlign: "center",
              padding: "0 50px",
              lineHeight: 1.1,
            }}
          >
            {cap.text}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const MyComp = MyComposition;
