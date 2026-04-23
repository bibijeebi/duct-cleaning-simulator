import type { PhaseServices } from './PhaseDirector';
import type { InteractiveData } from '../types/game';

export class PreJobPhase {
  prompt(data: InteractiveData): string {
    if (data.type === 'van') return '[E] Open loadout at van doors';
    if (data.type === 'frontDoor') return 'Finish van loadout before entering the job';
    return '';
  }

  handle(data: InteractiveData, services: PhaseServices) {
    const store = services.store.getState();
    if (data.type === 'van') {
      store.setLoadoutOpen(true);
      // Release pointer lock so the user can click the loadout UI
      if (document.pointerLockElement) document.exitPointerLock();
      return;
    }
    if (data.type === 'frontDoor') {
      store.pushMessage('Start at the van. Load the right equipment before entering.');
    }
  }
}
