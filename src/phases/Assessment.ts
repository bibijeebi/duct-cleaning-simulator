import type { GameState } from '../state/gameStore';
import type { InteractiveData } from '../types/game';
import type { PhaseServices } from './PhaseDirector';

export class AssessmentPhase {
  prompt(data: InteractiveData, state: GameState): string {
    if (data.type === 'frontDoor') return '[E] Enter office suite';
    if (data.type === 'ceilingTile') return `[E] ${state.ceilingTilesOpen[data.payload ?? ''] ? 'Replace' : 'Remove'} ceiling tile`;
    if (data.type === 'register') {
      const register = state.registers.find((candidate) => candidate.id === data.payload);
      if (!register) return '';
      return register.identified ? `${register.kind.toUpperCase()} identified` : `[E] Identify ${register.kind} register`;
    }
    if (data.type === 'airHandler') return state.airHandlerIdentified ? 'Split system confirmed' : '[E] Identify system type at air handler';
    if (data.type === 'trunk' || data.type === 'accessHole') return '[E] Plan trunk access points';
    return '';
  }

  handle(data: InteractiveData, services: PhaseServices) {
    const store = services.store.getState();
    if (data.type === 'frontDoor') {
      store.pushMessage('Office entered. Ceiling grid and registers are ready for assessment.');
      return;
    }
    if (data.type === 'ceilingTile' && data.payload) {
      const open = store.ceilingTilesOpen[data.payload];
      store.markCeilingTileOpen(data.payload, !open);
      store.pushMessage(open ? 'Ceiling tile replaced.' : 'Ceiling tile removed. Trunk and branches are visible.');
      return;
    }
    if (data.type === 'register' && data.payload) {
      const register = store.registers.find((candidate) => candidate.id === data.payload);
      if (!register || register.identified) return;
      store.identifyRegister(data.payload);
      store.pushMessage(`${register.kind === 'supply' ? 'Supply' : 'Return'} identified: ${register.label}.`);
      return;
    }
    if (data.type === 'airHandler') {
      store.setAirHandlerIdentified();
      return;
    }
    if (data.type === 'trunk' || data.type === 'accessHole') {
      const hasOpenTile = Object.values(store.ceilingTilesOpen).some(Boolean);
      if (!hasOpenTile) {
        store.pushMessage('Remove a nearby ceiling tile first so the trunk access plan is visible.');
        return;
      }
      store.setTrunkPlanned();
    }
  }

  update(services: PhaseServices) {
    const store = services.store.getState();
    const supplyCount = store.registers.filter((register) => register.kind === 'supply' && register.identified).length;
    const returnCount = store.registers.filter((register) => register.kind === 'return' && register.identified).length;
    const complete =
      supplyCount === 8 && returnCount === 3 && store.airHandlerIdentified && store.trunkAccessPlanned;
    if (complete) {
      store.awardAssessmentFirstPassBonus();
      store.setPhase('setup');
      store.pushMessage('Assessment complete. Setup containment, trunk access, negative air, and compressor hose.');
    }
  }
}
