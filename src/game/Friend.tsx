import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameUi } from "../store/gameUi";
import { useProgress } from "../store/progress";
import { useInput } from "../store/input";

/** Friend NPC — appears when player calls (H), runs to player, clears wanted for coins. */
export function FriendNPC() {
  const group = useRef<THREE.Group>(null);
  const latch = useRef(false);
  const active = useGameUi((s) => s.friendActive);

  useEffect(() => {
    const id = setInterval(() => {
      const call = useInput.getState().callFriend;
      if (call && !latch.current) {
        latch.current = true;
        const result = useProgress.getState().callFriend();
        if (result.ok) {
          const player = useGameUi.getState().playerPos;
          useGameUi.getState().setHud({
            friendActive: true,
            friendPos: [player[0] - 3, 0.2, player[2] - 2],
          });
          setTimeout(() => {
            useGameUi.getState().setHud({ friendActive: false, friendPos: null });
          }, 6000);
        } else {
          useProgress.getState().setToast(result.message);
        }
      }
      if (!call) latch.current = false;
    }, 80);
    return () => clearInterval(id);
  }, []);

  useFrame((_, delta) => {
    const g = group.current;
    const friendPos = useGameUi.getState().friendPos;
    if (!g || !friendPos || !useGameUi.getState().friendActive) return;

    const player = useGameUi.getState().playerPos;
    const dx = player[0] - g.position.x;
    const dz = player[2] - g.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 1.2) {
      g.position.x += (dx / dist) * 5 * delta;
      g.position.z += (dz / dist) * 5 * delta;
      g.rotation.y = Math.atan2(dx, dz);
    }
    useGameUi.getState().setHud({
      friendPos: [g.position.x, g.position.y, g.position.z],
    });
  });

  if (!active) return null;

  const spawn = useGameUi.getState().friendPos ?? [0, 0.2, 0];

  return (
    <group ref={group} position={spawn}>
      <mesh castShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[0.4, 0.55, 0.28]} />
        <meshStandardMaterial color="#f4a261" />
      </mesh>
      <mesh castShadow position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color="#e0b090" />
      </mesh>
      <mesh castShadow position={[-0.12, 0.45, 0]}>
        <boxGeometry args={[0.14, 0.5, 0.14]} />
        <meshStandardMaterial color="#264653" />
      </mesh>
      <mesh castShadow position={[0.12, 0.45, 0]}>
        <boxGeometry args={[0.14, 0.5, 0.14]} />
        <meshStandardMaterial color="#264653" />
      </mesh>
      {/* phone glow */}
      <mesh position={[0.25, 1.0, 0.15]}>
        <boxGeometry args={[0.08, 0.14, 0.03]} />
        <meshStandardMaterial color="#00f5d4" emissive="#00f5d4" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}
