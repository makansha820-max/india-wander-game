import { Suspense, useCallback, useEffect, useMemo, useRef, useState, Component, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";
import { getGameState, getNextState } from "../data/gameStates";
import { Coin } from "../game/Coin";
import { CopLayer } from "../game/Cops";
import { TouchControls } from "../game/Controls";
import { FamousLandmark } from "../game/FamousLandmark";
import { FriendNPC } from "../game/Friend";
import { HUD } from "../game/HUD";
import { JungleTargets } from "../game/JungleTargets";
import { Player, type MovementMode } from "../game/Player";
import { TrailCoinLayer, useTrailCoins } from "../game/TrailCoins";
import { World } from "../game/World";
import { bboxFromStops, useStateBoundary } from "../lib/boundaries";
import { projectRingToWorld, stopsToWorldPositions, type WorldStop } from "../lib/geoToWorld";
import { useGameUi } from "../store/gameUi";
import { useInput } from "../store/input";
import { useProgress } from "../store/progress";
import { playBorderResetSound, playCoinSound, unlockAudio } from "../lib/sound";

interface StateSceneProps {
  slug: string;
  onExit: () => void;
  onStateComplete: (slug: string, isIndiaWin: boolean) => void;
}

const COLLECT_RADIUS = 2.2;
const AUTO_COLLECT_RADIUS = 1.35;
const TRAIL_COLLECT_RADIUS = 1.1;
const LABEL_CLUSTER = 2.8;

function StopLayer({
  worldStops,
  collectedIds,
}: {
  worldStops: WorldStop[];
  collectedIds: string[];
}) {
  const nearId = useGameUi((s) => s.nearStop?.id);

  const labelVisible = useMemo(() => {
    const show = new Set<string>();
    for (let i = 0; i < worldStops.length; i++) {
      const a = worldStops[i];
      let crowded = false;
      for (let j = 0; j < worldStops.length; j++) {
        if (i === j) continue;
        const b = worldStops[j];
        const d = Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]);
        if (d < LABEL_CLUSTER && a.id > b.id) {
          // keep lexicographically earlier id's label when clustered
          crowded = true;
          break;
        }
      }
      if (!crowded) show.add(a.id);
    }
    // Always show at least the first stop label in a cluster (lowest id among close ones)
    for (const a of worldStops) {
      const cluster = worldStops.filter(
        (b) => Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]) < LABEL_CLUSTER,
      );
      if (cluster.length <= 1) {
        show.add(a.id);
        continue;
      }
      const keeper = [...cluster].sort((x, y) => x.id.localeCompare(y.id))[0];
      show.add(keeper.id);
    }
    return show;
  }, [worldStops]);

  return (
    <>
      {worldStops.map((stop) => {
        const hasCoin = !collectedIds.includes(stop.id);
        const isNear = nearId === stop.id;
        return (
          <group key={stop.id}>
            <FamousLandmark
              name={stop.name}
              kind={stop.landmark}
              position={stop.position}
              near={isNear}
              hasCoin={hasCoin}
              showLabel={isNear || labelVisible.has(stop.id)}
            />
            <Coin position={stop.position} collected={!hasCoin} tier="gold" size={0.9} />
          </group>
        );
      })}
    </>
  );
}

function GameLevel({
  slug,
  onStateComplete,
  onRestartLevel,
}: {
  slug: string;
  onStateComplete: (slug: string, isIndiaWin: boolean) => void;
  onRestartLevel: () => void;
}) {
  const state = getGameState(slug)!;
  const loaded = useStateBoundary(slug);
  const boundary = useMemo(
    () => loaded ?? bboxFromStops(state.stops),
    [loaded, state.stops],
  );
  const worldStops = useMemo(
    () => stopsToWorldPositions(state.stops, boundary.bbox, boundary.ring),
    [state.stops, boundary],
  );
  const borderXZ = useMemo(
    () => projectRingToWorld(boundary.ring, boundary.bbox),
    [boundary],
  );
  const trails = useTrailCoins(worldStops, borderXZ);
  const progress = useProgress();
  const setHud = useGameUi((s) => s.setHud);
  const interactLatch = useRef(false);
  const autoLatch = useRef<string | null>(null);
  const trailLatch = useRef<string | null>(null);

  const [respawnPoint, setRespawnPoint] = useState<[number, number, number]>([0, 1.2, 0]);

  useEffect(() => {
    if (worldStops[0]) setRespawnPoint(worldStops[0].position);
  }, [worldStops]);

  const collectedIds = progress.collectedStops[slug] ?? [];
  const collectedTrails = progress.collectedTrails[slug] ?? [];
  const plazaPositions = worldStops.map(
    (s) => [s.position[0], 0.2, s.position[2]] as [number, number, number],
  );

  const tryFinish = useCallback(() => {
    const nextCollected = (useProgress.getState().collectedStops[slug] ?? []).length;
    if (nextCollected >= state.stops.length && !useProgress.getState().isStateComplete(slug)) {
      useProgress.getState().completeState(slug, state.bonusCoins);
      onStateComplete(slug, !getNextState(slug));
    }
  }, [slug, state, onStateComplete]);

  const collect = useCallback(
    (stop: WorldStop) => {
      if (progress.isStopCollected(slug, stop.id)) return;
      progress.collectStop(slug, stop.id);
      playCoinSound("stamp");
      progress.setToast(`✦ ${stop.name} — stamp collected`);
      setRespawnPoint(stop.position);
      setTimeout(tryFinish, 40);
    },
    [progress, slug, tryFinish],
  );

  const handleOutOfBounds = useCallback(() => {
    playBorderResetSound();
    useProgress.getState().resetStateRun(slug);
    useProgress
      .getState()
      .setToast("You left the state border — adventure resets. Stay inside the red outline!");
    onRestartLevel();
  }, [slug, onRestartLevel]);

  const handleMove = useCallback(
    (pos: THREE.Vector3, mode: MovementMode, playerYaw: number) => {
      let nearest: WorldStop | null = null;
      let nearestDist = COLLECT_RADIUS;
      for (const stop of worldStops) {
        const dx = pos.x - stop.position[0];
        const dz = pos.z - stop.position[2];
        const dist = Math.hypot(dx, dz);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = stop;
        }
      }
      setHud({ movementMode: mode, nearStop: nearest, yaw: playerYaw });

      if (nearest && nearestDist < AUTO_COLLECT_RADIUS && !progress.isStopCollected(slug, nearest.id)) {
        if (autoLatch.current !== nearest.id) {
          autoLatch.current = nearest.id;
          collect(nearest);
        }
      } else if (!nearest || nearestDist > AUTO_COLLECT_RADIUS) {
        autoLatch.current = null;
      }

      const interacting = useInput.getState().interact;
      if (interacting && !interactLatch.current && nearest && !progress.isStopCollected(slug, nearest.id)) {
        interactLatch.current = true;
        collect(nearest);
      }
      if (!interacting) interactLatch.current = false;

      // Trail coins between places
      let nearestTrail: (typeof trails)[number] | null = null;
      let trailDist = TRAIL_COLLECT_RADIUS;
      const already = useProgress.getState().collectedTrails[slug] ?? [];
      for (const trail of trails) {
        if (already.includes(trail.id)) continue;
        const d = Math.hypot(pos.x - trail.position[0], pos.z - trail.position[2]);
        if (d < trailDist) {
          trailDist = d;
          nearestTrail = trail;
        }
      }
      if (nearestTrail && trailLatch.current !== nearestTrail.id) {
        trailLatch.current = nearestTrail.id;
        const value = nearestTrail.tier === "silver" ? 1 : 1;
        useProgress.getState().collectTrail(slug, nearestTrail.id, value);
        playCoinSound(nearestTrail.tier === "silver" ? "silver" : "bronze");
        useProgress.getState().setToast(
          nearestTrail.tier === "silver" ? "✦ Trail coin" : "✦ Dusty trail coin",
        );
      } else if (!nearestTrail) {
        trailLatch.current = null;
      }
    },
    [worldStops, trails, slug, progress, setHud, collect],
  );

  if (!worldStops.length) return null;

  return (
    <>
      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#c9e4ff", "#5c4033", 0.65]} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={1.55}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <fog attach="fog" args={["#d9cbb4", 28, 65]} />
      {/* No Environment / Text — both fetch CDNs blocked by CSP on Vercel */}

      <Physics gravity={[0, -16, 0]}>
        <World
          diorama={state.diorama}
          biome={state.biome}
          waterZones={state.waterZones}
          worldStops={worldStops}
          boundary={boundary}
        />
        <Player
          waterZones={state.waterZones}
          allowedTransports={state.transports}
          jungleAdventure={state.jungleAdventure}
          boundary={boundary}
          onMove={handleMove}
          onRespawn={setRespawnPoint}
          onOutOfBounds={handleOutOfBounds}
          respawnPoint={respawnPoint}
        />
      </Physics>

      <StopLayer worldStops={worldStops} collectedIds={collectedIds} />
      <TrailCoinLayer trails={trails} collectedIds={collectedTrails} />
      <CopLayer plazas={plazaPositions.slice(0, 2)} />
      <FriendNPC />
      <JungleTargets enabled={state.jungleAdventure} />
    </>
  );
}

class SceneErrorBoundary extends Component<
  { children: ReactNode; onBack: () => void },
  { error: string | null }
> {
  state = { error: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { error: error.message || "Scene failed to load" };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="loading-map" style={{ padding: "2rem", textAlign: "center" }}>
          <p>Couldn’t open this adventure.</p>
          <p style={{ color: "#fca5a5", fontSize: "0.9rem" }}>{this.state.error}</p>
          <button type="button" className="btn-ghost" onClick={this.props.onBack}>
            Back to Hub
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function CanvasLoader() {
  return (
    <mesh>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#f5c842" wireframe />
    </mesh>
  );
}

export function StateScene({ slug, onExit, onStateComplete }: StateSceneProps) {
  const state = getGameState(slug);
  const progress = useProgress();
  const { movementMode, nearStop, yaw, transport, borderDanger } = useGameUi();
  const boundary = useStateBoundary(slug);
  const resolved = useMemo(
    () => boundary ?? (state ? bboxFromStops(state.stops) : null),
    [boundary, state],
  );
  const worldStops = useMemo(
    () =>
      state && resolved
        ? stopsToWorldPositions(state.stops, resolved.bbox, resolved.ring)
        : [],
    [state, resolved],
  );
  const [paused, setPaused] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const collectedIds = progress.collectedStops[slug] ?? [];

  useEffect(() => {
    useGameUi.getState().setHud({
      movementMode: "walk",
      nearStop: null,
      yaw: 0,
      transport: "walk",
      shooting: false,
      friendActive: false,
      friendPos: null,
      borderDanger: false,
    });
    setRunKey(0);
    setShowIntro(true);
  }, [slug]);

  if (!state) {
    return (
      <div className="loading-map">
        <p>Unknown state.</p>
        <button type="button" className="btn-ghost" onClick={onExit}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="state-scene">
      <SceneErrorBoundary onBack={onExit}>
        <Canvas
          key={`${slug}-${runKey}`}
          shadows
          camera={{ position: [0, 12, 14], fov: 50, near: 0.1, far: 80 }}
          onCreated={({ gl }) => {
            gl.setClearColor("#d9cbb4");
          }}
        >
          <Suspense fallback={<CanvasLoader />}>
            <GameLevel
              slug={slug}
              onStateComplete={onStateComplete}
              onRestartLevel={() => setRunKey((k) => k + 1)}
            />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>

      <HUD
        state={state}
        worldStops={worldStops}
        collectedIds={collectedIds}
        collectedCount={collectedIds.length}
        totalCoins={progress.totalCoins}
        movementMode={movementMode}
        transport={transport}
        nearStop={nearStop}
        yaw={yaw}
        paused={paused}
        borderDanger={borderDanger}
        showIntro={showIntro}
        onDismissIntro={() => {
          unlockAudio();
          setShowIntro(false);
        }}
        onPause={() => setPaused(true)}
        onResume={() => setPaused(false)}
        onExit={onExit}
      />
      <TouchControls />
    </div>
  );
}
