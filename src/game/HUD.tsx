import { useMemo } from "react";
import type { GameStateLevel, TransportMode } from "../data/gameStates";
import { TRANSPORT_COSTS, FRIEND_RESCUE_COST } from "../data/economy";
import type { WorldStop } from "../lib/geoToWorld";
import type { MovementMode } from "./Player";
import { useProgress } from "../store/progress";
import { useGameUi } from "../store/gameUi";

interface HUDProps {
  state: GameStateLevel;
  worldStops: WorldStop[];
  collectedIds: string[];
  collectedCount: number;
  totalCoins: number;
  movementMode: MovementMode;
  transport: TransportMode;
  nearStop: WorldStop | null;
  yaw: number;
  paused: boolean;
  borderDanger?: boolean;
  showIntro?: boolean;
  onDismissIntro?: () => void;
  onPause: () => void;
  onResume: () => void;
  onExit: () => void;
}

function compassLabel(yaw: number): string {
  const deg = ((yaw * 180) / Math.PI + 360) % 360;
  if (deg >= 315 || deg < 45) return "N";
  if (deg >= 45 && deg < 135) return "E";
  if (deg >= 135 && deg < 225) return "S";
  return "W";
}

export function HUD({
  state,
  worldStops,
  collectedIds,
  collectedCount,
  totalCoins,
  movementMode,
  transport,
  nearStop,
  yaw,
  paused,
  borderDanger = false,
  showIntro = false,
  onDismissIntro,
  onPause,
  onResume,
  onExit,
}: HUDProps) {
  const progress = useProgress();
  const playerPos = useGameUi((s) => s.playerPos);
  const progressPct = (collectedCount / Math.max(1, state.stops.length)) * 100;
  const toast = progress.toast;
  const wanted = progress.wantedLevel;

  const quest = useMemo(() => {
    let best: WorldStop | null = null;
    let bestDist = Infinity;
    for (const stop of worldStops) {
      if (collectedIds.includes(stop.id)) continue;
      const d = Math.hypot(playerPos[0] - stop.position[0], playerPos[2] - stop.position[2]);
      if (d < bestDist) {
        bestDist = d;
        best = stop;
      }
    }
    if (!best) return null;
    const dx = best.position[0] - playerPos[0];
    const dz = best.position[2] - playerPos[2];
    const worldAngle = Math.atan2(dx, dz);
    // Arrow rotation relative to facing: 0 = straight ahead
    const relative = ((worldAngle - yaw) * 180) / Math.PI;
    return { name: best.name, dist: bestDist, relative };
  }, [worldStops, collectedIds, playerPos, yaw]);

  return (
    <div className="hud">
      <div className="hud-top">
        <div className="hud-badge">{state.name}</div>
        <div className="hud-coins">🪙 {totalCoins}</div>
        <div className="hud-compass">{compassLabel(yaw)}</div>
        {wanted > 0 && (
          <div className="hud-wanted" title="Wanted by cops">
            {"⭐".repeat(wanted)}
          </div>
        )}
        <button type="button" className="hud-btn" onClick={onPause}>
          ⏸
        </button>
      </div>

      <div className="hud-progress">
        <div className="hud-progress-fill" style={{ width: `${progressPct}%` }} />
        <span>
          {collectedCount}/{state.stops.length} spots
        </span>
      </div>

      {quest && (
        <div className="hud-quest" title={quest.name}>
          <div
            className="hud-quest-arrow"
            style={{ transform: `rotate(${quest.relative}deg)` }}
            aria-hidden
          >
            ▲
          </div>
          <div className="hud-quest-meta">
            <strong>{quest.name}</strong>
            <span>{quest.dist < 1.5 ? "Almost there" : `${quest.dist.toFixed(0)}m ahead`}</span>
          </div>
        </div>
      )}

      <div className="hud-mode">
        Mode: <strong>{movementMode.toUpperCase()}</strong> · Ride:{" "}
        <strong>{transport.toUpperCase()}</strong>
        {state.jungleAdventure && " · F = jungle targets"}
      </div>
      <div className={`hud-border-tip ${borderDanger ? "danger" : ""}`}>
        {borderDanger
          ? "⚠ Near / over the border — turn back! 2nd exit restarts this state"
          : `Red outline = real ${state.name} border · 1st exit = warning, 2nd = restart`}
      </div>

      <div className="hud-transport-bar">
        {state.transports.map((t) => {
          const owned = t === "walk" || progress.hasTransport(t);
          const cost = TRANSPORT_COSTS[t];
          return (
            <button
              key={t}
              type="button"
              className={`transport-chip ${owned ? "owned" : ""} ${transport === t ? "active" : ""}`}
              onClick={() => {
                if (owned) {
                  useProgress.getState().setToast(`Press V to cycle — or unlock in pause`);
                  return;
                }
                const res = progress.buyTransport(t);
                progress.setToast(res.message);
              }}
            >
              {t}
              {!owned && cost ? ` (${cost}🪙)` : ""}
            </button>
          );
        })}
      </div>

      {wanted > 0 && (
        <div className="hud-wanted-banner">
          Cops are after you! Press <strong>H</strong> to call {progress.friendName} (
          {FRIEND_RESCUE_COST * wanted}🪙)
        </div>
      )}

      {toast && <div className="hud-toast">{toast}</div>}

      {nearStop && (
        <div className="hud-hint">
          <p className="hud-hint-title">{nearStop.name}</p>
          <p className="hud-hint-move">{nearStop.movementHint}</p>
          <p className="hud-hint-body">{nearStop.hint}</p>
          <p className="hud-hint-action">Walk into the landmark — coin collects automatically (or press E)</p>
        </div>
      )}

      <div className="hud-stops">
        {worldStops.map((s) => {
          const done = collectedIds.includes(s.id);
          const active = nearStop?.id === s.id;
          return (
            <span key={s.id} className={`${done ? "done" : ""} ${active ? "active" : ""}`.trim()}>
              {s.name}
            </span>
          );
        })}
      </div>

      {showIntro && (
        <div className="state-intro" role="dialog">
          <div className="state-intro-card">
            <p className="state-intro-kicker">Adventure begins</p>
            <h2>{state.name}</h2>
            <p className="state-intro-tag">{state.tagline}</p>
            <ul>
              <li>{state.stops.length} famous places to stamp</li>
              <li>Follow the gold arrow to your next stop</li>
              <li>Stay inside the red border — 1 warning, then restart</li>
              {state.jungleAdventure && <li>Jungle targets: press F</li>}
            </ul>
            <button type="button" className="btn-primary" onClick={onDismissIntro}>
              Let&apos;s explore
            </button>
          </div>
        </div>
      )}

      {paused && (
        <div className="overlay">
          <div className="modal">
            <h2>Paused</h2>
            <p className="modal-note">
              Adventure rules: stay inside the red state outline (1st exit warns, 2nd restarts). Coins
              live at real famous places and along trails. Spend coins for rides. Call your friend (H)
              if the cops are after you.
            </p>
            <button type="button" onClick={onResume}>
              Resume
            </button>
            <button type="button" onClick={onExit}>
              Back to Hub
            </button>
            {state.atlasUrl ? (
              <a href={state.atlasUrl} target="_blank" rel="noreferrer noopener">
                Read the real guide →
              </a>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
