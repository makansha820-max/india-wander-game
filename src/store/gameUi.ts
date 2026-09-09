import { create } from "zustand";
import type { TransportMode } from "../data/gameStates";
import type { WorldStop } from "../lib/geoToWorld";
import type { MovementMode } from "../game/Player";

interface GameUiState {
  movementMode: MovementMode;
  transport: TransportMode;
  nearStop: WorldStop | null;
  yaw: number;
  playerPos: [number, number, number];
  shooting: boolean;
  friendActive: boolean;
  friendPos: [number, number, number] | null;
  borderDanger: boolean;
  setHud: (
    data: Partial<
      Pick<
        GameUiState,
        | "movementMode"
        | "nearStop"
        | "yaw"
        | "transport"
        | "playerPos"
        | "shooting"
        | "friendActive"
        | "friendPos"
        | "borderDanger"
      >
    >,
  ) => void;
}

export const useGameUi = create<GameUiState>((set) => ({
  movementMode: "walk",
  transport: "walk",
  nearStop: null,
  yaw: 0,
  playerPos: [0, 1, 0],
  shooting: false,
  friendActive: false,
  friendPos: null,
  borderDanger: false,
  setHud: (data) => set(data),
}));
