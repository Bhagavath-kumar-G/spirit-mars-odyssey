// Reactive external state store for the "Build Your Own Rover" Workshop
// Follows React's useSyncExternalStore pattern for seamless 3D/UI synchronization
import { useSyncExternalStore } from "react";
import {
  evaluateMission,
  MissionEvaluationResult,
} from "./mission-evaluation";
import {
  MissionId,
  MISSION_SCENARIOS,
} from "./mission-scenarios";
import {
  BASELINE_SELECTIONS,
  calculateEngineeringBudget,
  EngineeringBudget,
  SolarScenario,
  SubsystemCategory,
} from "./rover-engineering";

export type BuilderTab = "configure" | "review";
export type GameMode = "sandbox" | "challenge";

export const CHALLENGE_STEPS: SubsystemCategory[] = [
  "mobility",
  "power",
  "science",
  "telecom",
];

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

  // Stage 3.3-B Challenge Gameplay State
  gameMode: GameMode;
  activeMissionId: MissionId;
  challengeStep: number; // 0 to 3 index into CHALLENGE_STEPS
  completedObjectives: Record<SubsystemCategory, boolean>;
  isBriefingOpen: boolean;

  // Stage 3.3-C Flight Readiness Review & Mission Debrief
  isReviewOpen: boolean;
  reviewTab: "readiness" | "debrief" | "historical";
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

  // Challenge defaults
  gameMode: "sandbox",
  activeMissionId: "traverse_alpine",
  challengeStep: 0,
  completedObjectives: {
    mobility: false,
    power: false,
    science: false,
    telecom: false,
  },
  isBriefingOpen: false,
  isReviewOpen: false,
  reviewTab: "readiness",
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
    const updatedSelected = {
      ...currentState.selected,
      [category]: optionId,
    };

    // If in challenge mode, automatically mark objective as completed
    const updatedCompleted = currentState.gameMode === "challenge"
      ? { ...currentState.completedObjectives, [category]: true }
      : currentState.completedObjectives;

    currentState = {
      ...currentState,
      selected: updatedSelected,
      completedObjectives: updatedCompleted,
    };
    emit();
  },

  // -------------------------------------------------------------
  // Challenge Mode State Actions (Stage 3.3-B)
  // -------------------------------------------------------------
  setGameMode(gameMode: GameMode): void {
    if (gameMode === currentState.gameMode) return;

    if (gameMode === "challenge") {
      // Sync scenario to active mission environment
      const scen = MISSION_SCENARIOS[currentState.activeMissionId] ?? MISSION_SCENARIOS.traverse_alpine;
      currentState = {
        ...currentState,
        gameMode: "challenge",
        scenario: scen.environment.solarScenario,
        activeCategory: CHALLENGE_STEPS[currentState.challengeStep] ?? "mobility",
      };
    } else {
      currentState = {
        ...currentState,
        gameMode: "sandbox",
      };
    }
    emit();
  },

  setActiveMission(activeMissionId: MissionId): void {
    const scen = MISSION_SCENARIOS[activeMissionId] ?? MISSION_SCENARIOS.traverse_alpine;
    currentState = {
      ...currentState,
      activeMissionId,
      scenario: scen.environment.solarScenario,
    };
    emit();
  },

  startChallenge(missionId?: MissionId): void {
    const targetMission = missionId ?? currentState.activeMissionId;
    const scen = MISSION_SCENARIOS[targetMission] ?? MISSION_SCENARIOS.traverse_alpine;

    currentState = {
      ...currentState,
      gameMode: "challenge",
      activeMissionId: targetMission,
      scenario: scen.environment.solarScenario,
      challengeStep: 0,
      activeCategory: "mobility",
      completedObjectives: {
        mobility: false,
        power: false,
        science: false,
        telecom: false,
      },
      isBriefingOpen: false,
      isReviewOpen: false,
      reviewTab: "readiness",
    };
    emit();
  },

  setBriefingOpen(isBriefingOpen: boolean): void {
    currentState = { ...currentState, isBriefingOpen };
    emit();
  },

  setReviewOpen(isReviewOpen: boolean): void {
    currentState = { ...currentState, isReviewOpen };
    emit();
  },

  setReviewTab(reviewTab: "readiness" | "debrief" | "historical"): void {
    currentState = { ...currentState, reviewTab };
    emit();
  },

  setChallengeStep(stepIndex: number): void {
    const clamped = Math.max(0, Math.min(CHALLENGE_STEPS.length - 1, stepIndex));
    const cat = CHALLENGE_STEPS[clamped] ?? "mobility";
    currentState = {
      ...currentState,
      challengeStep: clamped,
      activeCategory: cat,
    };
    emit();
  },

  nextChallengeStep(): void {
    if (currentState.challengeStep < CHALLENGE_STEPS.length - 1) {
      builderStore.setChallengeStep(currentState.challengeStep + 1);
    }
  },

  prevChallengeStep(): void {
    if (currentState.challengeStep > 0) {
      builderStore.setChallengeStep(currentState.challengeStep - 1);
    }
  },

  resetChallenge(): void {
    currentState = {
      ...currentState,
      challengeStep: 0,
      activeCategory: "mobility",
      selected: { ...BASELINE_SELECTIONS },
      completedObjectives: {
        mobility: false,
        power: false,
        science: false,
        telecom: false,
      },
      isReviewOpen: false,
    };
    emit();
  },

  // -------------------------------------------------------------
  // Viewport Controls
  // -------------------------------------------------------------
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
      gameMode: "sandbox",
      challengeStep: 0,
      completedObjectives: {
        mobility: false,
        power: false,
        science: false,
        telecom: false,
      },
      isBriefingOpen: false,
      isReviewOpen: false,
      reviewTab: "readiness",
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
 * Re-renders components when workshop selections, scenarios, viewport, or challenge states change.
 */
export function useBuilder(): {
  state: BuilderState;
  budget: EngineeringBudget;
  evaluation: MissionEvaluationResult;
  completedCount: number;
  progressPercent: number;
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
  // Challenge & Review Actions
  setGameMode: (mode: GameMode) => void;
  setActiveMission: (id: MissionId) => void;
  startChallenge: (missionId?: MissionId) => void;
  setBriefingOpen: (isOpen: boolean) => void;
  setReviewOpen: (isOpen: boolean) => void;
  setReviewTab: (tab: "readiness" | "debrief" | "historical") => void;
  setChallengeStep: (stepIndex: number) => void;
  nextChallengeStep: () => void;
  prevChallengeStep: () => void;
  resetChallenge: () => void;
} {
  const state = useSyncExternalStore(
    builderStore.subscribe,
    builderStore.get,
    builderStore.get,
  );

  const budget = calculateEngineeringBudget(state.selected, state.scenario);
  const evaluation = evaluateMission(state.activeMissionId, state.selected);

  const completedCount = Object.values(state.completedObjectives).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / CHALLENGE_STEPS.length) * 100);

  return {
    state,
    budget,
    evaluation,
    completedCount,
    progressPercent,
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

    setGameMode: builderStore.setGameMode,
    setActiveMission: builderStore.setActiveMission,
    startChallenge: builderStore.startChallenge,
    setBriefingOpen: builderStore.setBriefingOpen,
    setReviewOpen: builderStore.setReviewOpen,
    setReviewTab: builderStore.setReviewTab,
    setChallengeStep: builderStore.setChallengeStep,
    nextChallengeStep: builderStore.nextChallengeStep,
    prevChallengeStep: builderStore.prevChallengeStep,
    resetChallenge: builderStore.resetChallenge,
  };
}
