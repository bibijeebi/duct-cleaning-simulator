import { createStore } from 'zustand/vanilla';
import { accessHoles, plasticRooms, registers, removableCeilingTiles } from '../data/scenario';
import { ductSegments } from '../data/ductNetwork';
import { equipmentById, equipmentCatalog, trapEquipmentIds } from '../data/equipment';
import { selectCleaningProblems } from '../systems/problems';
import type {
  AccessHoleState,
  CleaningProblem,
  DuctSegmentState,
  GamePhase,
  RegisterState,
  ScoreEvent,
} from '../types/game';

export type TechniqueMode = 'fullBrush' | 'gentleBrush' | 'airJet';

export interface GameState {
  phase: GamePhase;
  elapsedSeconds: number;
  startedAt: number;
  scoreEvents: ScoreEvent[];
  failed: boolean;
  failReason: string;
  selectedEquipment: Record<string, boolean>;
  currentToolId: string;
  heldTechnique: TechniqueMode;
  loadoutStarted: boolean;
  pauseOpen: boolean;
  inventoryOpen: boolean;
  loadoutOpen: boolean;
  activeRegisterModalId: string | null;
  activeProblemId: string | null;
  activePatchHoleId: string | null;
  selectedDuctId: string | null;
  registerRemovalCompleteBonusAwarded: boolean;
  orderPenaltyApplied: boolean;
  filterReplaced: boolean;
  negativeAirPositioned: boolean;
  compressorHoseConnected: boolean;
  compressorHosePulled: boolean;
  compressorRunning: boolean;
  firstCleaningStationReady: boolean;
  frontDoorUnlocked: boolean;
  airHandlerIdentified: boolean;
  trunkAccessPlanned: boolean;
  assessmentFirstPassBonusAwarded: boolean;
  plasticLaidRooms: Record<string, boolean>;
  ceilingTilesOpen: Record<string, boolean>;
  registers: RegisterState[];
  ducts: DuctSegmentState[];
  accessHoles: AccessHoleState[];
  cleaningProblems: CleaningProblem[];
  messages: string[];
  walkthroughComplete: boolean;
  finalScoreApplied: boolean;
}

export interface GameActions {
  resetGame: () => void;
  tick: (dt: number) => void;
  setPhase: (phase: GamePhase) => void;
  setPauseOpen: (open: boolean) => void;
  setInventoryOpen: (open: boolean) => void;
  setLoadoutOpen: (open: boolean) => void;
  setCurrentTool: (id: string) => void;
  setTechnique: (mode: TechniqueMode) => void;
  toggleEquipment: (id: string) => void;
  startLoadout: () => void;
  addScoreEvent: (label: string, points: number) => void;
  failJob: (reason: string, penalty?: number) => void;
  pushMessage: (message: string) => void;
  clearMessages: () => void;
  markCeilingTileOpen: (id: string, open: boolean) => void;
  identifyRegister: (id: string) => void;
  setAirHandlerIdentified: () => void;
  setTrunkPlanned: () => void;
  awardAssessmentFirstPassBonus: () => void;
  layPlastic: (roomId: string) => void;
  cutAccessHole: (id: string) => void;
  connectTube: (id: string) => void;
  positionNegativeAir: () => void;
  connectCompressorHose: () => void;
  pullCompressorHose: () => void;
  setCompressorRunning: (running: boolean) => void;
  openRegisterModal: (id: string | null) => void;
  updateRegister: (id: string, updater: (register: RegisterState) => RegisterState) => void;
  removeRegister: (id: string) => void;
  reinstallRegister: (id: string) => void;
  selectDuct: (id: string) => void;
  placeVacuum: (id: string) => void;
  insertWhip: (id: string) => void;
  cleanSelectedDuct: (amount: number) => void;
  triggerProblem: (id: string) => void;
  resolveProblem: (id: string) => void;
  setActiveProblem: (id: string | null) => void;
  updateAccessHole: (id: string, updater: (hole: AccessHoleState) => AccessHoleState) => void;
  setActivePatchHole: (id: string | null) => void;
  replaceFilter: () => void;
  completeWalkthrough: () => void;
  finalizeScorecard: () => void;
}

export type GameStore = GameState & GameActions;

const initialSelectedEquipment = Object.fromEntries(
  equipmentCatalog.map((item) => [item.id, item.defaultSelected]),
) as Record<string, boolean>;

const initialCeilingTiles = Object.fromEntries(
  removableCeilingTiles.map((tile) => [tile.id, false]),
) as Record<string, boolean>;

const initialPlasticRooms = Object.fromEntries(plasticRooms.map((roomId) => [roomId, false])) as Record<
  string,
  boolean
>;

function makeRegisters(): RegisterState[] {
  return registers.map((register) => ({
    ...register,
    identified: false,
    removed: false,
    reinstalled: false,
    screwsRemoved: 0,
    screwsDropped: 0,
    screwsRecovered: 0,
    paintScored: false,
    caulkScored: false,
    extractionUsed: false,
    gentleMode: false,
    damaged: false,
  }));
}

function makeDucts(): DuctSegmentState[] {
  return ductSegments.map((duct) => ({
    ...duct,
    cleaned: false,
    vacuumPlaced: false,
    whipInserted: false,
    collapsed: false,
    fiberReleased: false,
    wrongToolWarned: false,
  }));
}

function makeAccessHoles(): AccessHoleState[] {
  return accessHoles.map((hole) => ({
    ...hole,
    cut: false,
    tubingConnected: false,
    masticApplied: false,
    patchPlaced: false,
    screwsDriven: 0,
    fskTapeApplied: false,
    insulationWrapped: false,
    badTapeUsed: false,
    leakPenaltyApplied: false,
    perfectBonusApplied: false,
  }));
}

function makeInitialState(): GameState {
  const ducts = makeDucts();
  return {
    phase: 'prejob',
    elapsedSeconds: 0,
    startedAt: performance.now(),
    scoreEvents: [],
    failed: false,
    failReason: '',
    selectedEquipment: { ...initialSelectedEquipment },
    currentToolId: 'agitation-wand',
    heldTechnique: 'fullBrush',
    loadoutStarted: false,
    pauseOpen: false,
    inventoryOpen: false,
    loadoutOpen: false,
    activeRegisterModalId: null,
    activeProblemId: null,
    activePatchHoleId: null,
    selectedDuctId: ducts[0]?.id ?? null,
    registerRemovalCompleteBonusAwarded: false,
    orderPenaltyApplied: false,
    filterReplaced: false,
    negativeAirPositioned: false,
    compressorHoseConnected: false,
    compressorHosePulled: false,
    compressorRunning: false,
    firstCleaningStationReady: false,
    frontDoorUnlocked: false,
    airHandlerIdentified: false,
    trunkAccessPlanned: false,
    assessmentFirstPassBonusAwarded: false,
    plasticLaidRooms: { ...initialPlasticRooms },
    ceilingTilesOpen: { ...initialCeilingTiles },
    registers: makeRegisters(),
    ducts,
    accessHoles: makeAccessHoles(),
    cleaningProblems: selectCleaningProblems(ducts),
    messages: ['Click the scene, then press E on the rear van doors to open the loadout.'],
    walkthroughComplete: false,
    finalScoreApplied: false,
  };
}

function scoreEvent(label: string, points: number): ScoreEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label,
    points,
    createdAt: performance.now(),
  };
}

function hasEquipment(state: GameState, id: string): boolean {
  return Boolean(state.selectedEquipment[id]);
}

export const gameStore = createStore<GameStore>((set, get) => ({
  ...makeInitialState(),

  resetGame: () => {
    set(makeInitialState());
  },

  tick: (dt) => {
    const state = get();
    if (state.pauseOpen || state.phase === 'scorecard') return;
    set({ elapsedSeconds: state.elapsedSeconds + dt });
  },

  setPhase: (phase) => {
    set({ phase, messages: [] });
  },

  setPauseOpen: (pauseOpen) => set({ pauseOpen }),
  setInventoryOpen: (inventoryOpen) => set({ inventoryOpen }),
  setLoadoutOpen: (loadoutOpen) => set({ loadoutOpen }),

  setCurrentTool: (currentToolId) => {
    if (!equipmentById.has(currentToolId)) return;
    set({ currentToolId });
  },

  setTechnique: (heldTechnique) => set({ heldTechnique }),

  toggleEquipment: (id) => {
    if (!equipmentById.has(id)) return;
    set((state) => ({
      selectedEquipment: {
        ...state.selectedEquipment,
        [id]: !state.selectedEquipment[id],
      },
    }));
  },

  startLoadout: () => {
    const state = get();
    const scoreEvents: ScoreEvent[] = [];
    for (const trapId of trapEquipmentIds) {
      if (state.selectedEquipment[trapId]) {
        const item = equipmentById.get(trapId);
        scoreEvents.push(scoreEvent(`Trap item selected: ${item?.name ?? trapId}`, -10));
      }
    }
    for (const item of equipmentCatalog.filter((candidate) => candidate.category === 'minor')) {
      if (!state.selectedEquipment[item.id]) {
        scoreEvents.push(scoreEvent(`Minor item left behind: ${item.name}`, -5));
      }
    }
    set({
      loadoutStarted: true,
      loadoutOpen: false,
      phase: 'assessment',
      frontDoorUnlocked: true,
      scoreEvents: [...state.scoreEvents, ...scoreEvents],
      messages: ['Arrival assessment started. Find the air handler, count registers, and inspect trunk access.'],
    });
  },

  addScoreEvent: (label, points) => {
    set((state) => ({
      scoreEvents: [...state.scoreEvents, scoreEvent(label, points)],
    }));
  },

  failJob: (reason, penalty = 0) => {
    set((state) => ({
      failed: true,
      failReason: reason,
      scoreEvents: penalty ? [...state.scoreEvents, scoreEvent(reason, -Math.abs(penalty))] : state.scoreEvents,
      phase: 'failed',
      messages: [reason],
    }));
  },

  pushMessage: (message) => {
    set((state) => ({
      messages: [message, ...state.messages].slice(0, 4),
    }));
  },

  clearMessages: () => set({ messages: [] }),

  markCeilingTileOpen: (id, open) => {
    set((state) => ({
      ceilingTilesOpen: { ...state.ceilingTilesOpen, [id]: open },
    }));
  },

  identifyRegister: (id) => {
    set((state) => ({
      registers: state.registers.map((register) =>
        register.id === id ? { ...register, identified: true } : register,
      ),
    }));
  },

  setAirHandlerIdentified: () => {
    set((state) => ({
      airHandlerIdentified: true,
      messages: ['Split system confirmed at AHU-1.', ...state.messages].slice(0, 4),
    }));
  },

  setTrunkPlanned: () => {
    set((state) => ({
      trunkAccessPlanned: true,
      messages: ['Trunk access plan noted: two holes near hallway drop ceiling.', ...state.messages].slice(0, 4),
    }));
  },

  awardAssessmentFirstPassBonus: () => {
    const state = get();
    if (state.assessmentFirstPassBonusAwarded) return;
    set({
      assessmentFirstPassBonusAwarded: true,
      scoreEvents: [...state.scoreEvents, scoreEvent('All registers identified on first assessment pass', 5)],
    });
  },

  layPlastic: (roomId) => {
    set((state) => ({
      plasticLaidRooms: { ...state.plasticLaidRooms, [roomId]: true },
    }));
  },

  cutAccessHole: (id) => {
    set((state) => ({
      accessHoles: state.accessHoles.map((hole) => (hole.id === id ? { ...hole, cut: true } : hole)),
    }));
  },

  connectTube: (id) => {
    set((state) => ({
      accessHoles: state.accessHoles.map((hole) =>
        hole.id === id ? { ...hole, tubingConnected: true } : hole,
      ),
    }));
  },

  positionNegativeAir: () => {
    set({ negativeAirPositioned: true });
  },

  connectCompressorHose: () => {
    set({ compressorHoseConnected: true, firstCleaningStationReady: true });
  },

  pullCompressorHose: () => {
    set({ compressorHosePulled: true });
  },

  setCompressorRunning: (compressorRunning) => set({ compressorRunning }),

  openRegisterModal: (activeRegisterModalId) => set({ activeRegisterModalId }),

  updateRegister: (id, updater) => {
    set((state) => ({
      registers: state.registers.map((register) => (register.id === id ? updater(register) : register)),
    }));
  },

  removeRegister: (id) => {
    set((state) => ({
      registers: state.registers.map((register) =>
        register.id === id
          ? {
              ...register,
              removed: true,
              reinstalled: false,
            }
          : register,
      ),
      activeRegisterModalId: null,
    }));
  },

  reinstallRegister: (id) => {
    set((state) => ({
      registers: state.registers.map((register) =>
        register.id === id
          ? {
              ...register,
              reinstalled: true,
            }
          : register,
      ),
    }));
  },

  selectDuct: (id) => {
    if (!get().ducts.some((duct) => duct.id === id)) return;
    set({ selectedDuctId: id });
  },

  placeVacuum: (id) => {
    set((state) => ({
      ducts: state.ducts.map((duct) => (duct.id === id ? { ...duct, vacuumPlaced: true } : duct)),
    }));
  },

  insertWhip: (id) => {
    set((state) => ({
      ducts: state.ducts.map((duct) => (duct.id === id ? { ...duct, whipInserted: true } : duct)),
    }));
  },

  cleanSelectedDuct: (amount) => {
    const state = get();
    const id = state.selectedDuctId;
    if (!id || state.activeProblemId || !state.compressorRunning) return;
    const duct = state.ducts.find((candidate) => candidate.id === id);
    if (!duct || !duct.vacuumPlaced || !duct.whipInserted || duct.cleaned) return;

    if (!hasEquipment(state, 'agitation-wand')) {
      get().failJob('Critical tool missing: agitation wand', 30);
      return;
    }

    if (duct.kind === 'supply' && !state.orderPenaltyApplied) {
      const returnsClean = state.ducts.filter((candidate) => candidate.kind === 'return').every((candidate) => candidate.cleaned);
      if (!returnsClean) {
        set({
          orderPenaltyApplied: true,
          scoreEvents: [...state.scoreEvents, scoreEvent('Wrong cleaning order: supplies before returns', -15)],
          messages: ['Wrong order: returns first. Finish every return before supply branches.'],
        });
      }
    }

    const technique = state.heldTechnique;
    const updatedDucts = state.ducts.map((candidate) => {
      if (candidate.id !== id) return candidate;

      let next = { ...candidate };
      if (candidate.material === 'flex' && technique === 'fullBrush' && !candidate.collapsed) {
        next = { ...next, collapsed: true, wrongToolWarned: true };
      }
      if (candidate.material === 'ductboard' && technique !== 'airJet' && !candidate.fiberReleased) {
        next = { ...next, fiberReleased: true, wrongToolWarned: true };
      }

      const materialMultiplier =
        candidate.material === 'rigidMetal'
          ? technique === 'fullBrush'
            ? 1.25
            : 0.8
          : candidate.material === 'flex'
            ? technique === 'gentleBrush'
              ? 1
              : 0.35
            : technique === 'airJet'
              ? 1
              : 0.2;

      const nextDebris = Math.max(0, candidate.debris - amount * materialMultiplier);
      next.debris = nextDebris;
      next.cleaned = nextDebris <= 10;
      return next;
    });

    const scoreEvents = [...state.scoreEvents];
    const currentAfter = updatedDucts.find((candidate) => candidate.id === id);
    if (currentAfter?.collapsed && !duct.collapsed) {
      scoreEvents.push(scoreEvent('Aggressive brush collapsed flex duct', -25));
    }
    if (currentAfter?.fiberReleased && !duct.fiberReleased) {
      scoreEvents.push(scoreEvent('Contact wand used on ductboard', -20));
    }
    if (currentAfter?.wrongToolWarned && !duct.wrongToolWarned && currentAfter.material === 'rigidMetal' && technique === 'airJet') {
      scoreEvents.push(scoreEvent('Wrong tool for rigid metal duct', -10));
    }

    set({ ducts: updatedDucts, scoreEvents });
  },

  triggerProblem: (id) => {
    set((state) => ({
      cleaningProblems: state.cleaningProblems.map((problem) =>
        problem.id === id ? { ...problem, triggered: true } : problem,
      ),
      activeProblemId: id,
    }));
  },

  resolveProblem: (id) => {
    set((state) => ({
      cleaningProblems: state.cleaningProblems.map((problem) =>
        problem.id === id ? { ...problem, resolved: true, triggered: true } : problem,
      ),
      activeProblemId: null,
    }));
  },

  setActiveProblem: (activeProblemId) => set({ activeProblemId }),

  updateAccessHole: (id, updater) => {
    set((state) => ({
      accessHoles: state.accessHoles.map((hole) => (hole.id === id ? updater(hole) : hole)),
    }));
  },

  setActivePatchHole: (activePatchHoleId) => set({ activePatchHoleId }),

  replaceFilter: () => set({ filterReplaced: true }),

  completeWalkthrough: () => set({ walkthroughComplete: true }),

  finalizeScorecard: () => {
    const state = get();
    if (state.finalScoreApplied) return;
    const events = [...state.scoreEvents];

    for (const roomId of plasticRooms) {
      if (!state.plasticLaidRooms[roomId]) events.push(scoreEvent(`Forgot plastic sheeting in ${roomId}`, -10));
    }

    for (const register of state.registers) {
      if (!register.identified) events.push(scoreEvent(`Missed register during assessment: ${register.label}`, -5));
    }

    const missingScrews = state.registers.reduce(
      (total, register) => total + Math.max(0, register.screwsDropped - register.screwsRecovered),
      0,
    );
    if (missingScrews > 0) events.push(scoreEvent(`Missing screws at final walkthrough (${missingScrews})`, -5 * missingScrews));

    for (const hole of state.accessHoles) {
      if (hole.badTapeUsed) events.push(scoreEvent(`Bad patch: duct tape used at ${hole.label}`, -10));
      if (!hole.masticApplied) events.push(scoreEvent(`Bad patch: no mastic at ${hole.label}`, -10));
      if (hole.screwsDriven < 4) events.push(scoreEvent(`Bad patch: fewer than 4 screws at ${hole.label}`, -5));
      if (hole.masticApplied && hole.patchPlaced && hole.screwsDriven >= 4 && hole.fskTapeApplied && hole.insulationWrapped && !hole.badTapeUsed) {
        events.push(scoreEvent(`Perfect patch: ${hole.label}`, 5));
      }
    }

    if (!state.filterReplaced) events.push(scoreEvent("Didn't replace filter", -10));
    if (state.elapsedSeconds <= 18 * 60) events.push(scoreEvent('Under par time: 18 minutes', 10));
    const finalClean =
      state.registers.every((register) => register.reinstalled) &&
      state.accessHoles.every(
        (hole) => hole.masticApplied && hole.patchPlaced && hole.screwsDriven >= 4 && hole.fskTapeApplied && !hole.badTapeUsed,
      ) &&
      state.filterReplaced &&
      !state.failed;
    if (finalClean) events.push(scoreEvent('Clean final walkthrough', 5));

    set({ finalScoreApplied: true, scoreEvents: events });
  },
}));

export function currentScore(state: GameState): number {
  return state.scoreEvents.reduce((score, event) => score + event.points, 100);
}

export function selectedToolName(state: GameState): string {
  return equipmentById.get(state.currentToolId)?.shortName ?? 'Hands';
}

export function hasSelectedEquipment(state: GameState, id: string): boolean {
  return Boolean(state.selectedEquipment[id]);
}
