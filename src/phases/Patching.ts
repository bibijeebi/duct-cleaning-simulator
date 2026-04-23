import type { GameState } from '../state/gameStore';
import type { InteractiveData } from '../types/game';
import type { PhaseServices } from './PhaseDirector';

export class PatchingPhase {
  prompt(data: InteractiveData, state: GameState): string {
    if (data.type === 'accessHole' && data.payload) {
      const hole = state.accessHoles.find((candidate) => candidate.id === data.payload);
      if (!hole) return '';
      if (hole.insulationWrapped && hole.fskTapeApplied) return 'Patch inspection-ready';
      return '[E] Patch and seal access hole';
    }
    if (data.type === 'filterSlot' || data.type === 'airHandler') {
      return state.filterReplaced ? 'Filter replaced' : '[E] Replace 20x20x2 filter';
    }
    return '';
  }

  handle(data: InteractiveData, services: PhaseServices) {
    const store = services.store.getState();
    if (data.type === 'accessHole' && data.payload) {
      store.setActivePatchHole(data.payload);
      services.ui.openPatchModal(data.payload);
      return;
    }
    if (data.type === 'filterSlot' || data.type === 'airHandler') {
      if (!store.selectedEquipment['filter']) {
        store.failJob('Critical equipment missing when needed: replacement filter', 30);
        return;
      }
      store.replaceFilter();
      store.pushMessage('20x20x2 filter replaced at AHU-1.');
    }
  }

  update(services: PhaseServices) {
    const store = services.store.getState();
    const holesDone = store.accessHoles.every(
      (hole) => hole.masticApplied && hole.patchPlaced && hole.screwsDriven >= 4 && hole.fskTapeApplied && hole.insulationWrapped,
    );
    if (holesDone && store.filterReplaced) {
      store.setPhase('completion');
      store.pushMessage('Patching complete. Final walkthrough: reinstall every register and return to the van.');
    }
  }
}
