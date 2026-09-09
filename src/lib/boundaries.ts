import { useEffect, useState } from "react";
import type { StateBoundary } from "../lib/geoToWorld";

let cache: Record<string, StateBoundary> | null = null;
let loading: Promise<Record<string, StateBoundary>> | null = null;

export async function loadStateBoundaries(): Promise<Record<string, StateBoundary>> {
  if (cache) return cache;
  if (!loading) {
    loading = fetch("/data/geo/state-boundaries.json")
      .then((r) => r.json())
      .then((data: Record<string, StateBoundary>) => {
        cache = data;
        return data;
      });
  }
  return loading;
}

export function useStateBoundary(slug: string): StateBoundary | null {
  const [boundary, setBoundary] = useState<StateBoundary | null>(
    () => cache?.[slug] ?? null,
  );

  useEffect(() => {
    let alive = true;
    loadStateBoundaries().then((data) => {
      if (!alive) return;
      setBoundary(data[slug] ?? null);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  return boundary;
}

/** Fallback bbox from stop coordinates when GeoJSON missing. */
export function bboxFromStops(
  stops: { lat: number; lng: number }[],
): StateBoundary {
  const lats = stops.map((s) => s.lat);
  const lngs = stops.map((s) => s.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const padLat = (maxLat - minLat) * 0.25 || 0.3;
  const padLng = (maxLng - minLng) * 0.25 || 0.3;
  const bbox = {
    minLat: minLat - padLat,
    maxLat: maxLat + padLat,
    minLng: minLng - padLng,
    maxLng: maxLng + padLng,
  };
  return {
    bbox,
    ring: [
      [bbox.minLng, bbox.minLat],
      [bbox.maxLng, bbox.minLat],
      [bbox.maxLng, bbox.maxLat],
      [bbox.minLng, bbox.maxLat],
      [bbox.minLng, bbox.minLat],
    ],
  };
}
