import { useMemo } from "react";
import { Coin, type CoinTier } from "./Coin";
import type { WorldStop } from "../lib/geoToWorld";
import { pointInPolygon } from "../lib/geoToWorld";

export interface TrailCoin {
  id: string;
  position: [number, number, number];
  tier: CoinTier;
}

/** Scatter silver/bronze coins along roads between famous places. */
export function buildTrailCoins(
  worldStops: WorldStop[],
  borderXZ: [number, number][],
  perSegment = 2,
): TrailCoin[] {
  const trails: TrailCoin[] = [];
  if (worldStops.length < 2) return trails;

  for (let i = 0; i < worldStops.length - 1; i++) {
    const a = worldStops[i].position;
    const b = worldStops[i + 1].position;
    for (let s = 1; s <= perSegment; s++) {
      const t = s / (perSegment + 1);
      // slight sideways wobble so trails aren't a straight line
      const ox = (i % 2 === 0 ? 1 : -1) * 0.35 * Math.sin(t * Math.PI);
      const x = a[0] + (b[0] - a[0]) * t + ox;
      const z = a[2] + (b[2] - a[2]) * t;
      if (borderXZ.length >= 3 && !pointInPolygon(x, z, borderXZ)) continue;
      trails.push({
        id: `trail-${i}-${s}`,
        position: [x, 0.9, z],
        tier: s === 1 ? "silver" : "bronze",
      });
    }
  }
  return trails;
}

interface TrailCoinLayerProps {
  trails: TrailCoin[];
  collectedIds: string[];
}

export function TrailCoinLayer({ trails, collectedIds }: TrailCoinLayerProps) {
  return (
    <>
      {trails.map((c) => (
        <Coin
          key={c.id}
          position={c.position}
          collected={collectedIds.includes(c.id)}
          tier={c.tier}
          size={c.tier === "silver" ? 0.65 : 0.5}
        />
      ))}
    </>
  );
}

export function useTrailCoins(
  worldStops: WorldStop[],
  borderXZ: [number, number][],
): TrailCoin[] {
  return useMemo(
    () => buildTrailCoins(worldStops, borderXZ, 2),
    [worldStops, borderXZ],
  );
}
