import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { TransportMode, WaterZone } from "../data/gameStates";
import {
  isInWaterZone,
  pointInPolygon,
  projectRingToWorld,
  distanceToPolygonEdge,
  polygonCentroid,
  type StateBoundary,
} from "../lib/geoToWorld";
import { useInput, type InputKey } from "../store/input";
import { useProgress } from "../store/progress";
import { useGameUi } from "../store/gameUi";
import { playBorderWarnSound } from "../lib/sound";
import { Humanoid } from "./Humanoid";
import { VehicleMesh } from "./Vehicles";

export type MovementMode = "walk" | "run" | "swim" | "jump" | "drive" | "fly" | "sail" | "glide";

interface PlayerProps {
  waterZones: WaterZone[];
  allowedTransports: TransportMode[];
  jungleAdventure: boolean;
  boundary: StateBoundary;
  onMove: (pos: THREE.Vector3, mode: MovementMode, yaw: number) => void;
  onRespawn: (pos: [number, number, number]) => void;
  onOutOfBounds: () => void;
  respawnPoint: [number, number, number];
}

const SPEEDS: Record<TransportMode, number> = {
  walk: 4.5,
  car: 11,
  cruise: 6,
  flight: 14,
  parachute: 3.5,
};

const KEY_MAP: Record<string, InputKey> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "jump",
  ShiftLeft: "run",
  ShiftRight: "run",
  KeyE: "interact",
  KeyF: "shoot",
  KeyH: "callFriend",
  KeyV: "transportCycle",
};

export function Player({
  waterZones,
  allowedTransports,
  jungleAdventure,
  boundary,
  onMove,
  onRespawn,
  onOutOfBounds,
  respawnPoint,
}: PlayerProps) {
  const body = useRef<RapierRigidBody>(null);
  const visual = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const jumpCooldown = useRef(0);
  const cycleLatch = useRef(false);
  const outLatch = useRef(false);
  const grace = useRef(1.2);
  const borderStrikes = useRef(0);
  const borderPushCooldown = useRef(0);
  const [mode, setMode] = useState<MovementMode>("walk");
  const [moving, setMoving] = useState(false);
  const [transport, setTransport] = useState<TransportMode>("walk");
  const facing = useRef(0);

  const borderXZ = useMemo(
    () => projectRingToWorld(boundary.ring, boundary.bbox),
    [boundary],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code];
      if (key) {
        e.preventDefault();
        useInput.getState().setKey(key, true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code];
      if (key) useInput.getState().setKey(key, false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      useInput.getState().resetAll();
    };
  }, []);

  useFrame((_, delta) => {
    const rb = body.current;
    if (!rb) return;

    jumpCooldown.current = Math.max(0, jumpCooldown.current - delta);
    grace.current = Math.max(0, grace.current - delta);
    borderPushCooldown.current = Math.max(0, borderPushCooldown.current - delta);

    const pos = rb.translation();
    const vel = rb.linvel();

    // Soft border: 1st exit = push back + warning; 2nd = full state restart
    if (grace.current <= 0 && !outLatch.current && !pointInPolygon(pos.x, pos.z, borderXZ)) {
      if (borderPushCooldown.current > 0) {
        // still resolving first push
      } else if (borderStrikes.current === 0) {
        borderStrikes.current = 1;
        borderPushCooldown.current = 1.4;
        const [cx, cz] = polygonCentroid(borderXZ);
        const dx = cx - pos.x;
        const dz = cz - pos.z;
        const len = Math.hypot(dx, dz) || 1;
        const push = 2.2;
        rb.setTranslation(
          { x: pos.x + (dx / len) * push, y: Math.max(1.2, pos.y), z: pos.z + (dz / len) * push },
          true,
        );
        rb.setLinvel({ x: (dx / len) * 3, y: 0, z: (dz / len) * 3 }, true);
        useProgress.getState().setToast("⚠ Border warning — turn back! One more exit restarts this state.");
        playBorderWarnSound();
        useGameUi.getState().setHud({ borderDanger: true });
      } else {
        outLatch.current = true;
        onOutOfBounds();
        return;
      }
    } else if (pointInPolygon(pos.x, pos.z, borderXZ) && borderStrikes.current > 0) {
      // Safe inside again — keep the strike so a second exit still resets,
      // but clear danger pulse after a short while of being deep inside
      const edge = distanceToPolygonEdge(pos.x, pos.z, borderXZ);
      if (edge > 2.5) {
        // optional: forgive after staying deep inside
        // keep strike so rule stays meaningful
      }
    }

    if (pos.y < -2) {
      rb.setTranslation(
        { x: respawnPoint[0], y: Math.max(1.2, respawnPoint[1]), z: respawnPoint[2] },
        true,
      );
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      onRespawn(respawnPoint);
      return;
    }

    const swimming = isInWaterZone(pos.x, pos.z, waterZones);
    const input = useInput.getState();
    const progress = useProgress.getState();

    if (input.transportCycle && !cycleLatch.current) {
      cycleLatch.current = true;
      const owned = allowedTransports.filter((t) => t === "walk" || progress.hasTransport(t));
      if (owned.length === 0) owned.push("walk");
      const idx = owned.indexOf(transport);
      const next = owned[(idx + 1) % owned.length];

      if (next !== "walk" && !progress.hasTransport(next)) {
        const buy = progress.buyTransport(next);
        progress.setToast(buy.ok ? buy.message : buy.message);
        if (buy.ok) setTransport(next);
      } else if (next === "cruise" && !swimming && !waterZones.length) {
        progress.setToast("Cruise needs water — find a coast or lake.");
      } else {
        setTransport(next);
        progress.setToast(
          next === "walk"
            ? "On foot — the real way to feel a place."
            : `Riding: ${next.toUpperCase()}`,
        );
      }
    }
    if (!input.transportCycle) cycleLatch.current = false;

    let activeTransport = transport;
    if (transport === "cruise" && !swimming) activeTransport = "walk";

    let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0) + input.touchX;
    let dz = (input.back ? 1 : 0) - (input.forward ? 1 : 0) + input.touchY;
    const inputLen = Math.hypot(dx, dz);
    const isMoving = inputLen > 0.08;
    setMoving(isMoving);

    if (isMoving) {
      dx /= inputLen;
      dz /= inputLen;
      facing.current = Math.atan2(dx, dz);
    }

    const baseSpeed =
      swimming && activeTransport === "walk"
        ? 3.5
        : SPEEDS[activeTransport] * (input.run && activeTransport === "walk" ? 1.55 : 1);

    let targetY = vel.y;
    if (activeTransport === "flight") {
      targetY = THREE.MathUtils.lerp(vel.y, isMoving ? 2.5 : 1.5, 0.1);
      if (pos.y < 3) targetY = 4;
    } else if (activeTransport === "parachute") {
      targetY = Math.max(vel.y, -2);
      if (pos.y < 1.5) {
        setTransport("walk");
        activeTransport = "walk";
      }
    }

    rb.setLinvel(
      {
        x: THREE.MathUtils.lerp(vel.x, isMoving ? dx * baseSpeed : 0, 0.18),
        y: targetY,
        z: THREE.MathUtils.lerp(vel.z, isMoving ? dz * baseSpeed : 0, 0.18),
      },
      true,
    );

    if (
      input.jump &&
      jumpCooldown.current <= 0 &&
      Math.abs(vel.y) < 0.5 &&
      activeTransport === "walk" &&
      !swimming
    ) {
      rb.applyImpulse({ x: 0, y: 7, z: 0 }, true);
      jumpCooldown.current = 0.45;
    }

    if (input.jump && activeTransport === "flight" && progress.hasTransport("parachute")) {
      setTransport("parachute");
      activeTransport = "parachute";
      progress.setToast("Parachute deployed — adventure landing!");
    }

    let nextMode: MovementMode = "walk";
    if (activeTransport === "car") nextMode = "drive";
    else if (activeTransport === "cruise") nextMode = "sail";
    else if (activeTransport === "flight") nextMode = "fly";
    else if (activeTransport === "parachute") nextMode = "glide";
    else if (swimming) nextMode = "swim";
    else if (jumpCooldown.current > 0.2) nextMode = "jump";
    else if (input.run && isMoving) nextMode = "run";
    setMode(nextMode);

    const shooting = jungleAdventure && input.shoot;
    const nearBorder =
      pointInPolygon(pos.x, pos.z, borderXZ) &&
      distanceToPolygonEdge(pos.x, pos.z, borderXZ) < 1.35;
    useGameUi.getState().setHud({
      transport: activeTransport,
      shooting,
      playerPos: [pos.x, pos.y, pos.z],
      borderDanger: nearBorder,
    });

    if (visual.current) {
      visual.current.rotation.y = THREE.MathUtils.lerp(
        visual.current.rotation.y,
        facing.current,
        0.2,
      );
    }

    onMove(new THREE.Vector3(pos.x, pos.y, pos.z), nextMode, facing.current);

    const camHeight = activeTransport === "flight" ? 7.2 : activeTransport === "car" ? 5.4 : 4.8;
    const camBack = activeTransport === "flight" ? 11 : 8.2;
    const target = new THREE.Vector3(pos.x, pos.y + 1.25, pos.z);
    const offset = new THREE.Vector3(0, camHeight, camBack).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      facing.current * 0.18,
    );
    camera.position.lerp(target.clone().add(offset), 0.08);
    camera.lookAt(target);
  });

  const spawn: [number, number, number] = [
    respawnPoint[0],
    Math.max(1.2, respawnPoint[1]),
    respawnPoint[2],
  ];

  const showHuman = transport === "walk" || transport === "parachute";

  return (
    <RigidBody
      ref={body}
      colliders={false}
      mass={1}
      linearDamping={0.6}
      angularDamping={1}
      enabledRotations={[false, false, false]}
      position={spawn}
    >
      <CapsuleCollider args={[0.45, 0.28]} position={[0, 0.9, 0]} />
      <group ref={visual}>
        {showHuman && (
          <Humanoid
            mode={mode}
            moving={moving && (transport === "walk" || transport === "parachute")}
          />
        )}
        <VehicleMesh mode={transport} />
        {jungleAdventure && transport === "walk" && (
          <mesh position={[0.35, 1.0, 0.25]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.08, 0.08, 0.55]} />
            <meshStandardMaterial color="#333" metalness={0.6} />
          </mesh>
        )}
      </group>
    </RigidBody>
  );
}
