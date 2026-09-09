import type { LandmarkKind } from "./gameStates";

/** Default art per landmark kind */
export const KIND_ART: Record<LandmarkKind, string> = {
  fort: "/landmarks/fort.png",
  temple: "/landmarks/temple.png",
  beach: "/landmarks/beach.png",
  lake: "/landmarks/lake.png",
  nature: "/landmarks/nature.png",
  monument: "/landmarks/monument.png",
  plaza: "/landmarks/plaza.png",
};

/** Famous named places → specific miniature art */
const NAME_ART: { match: RegExp; src: string }[] = [
  { match: /taj|agra fort/i, src: "/landmarks/taj-mahal.png" },
  { match: /red fort|lal qila/i, src: "/landmarks/red-fort.png" },
  { match: /india gate/i, src: "/landmarks/india-gate.png" },
  { match: /qutub|qutb/i, src: "/landmarks/qutub-minar.png" },
  { match: /golden temple|harmandir/i, src: "/landmarks/golden-temple.png" },
  { match: /gateway of india/i, src: "/landmarks/gateway-of-india.png" },
  { match: /hawa mahal/i, src: "/landmarks/hawa-mahal.png" },
  { match: /charminar/i, src: "/landmarks/charminar.png" },
  { match: /meenakshi|gopuram|brihadeeswar|shore temple/i, src: "/landmarks/temple-gopuram.png" },
  { match: /victoria memorial/i, src: "/landmarks/victoria-memorial.png" },
  { match: /howrah/i, src: "/landmarks/howrah-bridge.png" },
  { match: /statue of unity/i, src: "/landmarks/statue-of-unity.png" },
  { match: /mysore palace|palace/i, src: "/landmarks/palace.png" },
  { match: /humayun|sanchi|tomb|memorial/i, src: "/landmarks/garden-tomb.png" },
];

export function landmarkArtFor(name: string, kind: LandmarkKind): string {
  for (const entry of NAME_ART) {
    if (entry.match.test(name)) return entry.src;
  }
  return KIND_ART[kind];
}

export const COIN_ART = {
  gold: "/coins/coin-gold.png",
  silver: "/coins/coin-silver.png",
  bronze: "/coins/coin-bronze.png",
} as const;
