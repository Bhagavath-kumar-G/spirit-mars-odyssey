// Reactive external state store for the "Build Your Own Rover" Workshop
// Follows React's useSyncExternalStore pattern for seamless 3D/UI synchronization
import { useSyncExternalStore } from "react";
import {
  BASELINE_SELECTIONS,
  calculateEngineeringBudget,
  EngineeringBudget,
  SolarScenario,
  SubsystemCategory,
} from "./rover-engineering";

export type BuilderTab = "configure" | "review";

export interface BuilderState {
  isOpen: boolean;
  activeCategory: SubsystemCategory;
  selected: Record<SubsystemCategory, string>;
  scenario: SolarScenario;
  activeTab: BuilderTab;
  // Interactive 3D workshop viewport controls
  turntableAngle: number;
  isAutoSpinning: boolean;
  zoomLevel: number;
}

const DEFAULT_STATE: BuilderState = {
  isOpen: false,
  activeCategory: "mobility",
  selected: { ...BASELINE_SELECTIONS },
  scenario: "clean_summer_perihelion",
  activeTab: "configure",
  turntableAngle: 0,
  isAutoSpinning: true,
  zoomLevel: 1.0,
};

let currentState: BuilderState = { ...DEFAULT_STATE };
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export const builderStore = {
  get(): BuilderState {
    return currentState;
  },

  set(partial: Partial<BuilderState>): void {
    currentState = { ...currentState, ...partial };
    emit();
  },

  setOpen(isOpen: boolean): void {
    currentState = {
      ...currentState,
      isOpen,
      activeTab: isOpen ? currentState.activeTab : "configure",
    };
    emit();
  },

  setActiveCategory(activeCategory: SubsystemCategory): void {
    currentState = { ...currentState, activeCategory };
    emit();
  },

  setActiveTab(activeTab: BuilderTab): void {
    currentState = { ...currentState, activeTab };
    emit();
  },

  setScenario(scenario: SolarScenario): void {
    currentState = { ...currentState, scenario };
    emit();
  },

  selectOption(category: SubsystemCategory, optionId: string): void {
    currentState = {
      ...currentState,
      selected: {
        ...currentState.selected,
        [category]: optionId,
      },
    };
    emit();
  },

  setTurntableAngle(turntableAngle: number): void {
    currentState = { ...currentState, turntableAngle };
    emit();
  },

  rotateTurntable(delta: number): void {
    currentState = {
      ...currentState,
      turntableAngle: (currentState.turntableAngle + delta) % (Math.PI * 2),
    };
    emit();
  },

  setAutoSpin(isAutoSpinning: boolean): void {
    currentState = { ...currentState, isAutoSpinning };
    emit();
  },

  toggleAutoSpin(): void {
    currentState = { ...currentState, isAutoSpinning: !currentState.isAutoSpinning };
    emit();
  },

  setZoomLevel(zoomLevel: number): void {
    const clamped = Math.max(0.65, Math.min(1.5, zoomLevel));
    currentState = { ...currentState, zoomLevel: clamped };
    emit();
  },

  zoomIn(): void {
    builderStore.setZoomLevel(currentState.zoomLevel - 0.15);
  },

  zoomOut(): void {
    builderStore.setZoomLevel(currentState.zoomLevel + 0.15);
  },

  resetView(): void {
    currentState = {
      ...currentState,
      turntableAngle: 0,
      zoomLevel: 1.0,
      isAutoSpinning: true,
    };
    emit();
  },

  resetToBaseline(): void {
    currentState = {
      ...currentState,
      selected: { ...BASELINE_SELECTIONS },
      scenario: "clean_summer_perihelion",
      activeTab: "configure",
      turntableAngle: 0,
      zoomLevel: 1.0,
      isAutoSpinning: true,
    };
    emit();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/**
 * Reactive React hook for the Rover Builder store.
 * Re-renders components when workshop selections, scenarios, viewport, or UI states change.
 */
export function useBuilder(): {
  state: BuilderState;
  budget: EngineeringBudget;
  setOpen: (isOpen: boolean) => void;
  setActiveCategory: (cat: SubsystemCategory) => void;
  setActiveTab: (tab: BuilderTab) => void;
  setScenario: (scenario: SolarScenario) => void;
  selectOption: (category: SubsystemCategory, optionId: string) => void;
  setTurntableAngle: (angle: number) => void;
  rotateTurntable: (delta: number) => void;
  setAutoSpin: (isSpinning: boolean) => void;
  toggleAutoSpin: () => void;
  setZoomLevel: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  resetToBaseline: () => void;
} {
  const state = useSyncExternalStore(
    builderStore.subscribe,
    builderStore.get,
    builderStore.get,
  );

  const budget = calculateEngineeringBudget(state.selected, state.scenario);

  return {
    state,
    budget,
    setOpen: builderStore.setOpen,
    setActiveCategory: builderStore.setActiveCategory,
    setActiveTab: builderStore.setActiveTab,
    setScenario: builderStore.setScenario,
    selectOption: builderStore.selectOption,
    setTurntableAngle: builderStore.setTurntableAngle,
    rotateTurntable: builderStore.rotateTurntable,
    setAutoSpin: builderStore.setAutoSpin,
    toggleAutoSpin: builderStore.toggleAutoSpin,
    setZoomLevel: builderStore.setZoomLevel,
    zoomIn: builderStore.zoomIn,
    zoomOut: builderStore.zoomOut,
    resetView: builderStore.resetView,
    resetToBaseline: builderStore.resetToBaseline,
  };
}
