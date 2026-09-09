import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameUi } from "../store/gameUi";
import { useProgress } from "../store/progress";
import { useInput } from "../store/input";

interface TargetProps {
  position: [number, number, number];
  onHit: () => void;
}

function FloatingTarget({ position, onHit }: TargetProps) {
  const ref = useRef<THREE.Mesh>(null);
  const [alive, setAlive] = useState(true);
  const base = useRef(position);

  useFrame(() => {
    if (!ref.current || !alive) return;
    ref.current.position.y = base.current[1] + Math.sin(Date.now() * 0.004 + base.current[0]) * 0.35;
    ref.current.rotation.y += 0.02;

    const shooting = useGameUi.getState().shooting || useInput.getState().shoot;
    if (!shooting) return;
    const player = useGameUi.getState().playerPos;
    const yaw = useGameUi.getState().yaw;
    // Simple cone check: target roughly in front and within range
    const dx = ref.current.position.x - player[0];
    const dz = ref.current.position.z - player[2];
    const dist = Math.hypot(dx, dz);
    if (dist > 8 || dist < 0.5) return;
    const angleTo = Math.atan2(dx, dz);
    let diff = angleTo - yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) < 0.35) {
      setAlive(false);
      onHit();
    }
  });

  if (!alive) return null;

  return (
    <mesh ref={ref} castShadow position={position}>
      <octahedronGeometry args={[0.35, 0]} />
      <meshStandardMaterial color="#e9c46a" emissive="#f4a261" emissiveIntensity={0.5} />
    </mesh>
  );
}

export function JungleTargets({ enabled }: { enabled: boolean }) {
  const spots = useMemo((): [number, number, number][] => {
    if (!enabled) return [];
    return [
      [-4, 1.4, 2],
      [3, 1.6, -2],
      [-2, 1.5, -3],
      [5, 1.8, 1],
      [0, 2.0, 4],
    ];
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {spots.map((p, i) => (
        <FloatingTarget
          key={i}
          position={p}
          onHit={() => {
            useProgress.getState().addCoins(1);
            useProgress.getState().setToast("Target hit! +1 coin");
          }}
        />
      ))}
    </>
  );
}
