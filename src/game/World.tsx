import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { Biome, WaterZone } from "../data/gameStates";
import {
  pointInPolygon,
  projectRingToWorld,
  TERRAIN_DEPTH,
  TERRAIN_WIDTH,
  type StateBoundary,
  type WorldStop,
} from "../lib/geoToWorld";

interface WorldProps {
  diorama: string;
  biome: Biome;
  waterZones: WaterZone[];
  worldStops: WorldStop[];
  boundary: StateBoundary;
}

function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function Mountain({
  position,
  scale,
  color,
  snow = false,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  snow?: boolean;
}) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, scale * 0.45, 0]}>
        <coneGeometry args={[scale * 0.9, scale * 1.4, 6]} />
        <meshStandardMaterial color={color} roughness={0.95} flatShading />
      </mesh>
      {snow && (
        <mesh castShadow position={[0, scale * 1.0, 0]}>
          <coneGeometry args={[scale * 0.35, scale * 0.45, 6]} />
          <meshStandardMaterial color="#f5f5f0" roughness={0.7} flatShading />
        </mesh>
      )}
    </group>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.7, 6]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>
      <mesh castShadow position={[0, 0.95, 0]}>
        <coneGeometry args={[0.45, 1.0, 7]} />
        <meshStandardMaterial color="#1b4332" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Palm({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 1.4, 6]} />
        <meshStandardMaterial color="#6b4f2a" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          castShadow
          position={[Math.cos(i * 1.5) * 0.35, 1.4, Math.sin(i * 1.5) * 0.35]}
          rotation={[0.6, i, 0]}
        >
          <boxGeometry args={[0.12, 0.04, 0.7]} />
          <meshStandardMaterial color="#52b788" />
        </mesh>
      ))}
    </group>
  );
}

function RoadSegment({
  from,
  to,
  color,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
}) {
  const mid = useMemo(() => {
    const dx = to[0] - from[0];
    const dz = to[2] - from[2];
    const length = Math.hypot(dx, dz) || 0.01;
    return {
      mid: [(from[0] + to[0]) / 2, 0.28, (from[2] + to[2]) / 2] as [number, number, number],
      length,
      rotY: Math.atan2(dx, dz),
    };
  }, [from, to]);

  return (
    <group position={mid.mid} rotation={[0, mid.rotY, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[0.95, 0.05, mid.length]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.07, 0.02, mid.length * 0.92]} />
        <meshStandardMaterial color="#f4e9c8" />
      </mesh>
    </group>
  );
}

/** Real state outline as walkable extruded terrain + glowing border. */
function StateShapeTerrain({
  boundary,
  groundColor,
}: {
  boundary: StateBoundary;
  diorama: string;
  groundColor: string;
}) {
  const { shapeGeo, edgePoints } = useMemo(() => {
    const worldRing = projectRingToWorld(boundary.ring, boundary.bbox);
    const shape = new THREE.Shape();
    worldRing.forEach(([x, z], i) => {
      if (i === 0) shape.moveTo(x, z);
      else shape.lineTo(x, z);
    });
    const shapeGeo = new THREE.ShapeGeometry(shape);
    shapeGeo.rotateX(-Math.PI / 2);
    return { shapeGeo, edgePoints: worldRing };
  }, [boundary]);

  const edgeGeom = useMemo(() => {
    const pts = edgePoints.map(([x, z]) => new THREE.Vector3(x, 0.4, z));
    if (pts.length && !pts[0].equals(pts[pts.length - 1])) pts.push(pts[0].clone());
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [edgePoints]);

  return (
    <group>
      {/* Always-visible base so the map never looks empty */}
      <RigidBody type="fixed" colliders="cuboid" friction={1.5}>
        <mesh receiveShadow position={[0, -0.08, 0]}>
          <boxGeometry args={[TERRAIN_WIDTH + 6, 0.35, TERRAIN_DEPTH + 6]} />
          <meshStandardMaterial color="#4a3728" />
        </mesh>
      </RigidBody>

      <mesh geometry={shapeGeo} receiveShadow position={[0, 0.22, 0]} castShadow>
        <meshStandardMaterial color={groundColor} roughness={0.92} metalness={0.02} />
      </mesh>

      <lineLoop geometry={edgeGeom}>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </lineLoop>
    </group>
  );
}

export function World({ diorama, biome, waterZones, worldStops, boundary }: WorldProps) {
  const groundColor =
    biome === "desert"
      ? "#c2a878"
      : biome === "coast"
        ? "#d2c29a"
        : biome === "himalaya"
          ? "#8a9a8a"
          : biome === "plains"
            ? "#a8b87a"
            : "#5d8a5a";
  const mountainColor = biome === "himalaya" ? "#6b7280" : biome === "desert" ? "#b08968" : "#3d5a40";
  const roadColor = biome === "desert" ? "#8b7355" : "#3d3d3d";

  const worldBorder = useMemo(
    () => projectRingToWorld(boundary.ring, boundary.bbox),
    [boundary],
  );

  const decorations = useMemo(() => {
    const trees: [number, number, number][] = [];
    const palms: [number, number, number][] = [];
    const mountains: { p: [number, number, number]; s: number; snow: boolean }[] = [];

    for (let i = 0; i < 20; i++) {
      const x = (seeded(i + 1) - 0.5) * TERRAIN_WIDTH * 0.75;
      const z = (seeded(i + 40) - 0.5) * TERRAIN_DEPTH * 0.75;
      if (!pointInPolygon(x, z, worldBorder)) continue;
      const nearStop = worldStops.some(
        (s) => Math.hypot(s.position[0] - x, s.position[2] - z) < 2.2,
      );
      if (nearStop) continue;
      if (biome === "coast") palms.push([x, 0.25, z]);
      else trees.push([x, 0.25, z]);
    }

    for (let i = 0; i < (biome === "himalaya" ? 8 : 4); i++) {
      const x = (seeded(i + 10) - 0.5) * TERRAIN_WIDTH * 0.7;
      const z = (seeded(i + 20) - 0.5) * TERRAIN_DEPTH * 0.7;
      if (!pointInPolygon(x, z, worldBorder)) continue;
      mountains.push({
        p: [x, 0.2, z],
        s: 1.4 + seeded(i) * 1.8,
        snow: biome === "himalaya",
      });
    }

    return { trees, palms, mountains };
  }, [biome, worldStops, worldBorder]);

  return (
    <group>
      <StateShapeTerrain boundary={boundary} diorama={diorama} groundColor={groundColor} />

      {worldStops.map((stop) => {
        const h = stop.height;
        const color =
          h >= 0.65 ? "#9ca3af" : h >= 0.35 ? "#2d6a4f" : biome === "coast" ? "#e9d8a6" : "#6c757d";
        return (
          <mesh
            key={`pad-${stop.id}`}
            receiveShadow
            position={[stop.position[0], 0.26, stop.position[2]]}
          >
            <cylinderGeometry args={[1.8, 1.9, 0.04, 16]} />
            <meshStandardMaterial color={color} roughness={0.95} transparent opacity={0.5} />
          </mesh>
        );
      })}

      {(() => {
        const hubs = new Map<string, [number, number, number]>();
        for (const s of worldStops) {
          const key = s.hubName ?? s.name;
          if (!hubs.has(key)) hubs.set(key, [s.position[0], 0.55, s.position[2]]);
        }
        const pts = [...hubs.values()];
        return pts.slice(0, -1).map((from, i) => (
          <RoadSegment key={`road-${i}`} from={from} to={pts[i + 1]} color={roadColor} />
        ));
      })()}

      {waterZones.map((zone, i) => (
        <mesh key={`water-${i}`} position={[zone.x, 0.3, zone.z]} receiveShadow>
          <boxGeometry args={[zone.width, 0.1, zone.depth]} />
          <meshStandardMaterial color="#1a8fb5" transparent opacity={0.65} />
        </mesh>
      ))}

      {decorations.mountains.map((m, i) => (
        <Mountain key={`mt-${i}`} position={m.p} scale={m.s} color={mountainColor} snow={m.snow} />
      ))}
      {decorations.trees.map((p, i) => (
        <Tree key={`t-${i}`} position={p} />
      ))}
      {decorations.palms.map((p, i) => (
        <Palm key={`p-${i}`} position={p} />
      ))}

      {/* Out-of-bounds warning band label via floating rings at corners of bbox */}
    </group>
  );
}
