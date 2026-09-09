import { Text } from "@react-three/drei";

interface StopMarkerProps {
  name: string;
  position: [number, number, number];
  near: boolean;
}

export function StopMarker({ name, position, near }: StopMarkerProps) {
  return (
    <group position={[position[0], position[1] + 1.35, position[2]]}>
      <mesh>
        <coneGeometry args={[0.22, 0.55, 8]} />
        <meshStandardMaterial
          color={near ? "#ff4444" : "#cc2222"}
          emissive={near ? "#ff6666" : "#000000"}
          emissiveIntensity={near ? 0.5 : 0}
        />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {near && (
        <Text
          position={[0, 0.95, 0]}
          fontSize={0.32}
          color="#fff8e7"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#1c1914"
        >
          {name}
        </Text>
      )}
    </group>
  );
}
