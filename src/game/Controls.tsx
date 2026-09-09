import { useRef } from "react";
import { useInput } from "../store/input";

export function TouchControls() {
  const stickRef = useRef<HTMLDivElement>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  const onStart = (clientX: number, clientY: number) => {
    origin.current = { x: clientX, y: clientY };
  };

  const onMove = (clientX: number, clientY: number) => {
    if (!origin.current) return;
    const dx = clientX - origin.current.x;
    const dy = clientY - origin.current.y;
    const max = 40;
    const nx = Math.max(-1, Math.min(1, dx / max));
    const ny = Math.max(-1, Math.min(1, dy / max));
    useInput.getState().setTouch(nx, ny);
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${nx * 28}px, ${ny * 28}px)`;
    }
  };

  const onEnd = () => {
    origin.current = null;
    useInput.getState().resetTouch();
    if (knobRef.current) knobRef.current.style.transform = "translate(0, 0)";
  };

  return (
    <div className="touch-controls">
      <div
        ref={stickRef}
        className="joystick"
        onTouchStart={(e) => {
          const t = e.touches[0];
          onStart(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const t = e.touches[0];
          onMove(t.clientX, t.clientY);
        }}
        onTouchEnd={onEnd}
        onTouchCancel={onEnd}
      >
        <div ref={knobRef} className="joystick-knob" />
      </div>
      <div className="touch-buttons">
        <button
          type="button"
          className="touch-btn"
          onTouchStart={() => useInput.getState().setKey("jump", true)}
          onTouchEnd={() => useInput.getState().setKey("jump", false)}
        >
          Jump
        </button>
        <button
          type="button"
          className="touch-btn"
          onTouchStart={() => useInput.getState().setKey("interact", true)}
          onTouchEnd={() => useInput.getState().setKey("interact", false)}
        >
          Collect
        </button>
        <button
          type="button"
          className="touch-btn"
          onTouchStart={() => useInput.getState().setKey("transportCycle", true)}
          onTouchEnd={() => useInput.getState().setKey("transportCycle", false)}
        >
          Ride
        </button>
        <button
          type="button"
          className="touch-btn"
          onTouchStart={() => useInput.getState().setKey("callFriend", true)}
          onTouchEnd={() => useInput.getState().setKey("callFriend", false)}
        >
          Friend
        </button>
      </div>
    </div>
  );
}
