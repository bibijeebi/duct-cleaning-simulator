import type { StoreApi } from 'zustand/vanilla';
import { Vector3 } from 'three';
import { playerSpawns } from '../data/scenario';
import type { GameStore } from '../state/gameStore';
import type { InteractiveData } from '../types/game';
import { PreJobPhase } from './PreJob';
import { AssessmentPhase } from './Assessment';
import { SetupPhase } from './Setup';
import { RegisterRemovalPhase } from './RegisterRemoval';
import { CleaningPhase } from './Cleaning';
import { PatchingPhase } from './Patching';
import { CompletionPhase } from './Completion';

export interface TimedAction {
  label: string;
  duration: number;
  elapsed: number;
  onDone: () => void;
}

export interface PhaseUi {
  showActionProgress(action: TimedAction | null): void;
  openRegisterModal(id: string): void;
  openPatchModal(id: string): void;
  openProblemModal(id: string): void;
  openScorecard(): void;
}

export interface PhaseServices {
  store: StoreApi<GameStore>;
  ui: PhaseUi;
  teleport: (position: Vector3, yaw?: number) => void;
}

export class PhaseDirector {
  private timedAction: TimedAction | null = null;
  private readonly preJob = new PreJobPhase();
  private readonly assessment = new AssessmentPhase();
  private readonly setup = new SetupPhase();
  private readonly removal = new RegisterRemovalPhase();
  private readonly cleaning = new CleaningPhase();
  private readonly patching = new PatchingPhase();
  private readonly completion = new CompletionPhase();

  constructor(private readonly services: PhaseServices) {}

  update(dt: number) {
    if (this.timedAction) {
      this.timedAction.elapsed += dt;
      this.services.ui.showActionProgress(this.timedAction);
      if (this.timedAction.elapsed >= this.timedAction.duration) {
        const done = this.timedAction.onDone;
        this.timedAction = null;
        this.services.ui.showActionProgress(null);
        done();
      }
    }

    const state = this.services.store.getState();
    if (state.phase === 'assessment') this.assessment.update(this.services);
    if (state.phase === 'setup') this.setup.update(this.services);
    if (state.phase === 'registerRemoval') this.removal.update(this.services);
    if (state.phase === 'cleaning') this.cleaning.update(this.services);
    if (state.phase === 'patching') this.patching.update(this.services);
    if (state.phase === 'completion') this.completion.update(this.services);
    if (state.phase === 'failed') {
      this.services.store.getState().finalizeScorecard();
      this.services.store.getState().setPhase('scorecard');
      this.services.ui.openScorecard();
    }
  }

  handleInteraction(data: InteractiveData) {
    if (this.timedAction) return;
    const state = this.services.store.getState();
    if (state.phase === 'prejob') this.preJob.handle(data, this.services);
    if (state.phase === 'assessment') this.assessment.handle(data, this.services);
    if (state.phase === 'setup') this.setup.handle(data, this.services, this.beginTimedAction);
    if (state.phase === 'registerRemoval') this.removal.handle(data, this.services);
    if (state.phase === 'cleaning') this.cleaning.handle(data, this.services);
    if (state.phase === 'patching') this.patching.handle(data, this.services);
    if (state.phase === 'completion') this.completion.handle(data, this.services);
  }

  getPrompt(data: InteractiveData): string {
    const state = this.services.store.getState();
    if (state.phase === 'prejob') return this.preJob.prompt(data);
    if (state.phase === 'assessment') return this.assessment.prompt(data, state);
    if (state.phase === 'setup') return this.setup.prompt(data, state);
    if (state.phase === 'registerRemoval') return this.removal.prompt(data, state);
    if (state.phase === 'cleaning') return this.cleaning.prompt(data, state);
    if (state.phase === 'patching') return this.patching.prompt(data, state);
    if (state.phase === 'completion') return this.completion.prompt(data, state);
    return '';
  }

  onUseHeld(dt: number) {
    if (this.services.store.getState().phase === 'cleaning') {
      this.cleaning.onUseHeld(dt, this.services);
    }
  }

  onSecondary() {
    if (this.services.store.getState().phase === 'cleaning') {
      this.cleaning.onSecondary(this.services);
    }
  }

  afterLoadoutStart() {
    this.services.teleport(new Vector3(playerSpawns.frontDoor.x, playerSpawns.frontDoor.y, playerSpawns.frontDoor.z), Math.PI);
  }

  private beginTimedAction = (label: string, duration: number, onDone: () => void) => {
    this.timedAction = { label, duration, elapsed: 0, onDone };
    this.services.ui.showActionProgress(this.timedAction);
  };
}
