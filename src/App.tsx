import { useEffect, useState } from "react";
import { getNextState, isIndiaFinale } from "./data/gameStates";
import { CompletionScreen } from "./scenes/CompletionScreen";
import { HubScene } from "./scenes/HubScene";
import { StateScene } from "./scenes/StateScene";
import { TitleScreen } from "./scenes/TitleScreen";
import { useInput } from "./store/input";
import { useProgress } from "./store/progress";

type Screen = "title" | "hub" | "game" | "complete";

function clearControls() {
  useInput.getState().resetAll();
}

export default function App() {
  const progress = useProgress();
  const [screen, setScreen] = useState<Screen>("title");
  const [activeState, setActiveState] = useState<string>("delhi");
  const [completion, setCompletion] = useState<{ slug: string; isIndiaWin: boolean } | null>(
    null,
  );

  // Stuck WASD / joystick after leaving a level
  useEffect(() => {
    clearControls();
  }, [screen, activeState]);

  useEffect(() => {
    const onBlur = () => clearControls();
    const onVisibility = () => {
      if (document.hidden) clearControls();
    };
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const handleStateComplete = (slug: string, _isIndiaWin: boolean) => {
    clearControls();
    const finishedFinale = isIndiaFinale(slug);
    setCompletion({ slug, isIndiaWin: finishedFinale });
    setScreen("complete");
  };

  const handleContinue = () => {
    clearControls();
    const next = getNextState(completion?.slug ?? "");
    if (next) {
      setActiveState(next.slug);
      setCompletion(null);
      setScreen("game");
    } else {
      setCompletion(null);
      setScreen("hub");
    }
  };

  return (
    <div className="app">
      {screen === "title" && (
        <TitleScreen
          onStart={() => {
            clearControls();
            setScreen("hub");
          }}
          totalCoins={progress.totalCoins}
          completedCount={progress.completedStates.filter((s) => s !== "india").length}
        />
      )}

      {screen === "hub" && (
        <HubScene
          onSelect={(slug) => {
            clearControls();
            setActiveState(slug);
            setScreen("game");
          }}
          onBack={() => {
            clearControls();
            setScreen("title");
          }}
          onReset={() => progress.reset()}
        />
      )}

      {screen === "game" && (
        <StateScene
          slug={activeState}
          onExit={() => {
            clearControls();
            setScreen("hub");
          }}
          onStateComplete={handleStateComplete}
        />
      )}

      {screen === "complete" && completion && (
        <CompletionScreen
          stateSlug={completion.slug}
          isIndiaWin={completion.isIndiaWin}
          totalCoins={progress.totalCoins}
          onContinue={handleContinue}
          onHub={() => {
            clearControls();
            setCompletion(null);
            setScreen("hub");
          }}
        />
      )}
    </div>
  );
}
