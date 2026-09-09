import { REGION_STATES } from "../data/gameStates";

interface TitleScreenProps {
  onStart: () => void;
  totalCoins: number;
  completedCount: number;
}

export function TitleScreen({ onStart, totalCoins, completedCount }: TitleScreenProps) {
  return (
    <div className="title-screen">
      <div className="title-bg" style={{ backgroundImage: "url(/diorama/india.webp)" }} />
      <div className="title-content">
        <p className="title-kicker">For adventure travelers</p>
        <h1>Wander India</h1>
        <p className="title-sub">
          Real state borders. Real famous places. Earn coins at forts, temples, beaches, and jungles —
          then buy the car, boat, flight, or parachute that fits the road ahead. Finish every state to
          unlock the full Incredible India explore. Stray outside a border and that state restarts.
        </p>
        {totalCoins > 0 && (
          <p className="title-save">
            Passport open — {totalCoins} coins · {completedCount}/{REGION_STATES.length} states stamped
          </p>
        )}
        <button type="button" className="btn-primary" onClick={onStart}>
          {totalCoins > 0 ? "Continue the journey" : "Begin the adventure"}
        </button>
        <div className="title-controls">
          <span>Walk the border</span>
          <span>Collect places</span>
          <span>V = ride</span>
          <span>H = friend</span>
        </div>
      </div>
    </div>
  );
}
