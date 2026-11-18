import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Car, House, Person, Rig, Sheet, StoryFrame, orbitCam} from '../kit';
import {Street} from '../world';

// Stills: four views of each model (front, side, back, side)
export const SheetPerson: React.FC = () => (
  <Sheet cols={4} sx={1.65} sz={0} dist={7.5} lookY={0.95} base={Math.PI}>
    <Person frame={0} stand />
  </Sheet>
);

export const SheetCar: React.FC = () => (
  <Sheet cols={2} sx={6} sz={6} dist={17} lookY={0.8} base={0}>
    <Car frame={0} still />
  </Sheet>
);

export const SheetHouse: React.FC = () => (
  <Sheet cols={2} sx={11} sz={11} dist={34} lookY={3} base={Math.PI / 2}>
    <House x={0} z={0} idx={0} side={1} full />
  </Sheet>
);

// Videos: camera circles the model in the real street (8 seconds = 360 degrees)
export const OrbitDaniel: React.FC = () => {
  const frame = useCurrentFrame();
  const c = orbitCam([4.4, 1.1, 0], 3.2, frame * 1.5, 1.6);
  return (
    <StoryFrame captions={[]}>
      <Rig pos={c.pos} look={c.look} />
      <Street detail />
      <group position={[4.4, 0, 0]}>
        <Person frame={frame} stand />
      </group>
    </StoryFrame>
  );
};

export const OrbitCar: React.FC = () => {
  const frame = useCurrentFrame();
  const c = orbitCam([-1.8, 0.8, -28], 8, frame * 1.5, 2.2);
  return (
    <StoryFrame captions={[]}>
      <Rig pos={c.pos} look={c.look} />
      <Street detail />
      <group position={[-1.8, 0, -28]}>
        <Car frame={0} still />
      </group>
    </StoryFrame>
  );
};
