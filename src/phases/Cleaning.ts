import type { GameState } from '../state/gameStore';
import type { InteractiveData } from '../types/game';
import type { PhaseServices } from './PhaseDirector';

export class CleaningPhase {
  private stuckPulls = 0;

  prompt(data: InteractiveData, state: GameState): string {
    if (data.type === 'compressor') return state.compressorRunning ? 'Compressor running' : '[E] Start compressor';
    if (data.type === 'negativeAirMachine') return 'Negative air machine pulling at trunk';
    if (data.type === 'register' && data.payload) {
      const selected = state.ducts.find((duct) => duct.id === state.selectedDuctId);
      const register = state.registers.find((candidate) => candidate.id === data.payload);
      if (!selected || !register?.removed) return '';
      if (selected.registerId !== register.id) return `Selected duct is ${selected.label}`;
      if (!selected.vacuumPlaced) return 'Place vacuum downstream in cross-section first';
      return selected.whipInserted ? 'Whip inserted; hold left-click to clean' : '[E] Insert whip upstream';
    }
    return '';
  }

  handle(data: InteractiveData, services: PhaseServices) {
    const store = services.store.getState();
    if (data.type === 'compressor') {
      if (!store.compressorHoseConnected) {
        store.pushMessage('Run the compressor hose during setup first.');
        return;
      }
      store.setCompressorRunning(true);
      store.pushMessage('Compressor on. Listen for steady pressure before agitation.');
      return;
    }
    if (data.type === 'register' && data.payload) {
      const selected = store.ducts.find((duct) => duct.id === store.selectedDuctId);
      const register = store.registers.find((candidate) => candidate.id === data.payload);
      if (!selected || !register?.removed) return;
      if (selected.registerId !== register.id) {
        store.pushMessage(`Select ${register.label}'s duct on the Tab map before inserting the whip.`);
        return;
      }
      if (!selected.vacuumPlaced) {
        store.pushMessage('Position the vacuum downstream in the cross-section inset first.');
        return;
      }
      store.insertWhip(selected.id);
      store.pushMessage(`Whip inserted upstream for ${selected.label}.`);
    }
  }

  update(services: PhaseServices) {
    const store = services.store.getState();
    const selected = store.ducts.find((duct) => duct.id === store.selectedDuctId);
    if (selected && selected.whipInserted && selected.vacuumPlaced && selected.debris < 58) {
      const problem = store.cleaningProblems.find(
        (candidate) => candidate.ductId === selected.id && !candidate.triggered && !candidate.resolved,
      );
      if (problem) {
        if (problem.type === 'compressorOff') store.setCompressorRunning(false);
        store.triggerProblem(problem.id);
        services.ui.openProblemModal(problem.id);
      }
    }

    if (store.ducts.every((duct) => duct.cleaned)) {
      store.setPhase('patching');
      store.setCompressorRunning(false);
      store.pushMessage('All ducts cleaned below 10 percent debris. Patch every trunk access hole.');
    }
  }

  onUseHeld(dt: number, services: PhaseServices) {
    const store = services.store.getState();
    if (store.activeProblemId) return;
    store.cleanSelectedDuct(dt * 24);
  }

  onSecondary(services: PhaseServices) {
    const store = services.store.getState();
    const problem = store.cleaningProblems.find((candidate) => candidate.id === store.activeProblemId);
    if (!problem || problem.type !== 'whipStuck') return;
    this.stuckPulls += 1;
    if (this.stuckPulls >= 3) {
      store.resolveProblem(problem.id);
      store.pushMessage('Whip freed with controlled pullback sequence.');
      this.stuckPulls = 0;
    } else {
      store.pushMessage(`Controlled pull ${this.stuckPulls}/3. Keep tension steady.`);
    }
  }
}
