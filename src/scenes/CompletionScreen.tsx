import { getGameState, getNextState, isIndiaFinale, REGION_STATES } from "../data/gameStates";

interface CompletionScreenProps {
  stateSlug: string;
  isIndiaWin: boolean;
  totalCoins: number;
  onContinue: () => void;
  onHub: () => void;
}

export function CompletionScreen({
  stateSlug,
  isIndiaWin,
  totalCoins,
  onContinue,
  onHub,
}: CompletionScreenProps) {
  const state = getGameState(stateSlug);
  const next = getNextState(stateSlug);
  const nextIsFinale = next ? isIndiaFinale(next.slug) : false;

  if (isIndiaWin) {
    return (
      <div className="overlay completion">
        <div className="modal win">
          <p className="confetti">🎉</p>
          <h1>Incredible India!</h1>
          <p>
            You finished the full-country tour — {REGION_STATES.length} states plus the grand India
            explore.
          </p>
          <p className="coin-total">Total: 🪙 {totalCoins} coins</p>
          <button type="button" className="btn-primary" onClick={onHub}>
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay completion">
      <div className="modal win">
        <p className="confetti">✨</p>
        <h1>{state?.name} complete!</h1>
        <p>+{state?.bonusCoins} bonus coins · next passport stamped.</p>
        {next && (
          <p>
            Next stop: {next.name}
            {nextIsFinale ? " — the full India adventure!" : ""}
          </p>
        )}
        <div className="modal-actions">
          {next && (
            <button type="button" className="btn-primary" onClick={onContinue}>
              {nextIsFinale ? "Begin Full India Explore" : `Continue to ${next.name}`}
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={onHub}>
            Back to Hub
          </button>
          {state?.atlasUrl ? (
            <a href={state.atlasUrl} target="_blank" rel="noreferrer noopener" className="atlas-link">
              Read the real guide →
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
