import type { GameState } from '../state/gameStore';
import type { InteractiveData } from '../types/game';
import type { PhaseServices } from './PhaseDirector';

export class RegisterRemovalPhase {
  prompt(data: InteractiveData, state: GameState): string {
    if (data.type !== 'register' || !data.payload) return '';
    const register = state.registers.find((candidate) => candidate.id === data.payload);
    if (!register) return '';
    if (register.removed) return 'Register removed; opening exposed';
    return '[E] Close-up register removal';
  }

  handle(data: InteractiveData, services: PhaseServices) {
    if (data.type !== 'register' || !data.payload) return;
    const store = services.store.getState();
    const register = store.registers.find((candidate) => candidate.id === data.payload);
    if (!register || register.removed) return;
    store.openRegisterModal(register.id);
    services.ui.openRegisterModal(register.id);
  }

  update(services: PhaseServices) {
    const store = services.store.getState();
    if (store.registers.every((register) => register.removed)) {
      store.setPhase('cleaning');
      const firstReturn = store.ducts.find((duct) => duct.kind === 'return');
      if (firstReturn) store.selectDuct(firstReturn.id);
      store.pushMessage('All registers removed. Clean returns before supplies.');
    }
  }
}
