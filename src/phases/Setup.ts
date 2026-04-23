import type { GameState, GameStore } from '../state/gameStore';
import { hasSelectedEquipment } from '../state/gameStore';
import type { InteractiveData } from '../types/game';
import type { PhaseServices } from './PhaseDirector';

type BeginTimedAction = (label: string, duration: number, onDone: () => void) => void;

export class SetupPhase {
  prompt(data: InteractiveData, state: GameState): string {
    if (data.type === 'floorZone' && data.payload) {
      return state.plasticLaidRooms[data.payload] ? 'Plastic sheeting placed' : '[E] Lay plastic sheeting';
    }
    if (data.type === 'accessHole' && data.payload) {
      const hole = state.accessHoles.find((candidate) => candidate.id === data.payload);
      if (!hole) return '';
      if (!hole.cut) return '[E] Cut trunk access hole with hole saw';
      if (!hole.tubingConnected) return '[E] Connect 8 in flex tubing';
      return 'Access hole connected';
    }
    if (data.type === 'negativeAirMarker') return state.negativeAirPositioned ? 'Negative air machine positioned' : '[E] Position negative air machine';
    if (data.type === 'van') return state.compressorHosePulled ? 'Compressor hose pulled' : '[E] Pull compressor hose from van';
    if (data.type === 'cleaningStation') return state.compressorHoseConnected ? 'Compressor hose connected' : '[E] Connect compressor hose to first station';
    return '';
  }

  handle(data: InteractiveData, services: PhaseServices, beginTimedAction: BeginTimedAction) {
    const store = services.store.getState();
    if (data.type === 'floorZone' && data.payload) {
      if (!requireTool(store, 'plastic-sheeting', 'plastic sheeting roll')) return;
      store.layPlastic(data.payload);
      store.pushMessage('Plastic sheeting laid around the register work zone.');
      return;
    }
    if (data.type === 'negativeAirMarker') {
      if (!requireTool(store, 'negative-air-machine', 'negative air machine')) return;
      store.positionNegativeAir();
      store.pushMessage('Negative air machine staged in the mechanical room.');
      return;
    }
    if (data.type === 'van') {
      if (!requireTool(store, 'compressor-hose', 'air compressor hose')) return;
      store.pullCompressorHose();
      store.pushMessage('Compressor hose pulled from the van. Drag the end to the first station.');
      return;
    }
    if (data.type === 'cleaningStation') {
      if (!store.compressorHosePulled) {
        store.pushMessage('Pull the compressor hose from the van first.');
        return;
      }
      store.connectCompressorHose();
      store.pushMessage('Compressor hose run to the first cleaning station.');
      return;
    }
    if (data.type === 'accessHole' && data.payload) {
      const hole = store.accessHoles.find((candidate) => candidate.id === data.payload);
      if (!hole) return;
      if (!hole.cut) {
        if (!requireTool(store, 'hole-saw', 'hole saw and drill')) return;
        beginTimedAction(`Cutting ${hole.label}`, 1.5, () => {
          services.store.getState().cutAccessHole(hole.id);
          services.store.getState().pushMessage(`${hole.label} cut cleanly in trunk line.`);
        });
        return;
      }
      if (!hole.tubingConnected) {
        if (!requireTool(store, 'flex-tubing', '8 in flex tubing')) return;
        if (!store.negativeAirPositioned) {
          store.pushMessage('Stage the negative air machine before connecting tubing.');
          return;
        }
        beginTimedAction(`Connecting tubing to ${hole.label}`, 1.2, () => {
          services.store.getState().connectTube(hole.id);
          services.store.getState().pushMessage(`${hole.label} connected to negative air.`);
        });
      }
    }
  }

  update(services: PhaseServices) {
    const store = services.store.getState();
    const plasticDone = Object.values(store.plasticLaidRooms).every(Boolean);
    const holesDone = store.accessHoles.every((hole) => hole.cut && hole.tubingConnected);
    if (plasticDone && holesDone && store.negativeAirPositioned && store.compressorHoseConnected) {
      store.setPhase('registerRemoval');
      store.pushMessage('Setup complete. Remove all 11 registers carefully, screw by screw.');
    }
  }
}

function requireTool(state: GameStore, id: string, label: string): boolean {
  if (hasSelectedEquipment(state, id)) return true;
  state.failJob(`Critical equipment missing when needed: ${label}`, 30);
  return false;
}
