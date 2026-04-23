import type { StoreApi } from 'zustand/vanilla';
import { ductSegments } from '../data/ductNetwork';
import { equipmentCatalog, hotbarItems } from '../data/equipment';
import { scenarioName } from '../data/scenario';
import type { GameStore } from '../state/gameStore';
import styles from './hud.module.css';

export class Inventory {
  readonly element = document.createElement('section');

  constructor(private readonly store: StoreApi<GameStore>, parent: HTMLElement) {
    this.element.className = styles.tabOverlay;
    parent.appendChild(this.element);
    this.render();
    this.store.subscribe(() => this.render());
  }

  render() {
    const state = this.store.getState();
    this.element.classList.toggle(styles.hidden, !state.inventoryOpen);
    if (!state.inventoryOpen) return;

    this.element.innerHTML = `
      <div class="${styles.tabColumn}">
        <p class="${styles.kicker}">Scenario</p>
        <h2>${scenarioName}</h2>
        <p class="${styles.briefing}">
          Commercial split system with AHU-1 in the mechanical room, 8 supply registers, 3 return grilles,
          galvanized trunk line, rigid branches, flex branches, and one ductboard return. VAV boxes are not
          present in this first scenario.
        </p>
        <div class="${styles.hotbar}">
          ${hotbarItems
            .map((item) => `<button class="${state.currentToolId === item.id ? styles.active : ''}" data-tool="${item.id}">${item.hotbarSlot}. ${item.shortName}</button>`)
            .join('')}
        </div>
      </div>
      <div class="${styles.tabColumn}">
        <p class="${styles.kicker}">Inventory</p>
        <div class="${styles.inventoryGrid}">
          ${equipmentCatalog
            .filter((item) => state.selectedEquipment[item.id])
            .map((item) => `<button class="${state.currentToolId === item.id ? styles.active : ''}" data-tool="${item.id}">${item.shortName}</button>`)
            .join('')}
        </div>
      </div>
      <div class="${styles.tabColumn}">
        <p class="${styles.kicker}">Duct Network</p>
        <div class="${styles.ductMap}">
          <div class="${styles.mapTrunk}"></div>
          ${ductSegments
            .map((duct) => {
              const stateDuct = state.ducts.find((candidate) => candidate.id === duct.id);
              const classes = [styles.mapNode, state.selectedDuctId === duct.id ? styles.selectedNode : '', stateDuct?.cleaned ? styles.cleanedNode : '', duct.kind === 'return' ? styles.returnNode : styles.supplyNode].join(' ');
              return `<button class="${classes}" style="left:${duct.mapX}%;top:${duct.mapY}%;" data-duct="${duct.id}" title="${duct.label}"></button>`;
            })
            .join('')}
        </div>
        <div class="${styles.ductList}">
          ${state.ducts
            .map(
              (duct) => `<button class="${state.selectedDuctId === duct.id ? styles.active : ''}" data-duct="${duct.id}">
                <span>${duct.kind === 'return' ? 'RETURN' : 'SUPPLY'}</span>
                ${duct.label}
                <small>${duct.material.replace(/([A-Z])/g, ' $1')} • ${Math.round(duct.debris)}%</small>
              </button>`,
            )
            .join('')}
        </div>
      </div>
    `;

    this.element.querySelectorAll<HTMLElement>('[data-tool]').forEach((button) => {
      button.addEventListener('click', () => this.store.getState().setCurrentTool(button.dataset.tool ?? ''));
    });
    this.element.querySelectorAll<HTMLElement>('[data-duct]').forEach((button) => {
      button.addEventListener('click', () => this.store.getState().selectDuct(button.dataset.duct ?? ''));
    });
  }
}
