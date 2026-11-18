import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

export type Word = {w: string; s: number; e: number};
export type Line = {text: string; start: number; dur: number; file: string; words: Word[]};
export type Narration = {
  fps: number;
  total: number;
  totalFrames: number;
  cutFrame: number;
  hasAudio: boolean;
  lines: Line[];
};

const CHUNK = 3;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Word-by-word captions: 3 words at a time, the spoken word lights up.
export const KaraokeCaptions: React.FC<{lines: Line[]; fps: number}> = ({lines, fps}) => {
  const frame = useCurrentFrame();
  const now = frame / fps;
  const line = lines.find((l) => now >= l.start - 0.05 && now <= l.start + l.dur + 0.35);
  if (!line || line.words.length === 0) return null;
  const t = now - line.start;
  let cur = 0;
  line.words.forEach((w, i) => {
    if (t >= w.s - 0.02) cur = i;
  });
  const first = Math.floor(cur / CHUNK) * CHUNK;
  const chunk = line.words.slice(first, first + CHUNK);
  const local = t - line.words[first].s;
  const pop = interpolate(local, [0, 0.12], [0.8, 1], clamp);
  const op = interpolate(local, [0, 0.06], [0, 1], clamp);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 300}}>
      <div
        style={{
          opacity: op,
          transform: `scale(${pop})`,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 24,
          padding: '0 60px',
          fontFamily: 'sans-serif',
          fontWeight: 900,
          fontSize: 92,
          textTransform: 'uppercase',
          lineHeight: 1.1,
          textAlign: 'center',
        }}
      >
        {chunk.map((w, i) => {
          const active = first + i === cur;
          return (
            <span
              key={first + i}
              style={{
                color: active ? '#ffd54a' : '#ffffff',
                WebkitTextStroke: '10px #000',
                paintOrder: 'stroke fill',
                textShadow: '0 6px 18px rgba(0,0,0,0.8)',
                transform: active ? 'scale(1.12)' : 'none',
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.5}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);
