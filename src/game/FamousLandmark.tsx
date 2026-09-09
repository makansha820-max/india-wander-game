import { Billboard, useTexture } from "@react-three/drei";
import type { LandmarkKind } from "../data/gameStates";
import { landmarkArtFor } from "../data/landmarkArt";

interface FamousLandmarkProps {
  name: string;
  kind: LandmarkKind;
  position: [number, number, number];
  near: boolean;
  hasCoin: boolean;
  showLabel?: boolean;
}

/** Landmark billboard — no 3D Text (CDN fonts break under Vercel CSP). */
export function FamousLandmark({
  name,
  kind,
  position,
  near,
  hasCoin,
}: FamousLandmarkProps) {
  const texture = useTexture(landmarkArtFor(name, kind));
  texture.anisotropy = 8;
  const scale = near ? 2.2 : 1.75;

  return (
    <group position={[position[0], 0.05, position[2]]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.75, 20]} />
        <meshStandardMaterial
          color={hasCoin ? (near ? "#f5e6c8" : "#e8d5a8") : "#9ca3af"}
          roughness={0.9}
        />
      </mesh>

      <Billboard follow position={[0, 1.05, 0]}>
        <mesh scale={[scale, scale, 1]}>
          <planeGeometry args={[1.5, 1.5]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.08} depthWrite={false} />
        </mesh>
      </Billboard>

      <mesh position={[0, near ? 2.15 : 1.95, 0]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial
          color={hasCoin ? "#f5c842" : "#94a3b8"}
          emissive={near ? "#f59e0b" : "#000000"}
          emissiveIntensity={near ? 0.55 : 0}
        />
      </mesh>
    </group>
  );
}
