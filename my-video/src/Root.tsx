import React from "react";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { XbotTest } from "./XbotTest";
import { CastTest } from "./Cast";
import { Cast2 } from "./Cast2";
import { Cast3 } from "./Cast3";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="MyComp" component={MyComposition} durationInFrames={300} fps={30} width={1080} height={1920} />
      <Composition id="XbotTest" component={XbotTest} durationInFrames={300} fps={30} width={1080} height={1920} />
      <Composition id="CastTest" component={CastTest} durationInFrames={300} fps={30} width={1080} height={1920} />
      <Composition id="Cast2" component={Cast2} durationInFrames={300} fps={30} width={1080} height={1920} />
      <Composition id="Cast3" component={Cast3} durationInFrames={300} fps={30} width={1080} height={1920} />
    </>
  );
};
