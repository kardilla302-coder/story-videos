import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Line} from './narration';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pieces = (text: string, terms: string[]) => {
  const list = terms.map((t) => t.trim()).filter(Boolean).sort((a, b) => b.length - a.length);
  if (list.length === 0) return [{t: text, hl: false}];
  const re = new RegExp('(' + list.map(esc).join('|') + ')', 'gi');
  return text
    .split(re)
    .filter((s) => s !== '')
    .map((s) => ({t: s, hl: list.some((l) => l.toLowerCase() === s.toLowerCase())}));
};

// White captions, key words in gold. When the creature speaks, the caption turns red and italic.
export const HighlightCaptions: React.FC<{lines: Line[]; fps: number; terms: string[]}> = ({lines, fps, terms}) => {
  const f = useCurrentFrame();
  const now = f / fps;
  const l = lines.find((x) => now >= x.start - 0.05 && now <= x.start + x.dur + 0.4);
  if (!l) return null;
  const thing = !!(l as any).thing;
  const local = (now - l.start) * fps;
  const end = l.dur * fps + 12;
  const opacity = interpolate(local, [0, 6, end - 8, end], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 260}}>
      <div
        style={{
          opacity,
          color: thing ? '#ff8f86' : 'white',
          fontStyle: thing ? 'italic' : 'normal',
          fontSize: 72,
          fontWeight: 800,
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          padding: '0 70px',
          lineHeight: 1.2,
          textShadow: '0 4px 14px rgba(0,0,0,0.9), 0 0 4px black',
        }}
      >
        {pieces(l.text, terms).map((p, i) => (
          <span
            key={i}
            style={p.hl ? {color: '#ffd54a', fontSize: 86, textShadow: '0 4px 18px rgba(0,0,0,0.95), 0 0 12px rgba(255,170,0,0.5)'} : undefined}
          >
            {p.t}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const TitleCard: React.FC<{text: string; sub?: string; seconds: number; fps: number}> = ({text, sub, seconds, fps}) => {
  const f = useCurrentFrame();
  const end = seconds * fps;
  const opacity = interpolate(f, [0, 8, end - 10, end], [0, 1, 1, 0], clamp);
  if (!text || f > end) return null;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 250}}>
      <div
        style={{
          opacity,
          color: 'white',
          fontSize: 112,
          fontWeight: 900,
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          padding: '0 60px',
          lineHeight: 1.05,
          textShadow: '0 6px 22px rgba(0,0,0,0.95), 0 0 6px black',
        }}
      >
        {text}
        {sub ? <div style={{fontSize: 60, marginTop: 18, color: '#ffd54a', letterSpacing: 6}}>{sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

export const EndCard: React.FC<{from: number; text: string; sub: string}> = ({from, text, sub}) => {
  const f = useCurrentFrame();
  if (f < from) return null;
  const o = interpolate(f - from, [0, 14], [0, 1], clamp);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: o}}>
      <div
        style={{
          color: '#ffd54a',
          fontSize: 130,
          fontWeight: 900,
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          textShadow: '0 6px 22px rgba(0,0,0,0.95)',
        }}
      >
        {text}
        <div style={{fontSize: 52, marginTop: 30, color: 'white', fontWeight: 700}}>{sub}</div>
      </div>
    </AbsoluteFill>
  );
};
