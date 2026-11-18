import React from 'react';
import {Composition} from 'remotion';
import {Daniel} from './Daniel';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Daniel"
      component={Daniel}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
