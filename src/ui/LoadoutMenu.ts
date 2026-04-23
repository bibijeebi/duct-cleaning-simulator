import type { StoreApi } from 'zustand/vanilla';
import { equipmentCatalog } from '../data/equipment';
import type { GameStore } from '../state/gameStore';
import styles from './hud.module.css';

export class LoadoutMenu {
  readonly element = document.createElement('section');

  constructor(
    private readonly store: StoreApi<GameStore>,
    parent: HTMLElement,
    private readonly onStart: () => void,
  ) {
    this.element.className = styles.overlayPanel;
    parent.appendChild(this.element);
    this.render();
    this.store.subscribe(() => this.render());
  }

  render() {
    const state = this.store.getState();
    this.element.classList.toggle(styles.hidden, !state.loadoutOpen);
    if (!state.loadoutOpen) return;

    this.element.innerHTML = `
      <div class="${styles.modalHeader}">
        <div>
          <p class="${styles.kicker}">Phase 1</p>
          <h2>Van Loadout</h2>
        </div>
        <button class="${styles.iconButton}" data-close-loadout>×</button>
      </div>
      <p class="${styles.muted}">Recommended professional kit is preselected. Trap items are intentionally left unchecked.</p>
      <div class="${styles.loadoutGrid}">
        ${equipmentCatalog
          .map((item) => {
            const checked = state.selectedEquipment[item.id] ? 'checked' : '';
            return `
              <label class="${styles.loadoutItem} ${styles[item.category] ?? ''}">
                <input type="checkbox" data-equipment="${item.id}" ${checked} />
                <span>
                  <strong>${item.name}</strong>
                  <small>${item.description}</small>
                </span>
              </label>
            `;
          })
          .join('')}
      </div>
      <button class="${styles.primaryButton}" data-start-job>Start Job</button>
    `;

    this.element.querySelectorAll<HTMLInputElement>('[data-equipment]').forEach((input) => {
      input.addEventListener('change', () => this.store.getState().toggleEquipment(input.dataset.equipment ?? ''));
    });
    this.element.querySelector('[data-start-job]')?.addEventListener('click', () => {
      this.store.getState().startLoadout();
      this.onStart();
    });
    this.element.querySelector('[data-close-loadout]')?.addEventListener('click', () => {
      this.store.getState().setLoadoutOpen(false);
    });
  }
}
