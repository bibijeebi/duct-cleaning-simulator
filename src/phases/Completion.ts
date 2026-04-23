import type { GameState } from '../state/gameStore';
import type { InteractiveData } from '../types/game';
import type { PhaseServices } from './PhaseDirector';

export class CompletionPhase {
  prompt(data: InteractiveData, state: GameState): string {
    if (data.type === 'register' && data.payload) {
      const register = state.registers.find((candidate) => candidate.id === data.payload);
      if (!register) return '';
      if (register.reinstalled) return 'Register reinstalled';
      return '[E] Reinstall register';
    }
    if (data.type === 'van') {
      return state.walkthroughComplete ? '[E] Finish job and view scorecard' : 'Finish final walkthrough first';
    }
    return '';
  }

  handle(data: InteractiveData, services: PhaseServices) {
    const store = services.store.getState();
    if (data.type === 'register' && data.payload) {
      const register = store.registers.find((candidate) => candidate.id === data.payload);
      if (!register || register.reinstalled) return;
      store.reinstallRegister(register.id);
      store.pushMessage(`${register.label} reinstalled.`);
      return;
    }
    if (data.type === 'van') {
      if (!store.walkthroughComplete) {
        store.pushMessage('Every register must be back in place before the final scorecard.');
        return;
      }
      store.finalizeScorecard();
      store.setPhase('scorecard');
      services.ui.openScorecard();
    }
  }

  update(services: PhaseServices) {
    const store = services.store.getState();
    if (!store.walkthroughComplete && store.registers.every((register) => register.reinstalled)) {
      store.completeWalkthrough();
      store.pushMessage('Walkthrough clean. Return to the van for customer closeout.');
    }
  }
}
