import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GAME_STATES, STATE_ORDER, type TransportMode } from "../data/gameStates";
import {
  FRIEND_RESCUE_COST,
  STATE_UNLOCK_COST,
  TRANSPORT_COSTS,
  WANTED,
} from "../data/economy";

interface ProgressState {
  totalCoins: number;
  unlockedStates: string[];
  unlockedTransports: TransportMode[];
  collectedStops: Record<string, string[]>;
  collectedTrails: Record<string, string[]>;
  completedStates: string[];
  wantedLevel: number;
  friendName: string;
  toast: string | null;

  collectStop: (stateSlug: string, stopId: string, coinValue?: number) => void;
  collectTrail: (stateSlug: string, trailId: string, coinValue?: number) => void;
  addCoins: (n: number) => void;
  spendCoins: (n: number) => boolean;
  completeState: (stateSlug: string, bonusCoins: number) => void;
  buyStateUnlock: (stateSlug: string) => { ok: boolean; message: string };
  buyTransport: (mode: TransportMode) => { ok: boolean; message: string };
  raiseWanted: (amount: number, reason: string) => void;
  clearWanted: () => void;
  callFriend: () => { ok: boolean; message: string };
  resetStateRun: (stateSlug: string) => void;
  setToast: (msg: string | null) => void;
  isStopCollected: (stateSlug: string, stopId: string) => boolean;
  isStateUnlocked: (stateSlug: string) => boolean;
  isStateComplete: (stateSlug: string) => boolean;
  hasTransport: (mode: TransportMode) => boolean;
  reset: () => void;
}

const INITIAL_UNLOCKED = [STATE_ORDER[0] ?? "delhi"];
const INITIAL_TRANSPORTS: TransportMode[] = ["walk"];

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      totalCoins: 0,
      unlockedStates: INITIAL_UNLOCKED,
      unlockedTransports: INITIAL_TRANSPORTS,
      collectedStops: {},
      collectedTrails: {},
      completedStates: [],
      wantedLevel: 0,
      friendName: "Arjun",
      toast: null,

      setToast: (msg) => set({ toast: msg }),

      addCoins: (n) => set({ totalCoins: get().totalCoins + n }),

      spendCoins: (n) => {
        if (get().totalCoins < n) return false;
        set({ totalCoins: get().totalCoins - n });
        return true;
      },

      collectStop: (stateSlug, stopId, coinValue = 1) => {
        const current = get().collectedStops[stateSlug] ?? [];
        if (current.includes(stopId)) return;
        set({
          collectedStops: {
            ...get().collectedStops,
            [stateSlug]: [...current, stopId],
          },
          totalCoins: get().totalCoins + coinValue,
        });
      },

      collectTrail: (stateSlug, trailId, coinValue = 1) => {
        const current = get().collectedTrails[stateSlug] ?? [];
        if (current.includes(trailId)) return;
        set({
          collectedTrails: {
            ...get().collectedTrails,
            [stateSlug]: [...current, trailId],
          },
          totalCoins: get().totalCoins + coinValue,
        });
      },

      completeState: (stateSlug, bonusCoins) => {
        if (get().completedStates.includes(stateSlug)) return;
        const nextIdx = STATE_ORDER.indexOf(stateSlug) + 1;
        const nextSlug = STATE_ORDER[nextIdx];
        const nextName = GAME_STATES.find((s) => s.slug === nextSlug)?.name;
        const unlocked = new Set(get().unlockedStates);
        // Completing unlocks the next state for free
        if (nextSlug) unlocked.add(nextSlug);
        set({
          completedStates: [...get().completedStates, stateSlug],
          totalCoins: get().totalCoins + bonusCoins,
          unlockedStates: [...unlocked],
          toast: nextName
            ? `+${bonusCoins} bonus · ${nextName} unlocked free!`
            : `+${bonusCoins} bonus · passport stamped`,
        });
      },

      buyStateUnlock: (stateSlug) => {
        if (get().unlockedStates.includes(stateSlug)) {
          return { ok: false, message: "Already unlocked." };
        }
        const idx = STATE_ORDER.indexOf(stateSlug);
        if (idx <= 0) return { ok: false, message: "Starting state is free." };

        const prev = STATE_ORDER[idx - 1];
        const prevName = GAME_STATES.find((s) => s.slug === prev)?.name ?? prev;
        const prevComplete = get().completedStates.includes(prev);
        const prevUnlocked = get().unlockedStates.includes(prev);

        // Already finished previous → should already be free-unlocked; grant if missing
        if (prevComplete) {
          set({
            unlockedStates: [...get().unlockedStates, stateSlug],
            toast: `${prevName} complete — travel opened free!`,
          });
          return { ok: true, message: "Unlocked free (previous state complete)." };
        }

        // Adjacent (previous unlocked) vs skip-ahead
        const adjacent = prevUnlocked;
        const cost = adjacent ? STATE_UNLOCK_COST : STATE_UNLOCK_COST * 2;
        const have = get().totalCoins;
        if (have < cost) {
          const tip = adjacent
            ? `Need ${cost}🪙 (you have ${have}). Collect Delhi stamps, or finish all spots in ${prevName} for a free unlock.`
            : `Need ${cost}🪙 to skip ahead (you have ${have}). Unlock ${prevName} first for a cheaper pass.`;
          set({ toast: tip });
          return { ok: false, message: tip };
        }
        set({
          totalCoins: have - cost,
          unlockedStates: [...get().unlockedStates, stateSlug],
          toast: `Paid ${cost} coins — ${stateSlug} travel unlocked!`,
        });
        return { ok: true, message: `Unlocked for ${cost} coins.` };
      },

      buyTransport: (mode) => {
        if (mode === "walk") return { ok: true, message: "Walk is free." };
        if (get().unlockedTransports.includes(mode)) {
          return { ok: false, message: "Already owned." };
        }
        const cost = TRANSPORT_COSTS[mode] ?? 10;
        if (get().totalCoins < cost) {
          return { ok: false, message: `Need ${cost} coins for ${mode}.` };
        }
        set({
          totalCoins: get().totalCoins - cost,
          unlockedTransports: [...get().unlockedTransports, mode],
          toast: `${mode.toUpperCase()} unlocked (−${cost} coins)`,
        });
        return { ok: true, message: `Bought ${mode}.` };
      },

      raiseWanted: (amount, reason) => {
        const next = Math.min(WANTED.max, get().wantedLevel + amount);
        set({
          wantedLevel: next,
          toast: `⚠️ Cops alert: ${reason} (wanted ${next}/${WANTED.max})`,
        });
      },

      clearWanted: () => set({ wantedLevel: 0 }),

      callFriend: () => {
        if (get().wantedLevel <= 0) {
          return { ok: false, message: "You're not in trouble — no need to call." };
        }
        const cost = FRIEND_RESCUE_COST * get().wantedLevel;
        if (get().totalCoins < cost) {
          return {
            ok: false,
            message: `${get().friendName} needs ${cost} coins for bail/fuel.`,
          };
        }
        const name = get().friendName;
        set({
          totalCoins: get().totalCoins - cost,
          wantedLevel: 0,
          toast: `${name} arrived! Cleared the cops (−${cost} coins).`,
        });
        return { ok: true, message: `${name} rescued you.` };
      },

      resetStateRun: (stateSlug) => {
        const collected = { ...get().collectedStops };
        const trails = { ...get().collectedTrails };
        delete collected[stateSlug];
        delete trails[stateSlug];
        set({
          collectedStops: collected,
          collectedTrails: trails,
          completedStates: get().completedStates.filter((s) => s !== stateSlug),
          toast: "Out of state boundary! Restarting this state…",
        });
      },

      isStopCollected: (stateSlug, stopId) =>
        (get().collectedStops[stateSlug] ?? []).includes(stopId),

      isStateUnlocked: (stateSlug) => get().unlockedStates.includes(stateSlug),

      isStateComplete: (stateSlug) => get().completedStates.includes(stateSlug),

      hasTransport: (mode) => get().unlockedTransports.includes(mode),

      reset: () =>
        set({
          totalCoins: 0,
          unlockedStates: INITIAL_UNLOCKED,
          unlockedTransports: INITIAL_TRANSPORTS,
          collectedStops: {},
          collectedTrails: {},
          completedStates: [],
          wantedLevel: 0,
          toast: null,
        }),
    }),
    { name: "india-wander-progress-v3" },
  ),
);

export function stateProgress(stateSlug: string) {
  const state = GAME_STATES.find((s) => s.slug === stateSlug);
  if (!state) return { collected: 0, total: 0 };
  const collected = useProgress.getState().collectedStops[stateSlug]?.length ?? 0;
  return { collected, total: state.stops.length };
}
