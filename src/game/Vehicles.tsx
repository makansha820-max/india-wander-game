import * as THREE from "three";
import type { TransportMode } from "../data/gameStates";

export function VehicleMesh({ mode }: { mode: TransportMode }) {
  if (mode === "walk") return null;

  if (mode === "car") {
    return (
      <group position={[0, 0.35, 0]}>
        <mesh castShadow position={[0, 0.35, 0]}>
          <boxGeometry args={[1.2, 0.45, 2.2]} />
          <meshStandardMaterial color="#1d3557" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh castShadow position={[0, 0.7, -0.15]}>
          <boxGeometry args={[1.05, 0.4, 1.1]} />
          <meshStandardMaterial color="#457b9d" metalness={0.3} roughness={0.35} />
        </mesh>
        {[
          [-0.45, 0.15, 0.7],
          [0.45, 0.15, 0.7],
          [-0.45, 0.15, -0.7],
          [0.45, 0.15, -0.7],
        ].map((p, i) => (
          <mesh key={i} castShadow position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.18, 12]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))}
      </group>
    );
  }

  if (mode === "cruise") {
    return (
      <group position={[0, 0.1, 0]}>
        <mesh castShadow position={[0, 0.25, 0]}>
          <boxGeometry args={[1.4, 0.35, 3.2]} />
          <meshStandardMaterial color="#f1faee" roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0, 0.55, -0.4]}>
          <boxGeometry args={[1.0, 0.4, 1.4]} />
          <meshStandardMaterial color="#e63946" />
        </mesh>
      </group>
    );
  }

  if (mode === "flight") {
    return (
      <group position={[0, 1.2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.45, 2.8]} />
          <meshStandardMaterial color="#a8dadc" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[3.2, 0.08, 0.55]} />
          <meshStandardMaterial color="#457b9d" />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[0, 2.2, 0]}>
      <mesh>
        <sphereGeometry args={[1.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#e63946" side={THREE.DoubleSide} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[Math.cos(i) * 0.4, -1.1, Math.sin(i) * 0.4]} rotation={[0.4, i, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 2.2, 4]} />
          <meshStandardMaterial color="#ddd" />
        </mesh>
      ))}
    </group>
  );
}
