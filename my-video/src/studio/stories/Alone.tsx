import React from 'react';
import * as R from 'remotion';
import {AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Person, Rig, StoryFrame} from '../kit';
import {Narration, Vignette} from '../narration';
import {EndCard, HighlightCaptions, TitleCard} from '../captions';
import {Stalker} from '../stalker';
import {Street, ThemeName} from '../world';
import {Segs, angleKeys, integrate, smooth, speedAt} from '../motion';
import raw from '../data/Alone.json';

type V3 = [number, number, number];
type Plan = {walk: number[][]; boost: number[]; turn: number[]; returnTurn: number[]; lastTurn: number[]};
const N = raw as unknown as Narration & {
  theme?: string;
  title?: string;
  subtitle?: string;
  endtext?: string;
  highlight?: string[];
  tags?: Record<string, number>;
  plan: Plan;
};
const AudioTag: any = (R as any).Html5Audio ?? (R as any).Audio;
const FPS = N.fps;
const TOTAL = N.totalFrames;
const THEME = (N.theme ?? 'dusk') as ThemeName;
const F = (s: number) => Math.round(s * FPS);
const tg = (k: string, d: number) => (N.tags && N.tags[k] !== undefined ? F(N.tags[k]) : d);
const inc = (a: number[]) => {
  const o = [...a];
  for (let i = 1; i < o.length; i++) if (o[i] <= o[i - 1]) o[i] = o[i - 1] + 1;
  return o;
};
const lin = (keys: number[], vals: number[], x: number) => {
  if (x <= keys[0]) return vals[0];
  for (let i = 1; i < keys.length; i++) {
    if (x <= keys[i]) return vals[i - 1] + ((vals[i] - vals[i - 1]) * (x - keys[i - 1])) / Math.max(1, keys[i] - keys[i - 1]);
  }
  return vals[vals.length - 1];
};

// moments in the story (frames), taken from the @tags in the script
const TONIGHT = tg('tonight', 200);
const STEPS = tg('steps', 260);
const STOP = tg('stop', 360);
const WALK = tg('walk', 420);
const TURN_CUT = tg('turn', 500);
const NOBODY = tg('nobody', 560);
const RELIEF = tg('relief', 600);
const RESUME = tg('resume', 680);
const LAMPS = tg('lamps', 760);
const FAST = tg('fast', 900);
const NEAR = tg('near', 1000);
const BREATH = tg('breath', 1100);
const LEAN = tg('lean', 1180);
const WHISPER = tg('whisper', 1260);
const AGAIN = tg('again', 1320);
const NAME = tg('name', 1450);
const NK = tg('nk', 1520);
const FINAL = tg('final', 1650);
const LASTTURN = tg('lastturn', 1750);

const WALKS: Segs = N.plan.walk.map((s) => [F(s[0]), F(s[1])] as [number, number]);
const BOOST: [number, number] = [F(N.plan.boost[0]), N.plan.boost[1]];
const TURNS: [number, number, number][] = [
  [F(N.plan.turn[0]), F(N.plan.turn[1]), Math.PI],
  [F(N.plan.returnTurn[0]), F(N.plan.returnTurn[1]), 0],
  [F(N.plan.lastTurn[0]), F(N.plan.lastTurn[1]), Math.PI],
];

// how far behind Daniel the creature is (metres)
const GAP_K = inc([0, STEPS, STOP, WALK, TURN_CUT, RESUME, LAMPS, FAST, NEAR, BREATH, LEAN, LASTTURN, LASTTURN + 45, TOTAL]);
const GAP_V = [70, 40, 33, 33, 28, 36, 30, 14, 2.4, 2.0, 1.0, 1.0, 2.2, 2.2];

// how far in front of him the camera sits in the walking-towards-us shots
const FRONT_K = inc([TONIGHT, STOP, TURN_CUT, RESUME, LAMPS, FAST, NEAR]);
const FRONT_V = [4.4, 3.6, 3.6, 4.2, 4.2, 3.0, 2.6];

// Daniel's face over time: [frame, brow, eye, mouth, open, look]
const ROWS: number[][] = [
  [0, 0.0, 1.0, 0.35, 0, 0],
  [TONIGHT, 0.2, 1.0, 0.05, 0, 0],
  [STEPS, 0.6, 1.1, -0.2, 0, -0.5],
  [STOP, 0.8, 1.2, -0.3, 0, -0.8],
  [WALK, 0.6, 1.15, -0.2, 0, 0],
  [TURN_CUT, 0.9, 1.4, -0.3, 0.15, 0],
  [NOBODY, 0.3, 1.2, 0.0, 0, 0],
  [RELIEF, -0.2, 0.6, 1.0, 0.55, 0],
  [RESUME, 0.0, 1.0, 0.4, 0, 0],
  [LAMPS, 0.7, 1.25, -0.3, 0, 0.4],
  [FAST, 1.0, 1.4, -0.5, 0.1, 0.8],
  [NEAR, 1.0, 1.55, -0.6, 0.25, 0],
  [BREATH, 1.0, 1.7, -0.5, 0.1, 0],
  [LEAN, 1.0, 1.6, -0.4, 0.05, 0.2],
  [WHISPER, 1.0, 1.7, -0.2, 0.05, 1.0],
  [AGAIN, 0.9, 1.5, -0.3, 0.1, 1.0],
  [NAME, 1.0, 1.75, -0.3, 0.2, 0.5],
  [NK, 0.9, 1.3, -0.7, 0, 0],
  [FINAL, 0.5, 1.1, -0.4, 0, 0],
  [LASTTURN, 0.4, 1.0, -0.3, 0, 0],
  [LASTTURN + 75, 1.0, 1.9, -0.8, 1.0, 0],
];
const ROW_K = inc(ROWS.map((r) => r[0]));
const col = (c: number, f: number) =>
  lin(
    ROW_K,
    ROWS.map((r) => r[c]),
    f,
  );

const X = 4.4; // sidewalk

const shotAt = (f: number) => {
  if (f < TONIGHT) return 'behind';
  if (f < TURN_CUT) return 'front';
  if (f < NOBODY) return 'close';
  if (f < RELIEF) return 'pov';
  if (f < RESUME) return 'relief';
  if (f < NEAR) return 'front';
  if (f < LEAN) return 'looming';
  if (f < AGAIN) return 'ear';
  if (f < NAME) return 'face';
  if (f < NK) return 'thingface';
  if (f < LASTTURN) return 'push';
  if (f < LASTTURN + 80) return 'turnwide';
  return 'pov2';
};

const camFor = (shot: string, f: number, dz: number): {pos: V3; look: V3} => {
  const k = (a: number, b: number) =>
    interpolate(f, [a, Math.max(a + 1, b)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  switch (shot) {
    case 'behind':
      return {pos: [X - 0.9 + Math.sin(f * 0.03) * 0.1, 1.9, dz + 4.0], look: [X + 0.1, 1.3, dz - 3]};
    case 'front':
      return {pos: [X + 0.25, 1.68, dz - lin(FRONT_K, FRONT_V, f)], look: [X, 1.5, dz + 6]};
    case 'close': {
      const q = k(TURN_CUT, NOBODY);
      return {pos: [X - 0.85 + 0.2 * q, 1.55, dz + 1.7 - 0.5 * q], look: [X, 1.5, dz]};
    }
    case 'pov':
      return {pos: [X + Math.sin(f * 0.05) * 0.015, 1.66, dz + 0.3], look: [X, 1.45, dz + 14]};
    case 'relief': {
      const q = k(RELIEF, RESUME);
      return {pos: [X - 0.9, 1.68, dz + 1.5 - 0.3 * q], look: [X, 1.7, dz]};
    }
    case 'looming': {
      const q = k(NEAR, LEAN);
      return {pos: [X + 0.15, 1.85, dz - 2.4 + 0.4 * q], look: [X + 0.05, 1.95, dz + 1.0]};
    }
    case 'ear': {
      const q = k(LEAN, AGAIN);
      return {pos: [X + 0.3, 1.78, dz - 1.9 + 0.5 * q], look: [X + 0.27, 1.77, dz]};
    }
    case 'face':
      return {pos: [X + 0.3, 1.76, dz - 1.2], look: [X + 0.15, 1.76, dz]};
    case 'thingface':
      return {pos: [X - 1.1, 1.85, dz - 0.9], look: [X + 0.45, 1.8, dz - 0.05]};
    case 'push': {
      const q = k(NK, LASTTURN);
      return {pos: [X, 1.74, dz - 1.5 + 0.7 * q], look: [X + 0.05, 1.74, dz]};
    }
    case 'turnwide':
      return {pos: [X + 0.3, 1.9, dz - 3.0], look: [X, 1.7, dz + 1.5]};
    default: {
      const q = k(LASTTURN + 80, TOTAL);
      return {pos: [X, 2.25, dz + 1.7 - 0.5 * q], look: [X, 1.7, dz]};
    }
  }
};

// walk both of them forward frame by frame
const track = (f: number) => {
  let dist = 0;
  let phase = 0;
  let travelled = 0;
  let prevZ = 6 + lin(GAP_K, GAP_V, 0);
  let lastDelta = 0;
  for (let i = 0; i < f; i++) {
    const s = speedAt(i, WALKS, BOOST);
    dist += 0.124 * s;
    phase += 0.34 * s;
    const z = 6 - dist + lin(GAP_K, GAP_V, i + 1);
    lastDelta = Math.abs(z - prevZ);
    travelled += lastDelta;
    prevZ = z;
  }
  return {dist, phase, tPhase: travelled * 1.7, tSpeed: Math.min(1.25, lastDelta / 0.124)};
};

const Scene: React.FC<{frame: number}> = ({frame}) => {
  const {dist, phase, tPhase, tSpeed} = track(frame);
  const sp = Math.min(1.15, speedAt(frame, WALKS, BOOST));
  const dz = 6 - dist;
  const zT = dz + lin(GAP_K, GAP_V, frame);
  const ang = angleKeys(frame, TURNS);
  const shot = shotAt(frame);
  const cam = camFor(shot, frame, dz);
  const leanK = smooth((frame - LEAN) / 45) - smooth((frame - LASTTURN) / 45);
  const talking = N.lines.some((l: any) => l.thing && frame >= F(l.start) && frame <= F(l.start + l.dur));
  const tMouth = talking ? 0.3 + 0.35 * Math.abs(Math.sin(frame * 0.6)) : 0;
  const tremble = frame >= BREATH ? Math.sin(frame * 1.9) * 0.014 * Math.min(1, (frame - BREATH) / 20) : 0;
  const hideThing = (frame >= TURN_CUT && frame < RESUME) || shot === 'pov2';
  const face = {brow: col(1, frame), eye: col(2, frame), mouth: col(3, frame), open: col(4, frame), look: col(5, frame)};

  return (
    <>
      <Rig pos={cam.pos} look={cam.look} />
      <Street theme={THEME} frame={frame} focus={[cam.pos[0], cam.pos[2]]} scroll darkZ={zT + 1.5} />
      <group position={[X, 0, dz]} rotation={[0, ang, tremble]} visible={shot !== 'pov'}>
        <Person frame={phase / 0.34} walk={sp} face={face} />
      </group>
      <group position={[X + 0.5 * leanK, 0, zT]} visible={!hideThing}>
        <Stalker phase={tPhase} walk={tSpeed} lean={leanK} mouth={tMouth} />
      </group>
    </>
  );
};

export const Alone: React.FC = () => {
  const frame = useCurrentFrame();
  const last = N.lines[N.lines.length - 1];
  const lastEnd = F(last.start + last.dur);
  const fade = interpolate(frame, [lastEnd - 6, lastEnd + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const vig = interpolate(frame, [0, STEPS, LAMPS, BREATH, TOTAL], [0.35, 0.45, 0.6, 0.72, 0.82], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const overlay = (
    <>
      <Vignette strength={vig} />
      {N.hasAudio &&
        N.lines.map((l, i) => (
          <Sequence key={i} from={Math.round(l.start * FPS)} durationInFrames={Math.ceil(l.dur * FPS) + 6}>
            <AudioTag src={staticFile(`audio/Alone/${l.file}`)} volume={1} />
          </Sequence>
        ))}
      <TitleCard text={N.title ?? ''} sub={N.subtitle} seconds={2.8} fps={FPS} />
      <HighlightCaptions lines={N.lines} fps={FPS} terms={N.highlight ?? []} />
      <AbsoluteFill style={{backgroundColor: 'black', opacity: fade}} />
      <EndCard from={lastEnd + 16} text={N.endtext || 'PART 2'} sub="Follow so you don't miss it" />
    </>
  );
  return (
    <StoryFrame captions={[]} overlay={overlay}>
      <Scene frame={frame} />
    </StoryFrame>
  );
};
