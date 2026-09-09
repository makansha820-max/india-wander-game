import { Billboard, Text, useTexture } from "@react-three/drei";
import type { LandmarkKind } from "../data/gameStates";
import { landmarkArtFor } from "../data/landmarkArt";

interface FamousLandmarkProps {
  name: string;
  kind: LandmarkKind;
  position: [number, number, number];
  near: boolean;
  hasCoin: boolean;
  /** Hide name when spots cluster — only nearest shows text. */
  showLabel?: boolean;
}

export function FamousLandmark({
  name,
  kind,
  position,
  near,
  hasCoin,
  showLabel = true,
}: FamousLandmarkProps) {
  const src = landmarkArtFor(name, kind);
  const texture = useTexture(src);
  texture.anisotropy = 8;
  const scale = near ? 2.2 : 1.75;

  return (
    <group position={[position[0], 0.05, position[2]]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.75, 20]} />
        <meshStandardMaterial
          color={near ? "#f5e6c8" : "#d6c6a8"}
          roughness={0.9}
          transparent
          opacity={0.9}
        />
      </mesh>

      <Billboard follow position={[0, 1.05, 0]}>
        <mesh scale={[scale, scale, 1]}>
          <planeGeometry args={[1.5, 1.5]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.12} depthWrite={false} />
        </mesh>
      </Billboard>

      {(showLabel || near) && (
        <Text
          position={[0, near ? 2.35 : 2.15, 0]}
          fontSize={near ? 0.24 : 0.15}
          color={hasCoin ? "#f5c842" : "#e7e5e4"}
          anchorX="center"
          outlineWidth={0.014}
          outlineColor="#1c1914"
          maxWidth={2.8}
          fillOpacity={near ? 1 : 0.85}
        >
          {name}
        </Text>
      )}
    </group>
  );
}
