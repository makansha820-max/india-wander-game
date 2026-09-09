import type { GameStop } from "../data/gameStates";

export const TERRAIN_WIDTH = 22;
export const TERRAIN_DEPTH = 16;

export interface GeoBBox {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

export interface StateBoundary {
  ring: [number, number][]; // [lng, lat]
  bbox: GeoBBox;
}

export interface WorldStop extends GameStop {
  position: [number, number, number];
}

export function projectLngLat(
  lng: number,
  lat: number,
  bbox: GeoBBox,
  pad = 0.08,
): [number, number] {
  const w = bbox.maxLng - bbox.minLng || 1;
  const h = bbox.maxLat - bbox.minLat || 1;
  const nx = (lng - bbox.minLng) / w;
  const nz = (lat - bbox.minLat) / h;
  // Keep content inside with padding so edges aren't flush
  const x = ((nx * (1 - pad * 2) + pad) - 0.5) * TERRAIN_WIDTH;
  const z = ((nz * (1 - pad * 2) + pad) - 0.5) * TERRAIN_DEPTH;
  return [x, z];
}

export function projectRingToWorld(ring: [number, number][], bbox: GeoBBox): [number, number][] {
  return ring.map(([lng, lat]) => projectLngLat(lng, lat, bbox, 0));
}

/** Nudge a lng/lat that sits just outside the state outline back inside. */
export function clampLngLatInsideRing(
  lng: number,
  lat: number,
  ring: [number, number][],
): [number, number] {
  if (ring.length < 3 || pointInPolygonLngLat(lng, lat, ring)) return [lng, lat];

  let cx = 0;
  let cy = 0;
  for (const [x, y] of ring) {
    cx += x;
    cy += y;
  }
  cx /= ring.length;
  cy /= ring.length;

  let best: [number, number] = [cx, cy];
  for (let t = 0.02; t <= 1; t += 0.02) {
    const x = lng + (cx - lng) * t;
    const y = lat + (cy - lat) * t;
    if (pointInPolygonLngLat(x, y, ring)) {
      best = [x, y];
      break;
    }
  }
  return best;
}

function pointInPolygonLngLat(lng: number, lat: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function stopsToWorldPositions(
  stops: GameStop[],
  bbox: GeoBBox,
  ring?: [number, number][],
): WorldStop[] {
  return stops.map((stop) => {
    const [lng, lat] = ring
      ? clampLngLatInsideRing(stop.lng, stop.lat, ring)
      : [stop.lng, stop.lat];
    const [x, z] = projectLngLat(lng, lat, bbox);
    const y = 0.9 + stop.height * 0.35;
    return { ...stop, position: [x, y, z] };
  });
}

/** Ray-cast point-in-polygon on XZ plane. polygon is [x,z][]. */
export function pointInPolygon(x: number, z: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const zi = polygon[i][1];
    const xj = polygon[j][0];
    const zj = polygon[j][1];
    const intersect =
      zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Approximate distance from point to polygon edge on XZ (world units). */
export function distanceToPolygonEdge(
  x: number,
  z: number,
  polygon: [number, number][],
): number {
  if (polygon.length < 2) return Infinity;
  let min = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const [ax, az] = polygon[i];
    const [bx, bz] = polygon[(i + 1) % polygon.length];
    const dx = bx - ax;
    const dz = bz - az;
    const len2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
    const px = ax + t * dx;
    const pz = az + t * dz;
    const d = Math.hypot(x - px, z - pz);
    if (d < min) min = d;
  }
  return min;
}

/** Centroid of a world XZ polygon. */
export function polygonCentroid(polygon: [number, number][]): [number, number] {
  let cx = 0;
  let cz = 0;
  for (const [x, z] of polygon) {
    cx += x;
    cz += z;
  }
  const n = Math.max(1, polygon.length);
  return [cx / n, cz / n];
}

export function isInWaterZone(
  x: number,
  z: number,
  zones: { x: number; z: number; width: number; depth: number }[],
): boolean {
  return zones.some(
    (zone) =>
      x >= zone.x - zone.width / 2 &&
      x <= zone.x + zone.width / 2 &&
      z >= zone.z - zone.depth / 2 &&
      z <= zone.z + zone.depth / 2,
  );
}
