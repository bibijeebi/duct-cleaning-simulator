import type { StoreApi } from 'zustand/vanilla';
import { Object3D, Raycaster, Vector2, PerspectiveCamera } from 'three';
import type { GameStore } from '../state/gameStore';
import { PhaseDirector } from '../phases/PhaseDirector';
import type { InteractiveData } from '../types/game';

export class Interaction {
  private readonly raycaster = new Raycaster();
  private readonly center = new Vector2(0, 0);
  private hovered: InteractiveData | null = null;
  private leftHeld = false;
  private rightPulse = false;

  constructor(
    private readonly camera: PerspectiveCamera,
    private readonly scene: Object3D,
    private readonly store: StoreApi<GameStore>,
    private readonly phaseDirector: PhaseDirector,
    private readonly setPrompt: (prompt: string) => void,
  ) {
    this.bindEvents();
  }

  update(dt: number) {
    this.raycaster.setFromCamera(this.center, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    this.hovered = null;
    for (const hit of hits) {
      const data = findInteractiveData(hit.object);
      if (!data) continue;
      if (hit.distance > interactionDistanceFor(data.type)) continue;
      this.hovered = data;
      break;
    }

    const prompt = this.hovered ? this.phaseDirector.getPrompt(this.hovered) : '';
    this.setPrompt(prompt);

    if (this.leftHeld) {
      this.phaseDirector.onUseHeld(dt);
    }
    if (this.rightPulse) {
      this.phaseDirector.onSecondary();
      this.rightPulse = false;
    }
  }

  private bindEvents() {
    document.addEventListener('keydown', (event) => {
      if (event.code !== 'KeyE' || event.repeat) return;
      const state = this.store.getState();
      if (state.pauseOpen || state.inventoryOpen || state.loadoutOpen) return;
      if (this.hovered) this.phaseDirector.handleInteraction(this.hovered);
    });

    document.addEventListener('mousedown', (event) => {
      const state = this.store.getState();
      if (state.pauseOpen || state.inventoryOpen || state.loadoutOpen) return;
      if (event.button === 0) this.leftHeld = true;
      if (event.button === 2) this.rightPulse = true;
    });

    document.addEventListener('mouseup', (event) => {
      if (event.button === 0) this.leftHeld = false;
    });

    document.addEventListener('contextmenu', (event) => event.preventDefault());
  }
}

function findInteractiveData(object: Object3D): InteractiveData | null {
  let current: Object3D | null = object;
  while (current) {
    const data = current.userData.interactive as InteractiveData | undefined;
    if (data) return data;
    current = current.parent;
  }
  return null;
}

function interactionDistanceFor(type: InteractiveData['type']): number {
  if (type === 'ceilingTile' || type === 'trunk' || type === 'accessHole') return 5.2;
  if (type === 'register') return 4.5;
  if (type === 'frontDoor') return 3.2;
  return 3.8;
}
