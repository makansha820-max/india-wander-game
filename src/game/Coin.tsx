import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

export type CoinTier = "gold" | "silver" | "bronze";

interface CoinProps {
  position: [number, number, number];
  collected: boolean;
  tier?: CoinTier;
  size?: number;
}

const TIER_COLOR: Record<CoinTier, string> = {
  gold: "#f5c842",
  silver: "#cbd5e1",
  bronze: "#cd7f32",
};

/** Solid coin mesh — no textures (Vercel-safe). */
export function Coin({ position, collected, tier = "gold", size = 0.85 }: CoinProps) {
  const ref = useRef<Mesh>(null);
  const color = TIER_COLOR[tier];
  const radius = 0.28 * size;

  useFrame((_, delta) => {
    if (!ref.current || collected) return;
    ref.current.rotation.y += delta * 2.2;
    ref.current.position.y = 1.35 + Math.sin(Date.now() * 0.004) * 0.12;
  });

  if (collected) return null;

  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh ref={ref} castShadow position={[0, 1.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, 0.08, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={tier === "gold" ? "#b45309" : "#000000"}
          emissiveIntensity={tier === "gold" ? 0.35 : 0}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      {tier === "gold" && (
        <pointLight intensity={0.45} distance={3.5} color="#ffd700" position={[0, 1.5, 0]} />
      )}
    </group>
  );
}
