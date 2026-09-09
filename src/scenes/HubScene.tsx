import { GAME_STATES, REGION_STATES, STATE_ORDER, isIndiaFinale } from "../data/gameStates";
import { STATE_UNLOCK_COST, TRANSPORT_COSTS } from "../data/economy";
import { useProgress } from "../store/progress";
import { useEffect } from "react";

interface HubSceneProps {
  onSelect: (slug: string) => void;
  onBack: () => void;
  onReset: () => void;
}

export function HubScene({ onSelect, onBack, onReset }: HubSceneProps) {
  const progress = useProgress();

  // If every region is done, open the full-India finale (covers older saves)
  useEffect(() => {
    const allRegionsDone = REGION_STATES.every((s) =>
      useProgress.getState().completedStates.includes(s.slug),
    );
    if (allRegionsDone && !useProgress.getState().isStateUnlocked("india")) {
      useProgress.setState((s) => ({
        unlockedStates: s.unlockedStates.includes("india")
          ? s.unlockedStates
          : [...s.unlockedStates, "india"],
        toast: "Incredible India unlocked — full-country explore!",
      }));
    }
  }, [progress.completedStates]);

  const nextHint = (() => {
    const unfinished = STATE_ORDER.find(
      (slug) => progress.isStateUnlocked(slug) && !progress.isStateComplete(slug),
    );
    if (unfinished) {
      const s = GAME_STATES.find((g) => g.slug === unfinished)!;
      const got = progress.collectedStops[unfinished]?.length ?? 0;
      return `Continue ${s.name}: ${got}/${s.stops.length} places · finish all to unlock the next state free`;
    }
    const locked = STATE_ORDER.find((slug) => !progress.isStateUnlocked(slug));
    if (locked) {
      const s = GAME_STATES.find((g) => g.slug === locked)!;
      return `Next destination: ${s.name} — finish the previous state or pay ${STATE_UNLOCK_COST}🪙`;
    }
    return "All regions stamped — play Incredible India, the full-country finale!";
  })();

  return (
    <div className="hub">
      <div className="hub-bg" style={{ backgroundImage: "url(/diorama/india.webp)" }} />
      <div className="hub-content hub-wide">
        <header className="hub-header">
          <button type="button" className="btn-ghost" onClick={onBack}>
            ← Title
          </button>
          <h1>
            India passport · {REGION_STATES.length} states + finale
          </h1>
          <div className="hub-coins">🪙 {progress.totalCoins}</div>
        </header>

        <p className="hub-next-tip">{nextHint}</p>

        {progress.toast && <div className="hub-toast">{progress.toast}</div>}

        <section className="hub-shop">
          <h2>Travel gear (spend coins)</h2>
          <div className="hub-shop-row">
            {(["car", "cruise", "flight", "parachute"] as const).map((mode) => {
              const owned = progress.hasTransport(mode);
              const cost = TRANSPORT_COSTS[mode];
              return (
                <button
                  key={mode}
                  type="button"
                  className={`shop-chip ${owned ? "owned" : ""}`}
                  disabled={owned}
                  onClick={() => {
                    const res = progress.buyTransport(mode);
                    progress.setToast(res.message);
                  }}
                >
                  {owned ? `✓ ${mode}` : `${mode} · ${cost}🪙`}
                </button>
              );
            })}
          </div>
          <p className="hub-shop-note">
            Haryana (and each next state) unlocks free when you collect every famous place in the
            current state. Or pay {STATE_UNLOCK_COST}🪙 early (next door) / {STATE_UNLOCK_COST * 2}🪙
            to skip ahead. Don’t spend every coin on gear first. Cops: H calls friend.
          </p>
        </section>

        <div className="hub-grid hub-grid-many">
          {GAME_STATES.map((state, i) => {
            const unlocked = progress.isStateUnlocked(state.slug);
            const complete = progress.isStateComplete(state.slug);
            const collected = progress.collectedStops[state.slug]?.length ?? 0;
            const orderIdx = STATE_ORDER.indexOf(state.slug);

            return (
              <div
                key={state.slug}
                className={`hub-card ${unlocked ? "" : "locked"} ${complete ? "complete" : ""} ${isIndiaFinale(state.slug) ? "finale" : ""}`}
              >
                <img src={state.diorama} alt={state.name} />
                <div className="hub-card-body">
                  <h2>
                    <span className="hub-num">{isIndiaFinale(state.slug) ? "★" : i + 1}</span>{" "}
                    {state.name}
                  </h2>
                  <p>{state.tagline}</p>
                  {isIndiaFinale(state.slug) && (
                    <span className="tag-finale">Full India explore</span>
                  )}
                  {state.jungleAdventure && !isIndiaFinale(state.slug) && (
                    <span className="tag-jungle">Jungle adventure</span>
                  )}
                  {unlocked ? (
                    <>
                      <span className="progress">
                        {complete ? "✓ Complete" : `${collected}/${state.stops.length} spots`}
                      </span>
                      <button
                        type="button"
                        className="btn-enter"
                        onClick={() => onSelect(state.slug)}
                      >
                        Enter
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="lock">
                        🔒 Locked
                        {orderIdx === 1
                          ? " · finish all Delhi spots for free, or pay coins"
                          : orderIdx > 0 && progress.isStateComplete(STATE_ORDER[orderIdx - 1])
                            ? " · tap Unlock (free — previous done)"
                            : ""}
                      </span>
                      <button
                        type="button"
                        className="btn-enter buy"
                        onClick={() => {
                          progress.buyStateUnlock(state.slug);
                        }}
                      >
                        Unlock · {orderIdx > 0 && progress.isStateUnlocked(STATE_ORDER[orderIdx - 1])
                          ? STATE_UNLOCK_COST
                          : STATE_UNLOCK_COST * 2}
                        🪙
                        <span className="unlock-have"> (have {progress.totalCoins})</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="hub-footer">
          <p>
            {progress.completedStates.filter((s) => s !== "india").length}/{REGION_STATES.length}{" "}
            states stamped · Final level: Incredible India full-country tour
          </p>
          <button type="button" className="btn-ghost" onClick={onReset}>
            Reset progress
          </button>
        </footer>
      </div>
    </div>
  );
}
