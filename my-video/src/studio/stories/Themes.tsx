import React from 'react';
import {Person, Rig, StoryFrame} from '../kit';
import {Street, ThemeName} from '../world';

const Shot: React.FC<{theme: ThemeName}> = ({theme}) => (
  <StoryFrame captions={[]}>
    <Rig pos={[3.5, 1.9, 8]} look={[4.6, 1.3, 1]} />
    <Street theme={theme} frame={40} focus={[3.5, 8]} />
    <group position={[4.4, 0, 4]}>
      <Person frame={0} stand />
    </group>
  </StoryFrame>
);

export const ThemeDusk: React.FC = () => <Shot theme="dusk" />;
export const ThemeDay: React.FC = () => <Shot theme="day" />;
export const ThemeWinter: React.FC = () => <Shot theme="winter" />;
