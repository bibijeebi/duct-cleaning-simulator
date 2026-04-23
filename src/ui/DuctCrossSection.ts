import type { StoreApi } from 'zustand/vanilla';
import type { GameStore, TechniqueMode } from '../state/gameStore';
import styles from './hud.module.css';

export class DuctCrossSection {
  readonly element = document.createElement('section');
  private readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly store: StoreApi<GameStore>, parent: HTMLElement) {
    this.element.className = styles.crossSection;
    this.canvas.width = 760;
    this.canvas.height = 260;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    parent.appendChild(this.element);
    this.canvas.addEventListener('click', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      if (x > rect.width * 0.58) {
        const selected = this.store.getState().selectedDuctId;
        if (selected) this.store.getState().placeVacuum(selected);
      }
    });
    this.store.subscribe(() => this.render());
    this.render();
  }

  render() {
    const state = this.store.getState();
    const duct = state.ducts.find((candidate) => candidate.id === state.selectedDuctId);
    this.element.classList.toggle(styles.hidden, state.phase !== 'cleaning' || !duct);
    if (!duct) return;

    this.element.innerHTML = `
      <div class="${styles.crossHeader}">
        <span>Duct Cross-Section</span>
        <strong>${duct.label}</strong>
      </div>
      <div class="${styles.techniqueControls}">
        <button data-technique="fullBrush" class="${state.heldTechnique === 'fullBrush' ? styles.active : ''}">Full Brush</button>
        <button data-technique="gentleBrush" class="${state.heldTechnique === 'gentleBrush' ? styles.active : ''}">Gentle</button>
        <button data-technique="airJet" class="${state.heldTechnique === 'airJet' ? styles.active : ''}">Air Jet</button>
      </div>
    `;
    this.element.appendChild(this.canvas);
    this.element.querySelectorAll<HTMLElement>('[data-technique]').forEach((button) => {
      button.addEventListener('click', () => this.store.getState().setTechnique(button.dataset.technique as TechniqueMode));
    });
    this.draw();
  }

  draw() {
    const state = this.store.getState();
    const duct = state.ducts.find((candidate) => candidate.id === state.selectedDuctId);
    if (!duct) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#071017';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.strokeStyle = '#52d6ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(58, 72, 540, 104);
    ctx.fillStyle = '#263139';
    ctx.fillRect(66, 80, 524, 88);
    ctx.fillStyle = '#11171c';
    ctx.fillRect(84, 96, 488, 56);

    ctx.fillStyle = '#52d6ff';
    ctx.font = '700 18px Arial';
    ctx.fillText('UPSTREAM', 58, 44);
    ctx.fillText('DOWNSTREAM TO AHU', 418, 44);
    drawArrow(ctx, 300, 48, 440, 48, '#ff4564');
    ctx.fillStyle = '#ff4564';
    ctx.fillText('AIRFLOW', 318, 30);

    if (duct.vacuumPlaced) {
      ctx.fillStyle = '#52d6ff';
      ctx.fillRect(560, 95, 22, 58);
      drawArrow(ctx, 620, 105, 670, 92, '#52d6ff');
      drawArrow(ctx, 620, 124, 680, 124, '#52d6ff');
      drawArrow(ctx, 620, 143, 670, 156, '#52d6ff');
      ctx.fillText('VACUUM PULL', 610, 184);
    } else {
      ctx.strokeStyle = '#FFD700';
      ctx.strokeRect(430, 184, 230, 42);
      ctx.fillStyle = '#FFD700';
      ctx.fillText('Click downstream to place vacuum', 446, 211);
    }

    if (duct.whipInserted) {
      ctx.strokeStyle = '#d8d8d8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(18, 128);
      ctx.lineTo(170 + (100 - duct.debris) * 2.6, 128);
      ctx.stroke();
      ctx.fillStyle = '#0e0e0e';
      ctx.beginPath();
      ctx.arc(170 + (100 - duct.debris) * 2.6, 128, 26, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 18; i += 1) {
        const angle = (i / 18) * Math.PI * 2;
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(170 + (100 - duct.debris) * 2.6, 128);
        ctx.lineTo(170 + (100 - duct.debris) * 2.6 + Math.cos(angle) * 42, 128 + Math.sin(angle) * 42);
        ctx.stroke();
      }
    }

    const particles = Math.floor(duct.debris / 3);
    for (let i = 0; i < particles; i += 1) {
      const x = 104 + ((i * 67) % 440);
      const y = 104 + ((i * 31) % 42);
      ctx.fillStyle = i % 2 ? '#b9aa79' : '#ddd0a8';
      ctx.fillRect(x, y, 3, 3);
    }

    ctx.fillStyle = duct.cleaned ? '#55e39d' : '#FFD700';
    ctx.font = '800 28px Arial';
    ctx.fillText(`${Math.round(duct.debris)}% debris`, 54, 226);
    ctx.font = '700 16px Arial';
    ctx.fillStyle = '#dcecff';
    ctx.fillText(`Material: ${duct.material.replace(/([A-Z])/g, ' $1')}`, 54, 248);
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 12 * Math.cos(angle - 0.5), y2 - 12 * Math.sin(angle - 0.5));
  ctx.lineTo(x2 - 12 * Math.cos(angle + 0.5), y2 - 12 * Math.sin(angle + 0.5));
  ctx.closePath();
  ctx.fill();
}
