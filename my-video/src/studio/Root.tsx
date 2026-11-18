import React from 'react';
import {Composition} from 'remotion';
import {Alone} from './stories/Alone';
import {Daniel} from './stories/Daniel';
import {ThemeDay, ThemeDusk, ThemeWinter} from './stories/Themes';
import {OrbitCar, OrbitDaniel, SheetCar, SheetHouse, SheetPerson} from './stories/Views';
import aloneData from './data/Alone.json';
import danielData from './data/Daniel.json';

const stories = [
  {id: 'Alone', component: Alone, frames: (aloneData as any).totalFrames},
  {id: 'Daniel', component: Daniel, frames: (danielData as any).totalFrames},
  {id: 'ThemeDusk', component: ThemeDusk, frames: 1},
  {id: 'ThemeDay', component: ThemeDay, frames: 1},
  {id: 'ThemeWinter', component: ThemeWinter, frames: 1},
  {id: 'OrbitDaniel', component: OrbitDaniel, frames: 240},
  {id: 'OrbitCar', component: OrbitCar, frames: 240},
  {id: 'SheetPerson', component: SheetPerson, frames: 1, width: 1920, height: 1080},
  {id: 'SheetCar', component: SheetCar, frames: 1, width: 1920, height: 1080},
  {id: 'SheetHouse', component: SheetHouse, frames: 1, width: 1920, height: 1080},
  // add new stories here
];

export const RemotionRoot: React.FC = () => (
  <>
    {stories.map((s) => (
      <Composition
        key={s.id}
        id={s.id}
        component={s.component}
        durationInFrames={s.frames}
        fps={30}
        width={s.width ?? 1080}
        height={s.height ?? 1920}
      />
    ))}
  </>
);
