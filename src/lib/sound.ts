/** Tiny Web Audio feedback — no external files needed. */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.08,
  when = 0,
) {
  const audio = getCtx();
  if (!audio) return;
  const t0 = audio.currentTime + when;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playCoinSound(tier: "gold" | "silver" | "bronze" | "stamp" = "gold") {
  if (tier === "stamp" || tier === "gold") {
    tone(880, 0.12, "triangle", 0.09);
    tone(1320, 0.16, "sine", 0.06, 0.06);
  } else if (tier === "silver") {
    tone(740, 0.1, "triangle", 0.07);
    tone(990, 0.12, "sine", 0.05, 0.05);
  } else {
    tone(520, 0.1, "triangle", 0.06);
  }
}

export function playBorderWarnSound() {
  tone(220, 0.18, "sawtooth", 0.045);
  tone(180, 0.22, "sawtooth", 0.04, 0.12);
}

export function playBorderResetSound() {
  tone(160, 0.25, "square", 0.05);
  tone(120, 0.3, "square", 0.04, 0.15);
}

export function unlockAudio() {
  getCtx();
}
