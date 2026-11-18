import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {CaptionDef, Person, Rig, StoryFrame} from '../kit';
import {Street} from '../world';
// Other tools: Car, orbitCam (from ../kit). Street themes: 'dusk' | 'day' | 'winter'

// Edit the narration lines. 30 frames = 1 second.
const captions: CaptionDef[] = [
  {from: 0, dur: 90, text: 'First line of narration.'},
  {from: 90, dur: 90, text: 'Second line of narration.'},
];

const Scene: React.FC<{frame: number}> = ({frame}) => {
  const z = interpolate(frame, [0, 180], [4, -22], {extrapolateRight: 'clamp'});
  return (
    <>
      <Rig pos={[3.5, 1.9, z + 4]} look={[4.6, 1.3, z - 3]} />
      <Street theme="day" frame={frame} focus={[3.5, z + 4]} />
      <group position={[4.4, 0, z]}>
        <Person frame={frame} />
      </group>
    </>
  );
};

export const StoryName: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <StoryFrame captions={captions}>
      <Scene frame={frame} />
    </StoryFrame>
  );
};
