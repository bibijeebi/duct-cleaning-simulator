import type { StoreApi } from 'zustand/vanilla';
import { currentScore, type GameStore } from '../state/gameStore';
import { clampScore, getRank, scoreColor } from '../systems/scoring';
import styles from './hud.module.css';

export class Scorecard {
  readonly element = document.createElement('section');

  constructor(private readonly store: StoreApi<GameStore>, parent: HTMLElement, private readonly onRestart: () => void) {
    this.element.className = styles.scorecard;
    parent.appendChild(this.element);
    this.store.subscribe(() => this.render());
    this.render();
  }

  open() {
    this.render(true);
  }

  render(forceOpen = false) {
    const state = this.store.getState();
    const open = forceOpen || state.phase === 'scorecard';
    this.element.classList.toggle(styles.hidden, !open);
    if (!open) return;
    const score = clampScore(currentScore(state));
    const rank = getRank(score, state.failed);
    const color = scoreColor(score, state.failed);
    this.element.innerHTML = `
      <div class="${styles.scoreBox}">
        <p class="${styles.kicker}">Job Complete</p>
        <h1 style="color:${color}">${score}</h1>
        <h2>${rank}</h2>
        ${state.failed ? `<p class="${styles.warningText}">${state.failReason}</p>` : ''}
        <div class="${styles.scoreEvents}">
          ${state.scoreEvents
            .map((event) => `<div><span>${event.label}</span><strong>${event.points > 0 ? '+' : ''}${event.points}</strong></div>`)
            .join('')}
        </div>
        <button class="${styles.primaryButton}" data-play-again>Play Again</button>
      </div>
    `;
    this.element.querySelector('[data-play-again]')?.addEventListener('click', this.onRestart);
  }
}
