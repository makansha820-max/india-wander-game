export const TRANSPORT_COSTS: Record<string, number> = {
  car: 8,
  cruise: 10,
  flight: 15,
  parachute: 12,
};

/** Coins to buy the next locked state (adjacent). Skip-ahead costs 2×. */
export const STATE_UNLOCK_COST = 3;

/** Bail / friend rescue cost when wanted by cops. */
export const FRIEND_RESCUE_COST = 5;

/** Wanted rises when player misbehaves. */
export const WANTED = {
  shootNearCop: 2,
  speedInCar: 1,
  max: 5,
} as const;
