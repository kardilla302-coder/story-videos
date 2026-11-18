import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ====== EDIT THESE ======
const BODY = "#c1121f";
const JOINTS = "#141414";
const HEAD = "#0a0a0a";
const SKY = "linear-gradient(#5db8f5, #d4eefc)";
const GROUND = "#4caf50";
// ========================

const SEGS = [
  { from: 0, to: 120, name: "walk" },
  { from: 120, to: 210, name: "headShake" },
  { from: 210, to: 300, name: "sad_pose" },
];

const Loading: React.FC = () => {
  const [handle] = useState(() => delayRender("loading model"));
  useEffect(() => () => continueRender(handle), [handle]);
  return null;
};

const Cam: React.FC = () => {
  const { camera } = useThree();
  camera.position.set(0, 1.2, 5);
  camera.lookAt(0, 0.95, 0);
  return null;
};


const Actor: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const gltf = useGLTF(staticFile("Xbot.glb"));
  const rig = useMemo(() => {
    const paint = (m: any, meshName: string) => {
      const c = m.clone();
      c.map = null;
      const n = (meshName + " " + (m.name || "")).toLowerCase();
      c.color.set(n.includes("joint") ? JOINTS : BODY);
      c.roughness = 0.65;
      c.metalness = 0;
      return c;
    };
    const old: THREE.Object3D[] = [];
    gltf.scene.traverse((o) => {
      if (o.name === "silhouetteHead") old.push(o);
    });
    old.forEach((o) => o.removeFromParent());
    gltf.scene.position.set(0, 0, 0);
    gltf.scene.traverse((o: any) => {
      if (o.isSkinnedMesh) o.skeleton.pose();
    });
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o: any) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false;
        o.material = Array.isArray(o.material)
          ? o.material.map((m: any) => paint(m, o.name))
          : paint(o.material, o.name);
      }
    });
    const heads: THREE.Object3D[] = [];
    gltf.scene.traverse((o) => {
      if (o.name.toLowerCase().endsWith("head")) heads.push(o);
    });
    const head = heads[0];
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 24),
      new THREE.MeshStandardMaterial({ color: HEAD, roughness: 0.5 })
    );
    sphere.scale.set(0.115, 0.135, 0.125);
    sphere.castShadow = true;
    const bp = new THREE.Vector3();
    const bq = new THREE.Quaternion();
    const bs = new THREE.Vector3();
    new THREE.Matrix4()
      .multiplyMatrices(new THREE.Matrix4().copy(gltf.scene.matrixWorld).invert(), head.matrixWorld)
      .decompose(bp, bq, bs);
    const offsetLocal = new THREE.Vector3(0, 0.12, 0).applyQuaternion(bq.clone().invert());
    return { mixer: new THREE.AnimationMixer(gltf.scene), head, sphere, bq, offsetLocal };
  }, [gltf.scene]);

  const seg = SEGS.find((s) => frame >= s.from && frame < s.to) ?? SEGS[SEGS.length - 1];
  const clip =
    gltf.animations.find((a) => a.name.toLowerCase() === seg.name.toLowerCase()) ??
    gltf.animations[0];
  rig.mixer.stopAllAction();
  rig.mixer.clipAction(clip).play();
  rig.mixer.setTime((frame - seg.from) / fps);

  gltf.scene.updateMatrixWorld(true);
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  new THREE.Matrix4()
    .multiplyMatrices(new THREE.Matrix4().copy(gltf.scene.matrixWorld).invert(), rig.head.matrixWorld)
    .decompose(p, q, s);
  rig.sphere.position.copy(p).add(rig.offsetLocal.clone().applyQuaternion(q));
  rig.sphere.quaternion.copy(q).multiply(rig.bq.clone().invert());

  const z = interpolate(frame, [0, 120], [-6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <group position={[0, 0, z]}>
      <primitive object={gltf.scene} />
      <primitive object={rig.sphere} />
    </group>
  );
};

export const XbotTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: SKY }}>
      <ThreeCanvas shadows width={width} height={height} camera={{ position: [0, 1.2, 5], fov: 40 }}>
        <Cam />
        <ambientLight intensity={0.4} />
        <hemisphereLight args={["#bfe3ff", "#4a7a3a", 0.6]} />
        <directionalLight
          position={[4, 8, 6]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0005}
          shadow-normalBias={0.03}
          shadow-camera-near={1}
          shadow-camera-far={40}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color={GROUND} />
        </mesh>
        <React.Suspense fallback={<Loading />}>
          <Actor frame={frame} fps={fps} />
        </React.Suspense>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
