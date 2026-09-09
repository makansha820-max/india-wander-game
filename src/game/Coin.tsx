import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, useTexture } from "@react-three/drei";
import type { Mesh } from "three";
import { COIN_ART } from "../data/landmarkArt";

export type CoinTier = "gold" | "silver" | "bronze";

interface CoinProps {
  position: [number, number, number];
  collected: boolean;
  tier?: CoinTier;
  size?: number;
}

/** Travel coin — gold at famous places, silver/bronze on trails. */
export function Coin({ position, collected, tier = "gold", size = 0.85 }: CoinProps) {
  const ref = useRef<Mesh>(null);
  const texture = useTexture(COIN_ART[tier]);
  texture.anisotropy = 4;

  useFrame((_, delta) => {
    if (!ref.current || collected) return;
    ref.current.rotation.z += delta * 1.6;
    ref.current.position.y = 1.25 + Math.sin(Date.now() * 0.004) * 0.12;
  });

  if (collected) return null;

  return (
    <group position={[position[0], 0, position[2]]}>
      <Billboard follow>
        <mesh ref={ref} position={[0, 1.25, 0]} scale={[size, size, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.15} depthWrite={false} />
        </mesh>
      </Billboard>
      {tier === "gold" && (
        <pointLight intensity={0.4} distance={3.5} color="#ffd700" position={[0, 1.4, 0]} />
      )}
    </group>
  );
}
