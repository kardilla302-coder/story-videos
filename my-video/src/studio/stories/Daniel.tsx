import React from 'react';
import * as R from 'remotion';
import {AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Car, CaptionDef, Person, Rig, StoryFrame} from '../kit';
import {Narration, Vignette} from '../narration';
import {Street, ThemeName} from '../world';
import raw from '../data/Daniel.json';

const N = raw as unknown as Narration & {theme?: string; sfx?: boolean};
const AudioTag: any = (R as any).Html5Audio ?? (R as any).Audio;
const FPS = N.fps;
const CUT = N.cutFrame; // frame where we cut to the car
const TOTAL = N.totalFrames;
const THEME = (N.theme ?? 'dusk') as ThemeName;

// white captions, one per narration line, timed by the voice
const captions: CaptionDef[] = N.lines.map((l) => ({
  from: Math.round(l.start * FPS),
  dur: Math.ceil(l.dur * FPS) + 10,
  text: l.text,
}));

const Scene: React.FC<{frame: number}> = ({frame}) => {
  const shot2 = frame >= CUT;
  const walkZ = 4 - 0.124 * Math.min(frame, CUT);
  const f2 = Math.max(0, frame - CUT);
  const push = interpolate(f2, [0, Math.max(1, TOTAL - CUT)], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateRight: 'clamp',
  });
  const camPos: [number, number, number] = shot2
    ? [3.2 - 1.2 * push, 1.0 - 0.15 * push, -14 - 8 * push]
    : [3.5 + Math.sin(frame * 0.03) * 0.15, 1.9, walkZ + 4.0];
  const camLook: [number, number, number] = shot2 ? [-1.8, 1.0, -34 + 4 * push] : [4.6, 1.3, walkZ - 3];
  return (
    <>
      <Rig pos={camPos} look={camLook} />
      <Street theme={THEME} frame={frame} focus={[camPos[0], camPos[2]]} />
      <group position={[4.4, 0, walkZ]} visible={!shot2}>
        <Person frame={frame} />
      </group>
      <group visible={shot2}>
        <Car frame={frame} startFrame={CUT} />
      </group>
    </>
  );
};

export const Daniel: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [TOTAL - 15, TOTAL], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const base = THEME === 'day' ? 0.2 : 0.45;
  const overlay = (
    <>
      <Vignette strength={frame >= CUT ? base + 0.2 : base} />
      {N.hasAudio &&
        N.lines.map((l, i) => (
          <Sequence key={i} from={Math.round(l.start * FPS)} durationInFrames={Math.ceil(l.dur * FPS) + 6}>
            <AudioTag src={staticFile(`audio/Daniel/${l.file}`)} volume={1} />
          </Sequence>
        ))}
      {N.hasAudio && N.sfx && <AudioTag src={staticFile('audio/Daniel/sfx.wav')} volume={0.6} />}
      <AbsoluteFill style={{backgroundColor: 'black', opacity: fade}} />
    </>
  );
  return (
    <StoryFrame captions={captions} overlay={overlay}>
      <Scene frame={frame} />
    </StoryFrame>
  );
};
