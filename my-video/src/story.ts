export type V3 = [number, number, number];

export const story = {
  fps: 30,
  frames: 900,
  audio: null as string | null,
  env: {
    skyTop: "#e8c98b",
    skyBottom: "#f1e2bd",
    fog: "#f1e2bd",
    fogNear: 12,
    fogFar: 80,
    sun: "#ffd9a0",
  },
  characters: [
    {
      id: "hero",
      model: "Xbot.glb",
      tint: "#c68a62" as string | null,
      scale: 1,
      timeline: [
        { from: 0, to: 600, clip: "walk", start: [-3.9, 0, -16] as V3, end: [-3.9, 0, 12] as V3 },
        { from: 600, to: 720, clip: "idle", start: [-3.9, 0, 12] as V3, end: [-3.9, 0, 12] as V3, rotY: 0 },
        { from: 720, to: 840, clip: "headShake", start: [-3.9, 0, 12] as V3, end: [-3.9, 0, 12] as V3, rotY: 0 },
        { from: 840, to: 900, clip: "sad_pose", start: [-3.9, 0, 12] as V3, end: [-3.9, 0, 12] as V3, rotY: 0 },
      ],
    },
  ],
  shots: [
    { from: 0, to: 240, pos: [-0.5, 1.5, 6] as V3, posEnd: [-0.5, 1.5, 2] as V3, look: "hero", lookOffset: [0, 1.1, 0] as V3, fov: 40 },
    { from: 240, to: 480, pos: [1.2, 1.4, -4.8] as V3, posEnd: [1.2, 1.4, 6.4] as V3, look: "hero", lookOffset: [0, 1, 0] as V3, fov: 40 },
    { from: 480, to: 600, pos: [-2, 0.8, 17] as V3, posEnd: [-2.5, 0.9, 15.5] as V3, look: "hero", lookOffset: [0, 1, 0] as V3, fov: 40 },
    { from: 600, to: 900, pos: [-3, 1.55, 14.4] as V3, posEnd: [-3.3, 1.55, 13.6] as V3, look: "hero", lookOffset: [0, 1.5, 0] as V3, fov: 30 },
  ],
  captions: [
    { from: 15, to: 200, text: "A QUIET STREET." },
    { from: 215, to: 420, text: "HE WALKS THE SAME ROUTE EVERY NIGHT." },
    { from: 435, to: 640, text: "TONIGHT, SOMETHING IS DIFFERENT." },
    { from: 655, to: 880, text: "TELL YOUR STORY HERE." },
  ],
};
