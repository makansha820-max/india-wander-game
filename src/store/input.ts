import { create } from "zustand";
import type { InputKey } from "./inputKeys";

export type { InputKey } from "./inputKeys";

interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  run: boolean;
  interact: boolean;
  shoot: boolean;
  callFriend: boolean;
  transportCycle: boolean;
  touchX: number;
  touchY: number;
  setKey: (key: InputKey, value: boolean) => void;
  setTouch: (x: number, y: number) => void;
  resetTouch: () => void;
  /** Clear stuck keys / joystick (scene changes, blur, complete). */
  resetAll: () => void;
}

const IDLE = {
  forward: false,
  back: false,
  left: false,
  right: false,
  jump: false,
  run: false,
  interact: false,
  shoot: false,
  callFriend: false,
  transportCycle: false,
  touchX: 0,
  touchY: 0,
} as const;

export const useInput = create<InputState>((set) => ({
  ...IDLE,
  setKey: (key, value) => set({ [key]: value }),
  setTouch: (x, y) => set({ touchX: x, touchY: y }),
  resetTouch: () => set({ touchX: 0, touchY: 0 }),
  resetAll: () => set({ ...IDLE }),
}));
