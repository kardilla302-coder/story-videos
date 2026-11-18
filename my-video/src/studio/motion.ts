export type Segs = [number, number][];

export const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

// 0 = standing still, 1 = full walking speed. Eases in/out over 8 frames.
// boost = [frame, extra]: from that frame he gradually walks (1 + extra) times faster.
export const speedAt = (f: number, segs: Segs, boost?: [number, number]) => {
  let s = 0;
  for (const [a, b] of segs) s = Math.max(s, Math.min(smooth((f - a) / 8), smooth((b - f) / 8)));
  if (boost) s *= 1 + boost[1] * smooth((f - boost[0]) / 15);
  return s;
};

export const integrate = (f: number, segs: Segs, boost?: [number, number]) => {
  let dist = 0;
  let phase = 0;
  for (let i = 0; i < f; i++) {
    const s = speedAt(i, segs, boost);
    dist += 0.124 * s;
    phase += 0.34 * s;
  }
  return {dist, phase};
};

// turns: [startFrame, endFrame, targetAngle]. Each turn eases from the previous angle to its target.
export const angleKeys = (f: number, keys: [number, number, number][]) => {
  let a = 0;
  for (const [s, e, t] of keys) {
    if (f <= s) return a;
    if (f < e) return a + (t - a) * smooth((f - s) / Math.max(1, e - s));
    a = t;
  }
  return a;
};
