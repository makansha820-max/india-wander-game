import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameUi } from "../store/gameUi";
import { useProgress } from "../store/progress";
import { WANTED } from "../data/economy";

function CopFigure() {
  return (
    <group>
      <mesh castShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[0.4, 0.55, 0.28]} />
        <meshStandardMaterial color="#1b4332" />
      </mesh>
      <mesh castShadow position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color="#e0b090" />
      </mesh>
      <mesh position={[0, 1.62, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.12, 10]} />
        <meshStandardMaterial color="#081c15" />
      </mesh>
      <mesh castShadow position={[-0.12, 0.45, 0]}>
        <boxGeometry args={[0.14, 0.5, 0.14]} />
        <meshStandardMaterial color="#081c15" />
      </mesh>
      <mesh castShadow position={[0.12, 0.45, 0]}>
        <boxGeometry args={[0.14, 0.5, 0.14]} />
        <meshStandardMaterial color="#081c15" />
      </mesh>
    </group>
  );
}

interface CopProps {
  home: [number, number, number];
}

export function Cop({ home }: CopProps) {
  const group = useRef<THREE.Group>(null);
  const alertCooldown = useRef(0);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    alertCooldown.current = Math.max(0, alertCooldown.current - delta);

    const wanted = useProgress.getState().wantedLevel;
    const player = useGameUi.getState().playerPos;
    const shooting = useGameUi.getState().shooting;
    const transport = useGameUi.getState().transport;

    const dx = player[0] - g.position.x;
    const dz = player[2] - g.position.z;
    const dist = Math.hypot(dx, dz);

    // Misbehave near a cop → raise wanted
    if (dist < 4 && alertCooldown.current <= 0) {
      if (shooting) {
        useProgress.getState().raiseWanted(WANTED.shootNearCop, "Fired near police!");
        alertCooldown.current = 2.5;
      } else if (transport === "car" && dist < 2.5) {
        useProgress.getState().raiseWanted(WANTED.speedInCar, "Reckless driving!");
        alertCooldown.current = 3.5;
      }
    }

    if (wanted > 0) {
      // Chase player
      const speed = 2.2 + wanted * 0.6;
      if (dist > 0.4) {
        g.position.x += (dx / dist) * speed * delta;
        g.position.z += (dz / dist) * speed * delta;
        g.rotation.y = Math.atan2(dx, dz);
      } else if (alertCooldown.current <= 0) {
        // Caught — fine coins
        const fine = wanted * 2;
        const p = useProgress.getState();
        if (p.totalCoins >= fine) {
          p.spendCoins(fine);
          p.clearWanted();
          p.setToast(`Cops caught you — paid ${fine} coin fine.`);
        } else {
          p.setToast(`Cops caught you! Call friend (H) — need coins for bail.`);
        }
        alertCooldown.current = 4;
        g.position.set(home[0], home[1], home[2]);
      }
    } else {
      // Patrol back toward home
      const hx = home[0] - g.position.x;
      const hz = home[2] - g.position.z;
      const hd = Math.hypot(hx, hz);
      if (hd > 0.3) {
        g.position.x += (hx / hd) * 1.2 * delta;
        g.position.z += (hz / hd) * 1.2 * delta;
      }
    }
  });

  return (
    <group ref={group} position={home}>
      <CopFigure />
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color={useProgress.getState().wantedLevel > 0 ? "#e63946" : "#52b788"}
          emissive={useProgress.getState().wantedLevel > 0 ? "#e63946" : "#000"}
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

export function CopLayer({ plazas }: { plazas: [number, number, number][] }) {
  // One cop near first and last plaza
  const homes = plazas.filter((_, i) => i === 0 || i === plazas.length - 1);
  return (
    <>
      {homes.map((h, i) => (
        <Cop key={i} home={[h[0] + 1.8, 0.2, h[2] + 1.5]} />
      ))}
    </>
  );
}
