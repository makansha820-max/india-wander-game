import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MovementMode } from "./Player";

interface HumanoidProps {
  mode: MovementMode;
  moving: boolean;
}

/** Low-poly traveler: head, torso, backpack, arms, legs — animated walk/run/swim. */
export function Humanoid({ mode, moving }: HumanoidProps) {
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const phase = useRef(0);

  useFrame((_, delta) => {
    const animMode =
      mode === "run" || mode === "drive" ? "run" : mode === "swim" || mode === "sail" ? "swim" : "walk";
    const speed = animMode === "run" ? 14 : animMode === "swim" ? 8 : 9;
    if (moving) phase.current += delta * speed;
    else phase.current *= 0.9;

    const swing = moving ? Math.sin(phase.current) : 0;
    const amp = animMode === "run" ? 0.9 : animMode === "swim" ? 0.7 : 0.55;

    if (leftArm.current) leftArm.current.rotation.x = swing * amp;
    if (rightArm.current) rightArm.current.rotation.x = -swing * amp;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing * amp * 0.9;
    if (rightLeg.current) rightLeg.current.rotation.x = swing * amp * 0.9;
    if (torso.current) {
      torso.current.position.y = moving ? Math.abs(Math.sin(phase.current * 2)) * 0.04 : 0;
      torso.current.rotation.z = moving ? swing * 0.05 : 0;
    }
  });

  const skin = "#e0b090";
  const shirt = "#e85d04";
  const pants = "#2b2d42";
  const shoes = "#1a1a1a";
  const hair = "#3d2914";

  return (
    <group>
      <group ref={torso}>
        {/* torso */}
        <mesh castShadow position={[0, 1.05, 0]}>
          <boxGeometry args={[0.42, 0.55, 0.28]} />
          <meshStandardMaterial color={shirt} roughness={0.7} />
        </mesh>
        {/* backpack */}
        <mesh castShadow position={[0, 1.1, -0.22]}>
          <boxGeometry args={[0.32, 0.4, 0.18]} />
          <meshStandardMaterial color="#5c4033" roughness={0.85} />
        </mesh>
        {/* head */}
        <mesh castShadow position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
        {/* hair */}
        <mesh castShadow position={[0, 1.62, -0.02]}>
          <sphereGeometry args={[0.17, 10, 10]} />
          <meshStandardMaterial color={hair} roughness={0.9} />
        </mesh>
        {/* hat brim */}
        <mesh castShadow position={[0, 1.68, 0]} rotation={[0.1, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 12]} />
          <meshStandardMaterial color="#c9a227" />
        </mesh>
        <mesh castShadow position={[0, 1.78, 0]}>
          <cylinderGeometry args={[0.14, 0.16, 0.16, 12]} />
          <meshStandardMaterial color="#c9a227" />
        </mesh>

        {/* left arm */}
        <group ref={leftArm} position={[-0.28, 1.25, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[0.12, 0.45, 0.12]} />
            <meshStandardMaterial color={shirt} />
          </mesh>
          <mesh castShadow position={[0, -0.48, 0]}>
            <boxGeometry args={[0.1, 0.12, 0.1]} />
            <meshStandardMaterial color={skin} />
          </mesh>
        </group>

        {/* right arm */}
        <group ref={rightArm} position={[0.28, 1.25, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[0.12, 0.45, 0.12]} />
            <meshStandardMaterial color={shirt} />
          </mesh>
          <mesh castShadow position={[0, -0.48, 0]}>
            <boxGeometry args={[0.1, 0.12, 0.1]} />
            <meshStandardMaterial color={skin} />
          </mesh>
        </group>
      </group>

      {/* left leg */}
      <group ref={leftLeg} position={[-0.12, 0.75, 0]}>
        <mesh castShadow position={[0, -0.28, 0]}>
          <boxGeometry args={[0.14, 0.5, 0.16]} />
          <meshStandardMaterial color={pants} />
        </mesh>
        <mesh castShadow position={[0, -0.58, 0.04]}>
          <boxGeometry args={[0.14, 0.12, 0.24]} />
          <meshStandardMaterial color={shoes} />
        </mesh>
      </group>

      {/* right leg */}
      <group ref={rightLeg} position={[0.12, 0.75, 0]}>
        <mesh castShadow position={[0, -0.28, 0]}>
          <boxGeometry args={[0.14, 0.5, 0.16]} />
          <meshStandardMaterial color={pants} />
        </mesh>
        <mesh castShadow position={[0, -0.58, 0.04]}>
          <boxGeometry args={[0.14, 0.12, 0.24]} />
          <meshStandardMaterial color={shoes} />
        </mesh>
      </group>
    </group>
  );
}
