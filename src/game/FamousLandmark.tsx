import type { LandmarkKind } from "../data/gameStates";

interface FamousLandmarkProps {
  name: string;
  kind: LandmarkKind;
  position: [number, number, number];
  near: boolean;
  hasCoin: boolean;
  showLabel?: boolean;
}

const KIND_COLOR: Record<LandmarkKind, string> = {
  fort: "#a16207",
  temple: "#b45309",
  beach: "#38bdf8",
  lake: "#0ea5e9",
  nature: "#166534",
  monument: "#d6d3d1",
  plaza: "#e7e5e4",
};

/** Solid geometry landmarks — no external textures (Vercel-safe). */
export function FamousLandmark({
  kind,
  position,
  near,
  hasCoin,
}: FamousLandmarkProps) {
  const color = KIND_COLOR[kind];
  const boost = near ? 1.15 : 1;

  return (
    <group position={[position[0], 0.05, position[2]]} scale={boost}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 20]} />
        <meshStandardMaterial color={hasCoin ? "#f5e6c8" : "#a8a29e"} roughness={0.9} />
      </mesh>

      {kind === "fort" && (
        <group>
          <mesh castShadow position={[0, 0.7, 0]}>
            <boxGeometry args={[1.1, 1.4, 1.1]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
          {([[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]] as const).map(([x, z]) => (
            <mesh key={`${x}-${z}`} castShadow position={[x, 1.55, z]}>
              <boxGeometry args={[0.25, 0.45, 0.25]} />
              <meshStandardMaterial color="#854d0e" />
            </mesh>
          ))}
        </group>
      )}

      {kind === "temple" && (
        <group>
          <mesh castShadow position={[0, 0.35, 0]}>
            <boxGeometry args={[0.9, 0.7, 0.9]} />
            <meshStandardMaterial color="#fef3c7" />
          </mesh>
          <mesh castShadow position={[0, 1.15, 0]}>
            <coneGeometry args={[0.55, 1.2, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      )}

      {kind === "beach" && (
        <group>
          <mesh castShadow position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.06, 0.1, 1.1, 6]} />
            <meshStandardMaterial color="#6b4f2a" />
          </mesh>
          <mesh castShadow position={[0.35, 0.85, 0]}>
            <boxGeometry args={[0.7, 0.08, 0.35]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      )}

      {kind === "lake" && (
        <mesh castShadow position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.75, 0.8, 0.12, 16]} />
          <meshStandardMaterial color={color} metalness={0.25} roughness={0.35} />
        </mesh>
      )}

      {kind === "nature" && (
        <group>
          <mesh castShadow position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.1, 0.14, 0.8, 6]} />
            <meshStandardMaterial color="#5c4033" />
          </mesh>
          <mesh castShadow position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.55, 10, 10]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      )}

      {(kind === "monument" || kind === "plaza") && (
        <group>
          <mesh castShadow position={[0, 0.9, 0]}>
            <boxGeometry args={[0.7, 1.6, 0.7]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh castShadow position={[0, 1.85, 0]}>
            <boxGeometry args={[1.0, 0.18, 1.0]} />
            <meshStandardMaterial color="#a8a29e" />
          </mesh>
        </group>
      )}

      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial
          color={hasCoin ? "#f5c842" : "#94a3b8"}
          emissive={near ? "#f59e0b" : "#000000"}
          emissiveIntensity={near ? 0.7 : 0}
        />
      </mesh>
    </group>
  );
}
