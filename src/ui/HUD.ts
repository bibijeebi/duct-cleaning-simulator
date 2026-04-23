import type { StoreApi } from 'zustand/vanilla';
import { equipmentById } from '../data/equipment';
import { plasticRooms } from '../data/scenario';
import { currentScore, selectedToolName, type GameStore } from '../state/gameStore';
import { clampScore } from '../systems/scoring';
import { problemTitle } from '../systems/problems';
import type { TimedAction, PhaseUi } from '../phases/PhaseDirector';
import { DuctCrossSection } from './DuctCrossSection';
import { InteractionPrompt } from './InteractionPrompt';
import { Inventory } from './Inventory';
import { LoadoutMenu } from './LoadoutMenu';
import { Scorecard } from './Scorecard';
import styles from './hud.module.css';

export class HUD implements PhaseUi {
  readonly root = document.createElement('div');
  private readonly topLeft = document.createElement('section');
  private readonly topRight = document.createElement('section');
  private readonly tool = document.createElement('section');
  private readonly messages = document.createElement('section');
  private readonly modalRoot = document.createElement('div');
  private readonly pause = document.createElement('section');
  private readonly prompt: InteractionPrompt;
  private readonly loadout: LoadoutMenu;
  private readonly inventory: Inventory;
  private readonly crossSection: DuctCrossSection;
  private readonly scorecard: Scorecard;
  private onLoadoutStart = () => {};
  private onRestart = () => {};

  constructor(private readonly store: StoreApi<GameStore>, parent: HTMLElement) {
    this.root.className = styles.hudRoot;
    parent.appendChild(this.root);
    this.topLeft.className = styles.topLeft;
    this.topRight.className = styles.topRight;
    this.tool.className = styles.toolPanel;
    this.messages.className = styles.messages;
    this.modalRoot.className = styles.modalRoot;
    this.pause.className = styles.pauseOverlay;
    this.root.append(this.topLeft, this.topRight, this.tool, this.messages, this.modalRoot, this.pause);
    this.prompt = new InteractionPrompt(this.root);
    this.loadout = new LoadoutMenu(this.store, this.root, () => this.onLoadoutStart());
    this.inventory = new Inventory(this.store, this.root);
    this.crossSection = new DuctCrossSection(this.store, this.root);
    this.scorecard = new Scorecard(this.store, this.root, () => this.onRestart());
    this.store.subscribe(() => this.render());
    this.render();
  }

  setCallbacks(callbacks: { onLoadoutStart: () => void; onRestart: () => void }) {
    this.onLoadoutStart = callbacks.onLoadoutStart;
    this.onRestart = callbacks.onRestart;
  }

  setPrompt(text: string) {
    this.prompt.setText(text);
  }

  showActionProgress(action: TimedAction | null) {
    let progress = this.root.querySelector(`.${styles.progress}`) as HTMLElement | null;
    if (!action) {
      progress?.remove();
      return;
    }
    if (!progress) {
      progress = document.createElement('div');
      progress.className = styles.progress;
      this.root.appendChild(progress);
    }
    const pct = Math.min(100, (action.elapsed / action.duration) * 100);
    progress.innerHTML = `<span>${action.label}</span><div><i style="width:${pct}%"></i></div>`;
  }

  openRegisterModal(id: string) {
    this.renderRegisterModal(id);
  }

  openPatchModal(id: string) {
    this.renderPatchModal(id);
  }

  openProblemModal(id: string) {
    this.renderProblemModal(id);
  }

  openScorecard() {
    this.scorecard.open();
  }

  private render() {
    const state = this.store.getState();
    this.topLeft.innerHTML = `
      <p class="${styles.kicker}">${phaseName(state.phase)}</p>
      <h2>${phaseTitle(state.phase)}</h2>
      <div class="${styles.taskList}">
        ${tasksForState(state)
          .map((task) => `<div class="${task.done ? styles.done : ''} ${task.warning ? styles.warningTask : ''}"><span>${task.done ? '✓' : '○'}</span>${task.label}</div>`)
          .join('')}
      </div>
    `;
    this.topRight.innerHTML = `
      <div class="${styles.metric}"><span>Score</span><strong>${clampScore(currentScore(state))}</strong></div>
      <div class="${styles.metric}"><span>Timer</span><strong>${formatTime(state.elapsedSeconds)}</strong></div>
      <div class="${styles.miniMap}">
        <span>Building Map</span>
        <div class="${styles.mapLines}"></div>
        ${state.ducts
          .slice(0, 11)
          .map((duct) => `<i class="${duct.cleaned ? styles.cleanedNode : duct.kind === 'return' ? styles.returnNode : styles.supplyNode}" style="left:${duct.mapX}%;top:${duct.mapY}%;"></i>`)
          .join('')}
      </div>
    `;
    const toolName = selectedToolName(state);
    const toolItem = equipmentById.get(state.currentToolId);
    this.tool.innerHTML = `
      <span>Tool</span>
      <strong>${toolName}</strong>
      <small>${toolItem?.name ?? 'Hands'}</small>
    `;
    this.messages.innerHTML = state.messages.map((message) => `<div>${message}</div>`).join('');
    this.pause.classList.toggle(styles.hidden, !state.pauseOpen);
    if (state.pauseOpen) {
      this.pause.innerHTML = `
        <div class="${styles.pauseBox}">
          <h2>Paused</h2>
          <p>Click Resume to return to pointer lock.</p>
          <button class="${styles.primaryButton}" data-resume>Resume</button>
        </div>
      `;
      this.pause.querySelector('[data-resume]')?.addEventListener('click', () => {
        this.store.getState().setPauseOpen(false);
        const canvas = document.querySelector('canvas');
        if (canvas) void canvas.requestPointerLock();
      });
    }

    const activeRegister = state.activeRegisterModalId;
    if (activeRegister) this.renderRegisterModal(activeRegister);
    const activeProblem = state.activeProblemId;
    if (activeProblem) this.renderProblemModal(activeProblem);
    if (state.activePatchHoleId) this.renderPatchModal(state.activePatchHoleId);
    if (!activeRegister && !activeProblem && !state.activePatchHoleId) this.modalRoot.innerHTML = '';
  }

  private renderRegisterModal(id: string) {
    const state = this.store.getState();
    const register = state.registers.find((candidate) => candidate.id === id);
    if (!register || register.removed) {
      this.modalRoot.innerHTML = '';
      return;
    }
    const dropped = register.screwsDropped - register.screwsRecovered;
    this.modalRoot.innerHTML = `
      <section class="${styles.smallModal}">
        <div class="${styles.modalHeader}">
          <div>
            <p class="${styles.kicker}">Register Removal</p>
            <h2>${register.label}</h2>
          </div>
          <button class="${styles.iconButton}" data-close>×</button>
        </div>
        <p class="${styles.condition}">Condition: ${conditionLabel(register.condition)}</p>
        <div class="${styles.screwGrid}">
          ${Array.from({ length: 4 }, (_, i) => `<span class="${i < register.screwsRemoved ? styles.done : ''}">${i < register.screwsRemoved ? '✓' : '•'}</span>`).join('')}
        </div>
        <div class="${styles.modalActions}">
          <button data-score-paint ${register.paintScored ? 'disabled' : ''}>Score Paint</button>
          <button data-score-caulk ${register.caulkScored ? 'disabled' : ''}>Score Caulk</button>
          <button data-extract ${register.extractionUsed ? 'disabled' : ''}>Use Extractor</button>
          <button data-gentle class="${register.gentleMode ? styles.active : ''}">Gentle Mode</button>
          <button data-remove-screw class="${styles.primaryInline}">Remove Screw</button>
          <button data-recover ${dropped <= 0 ? 'disabled' : ''}>Find Dropped Screw (${Math.max(0, dropped)})</button>
        </div>
      </section>
    `;
    this.modalRoot.querySelector('[data-close]')?.addEventListener('click', () => this.store.getState().openRegisterModal(null));
    this.modalRoot.querySelector('[data-score-paint]')?.addEventListener('click', () => {
      this.store.getState().updateRegister(id, (entry) => ({ ...entry, paintScored: true }));
    });
    this.modalRoot.querySelector('[data-score-caulk]')?.addEventListener('click', () => {
      this.store.getState().updateRegister(id, (entry) => ({ ...entry, caulkScored: true }));
    });
    this.modalRoot.querySelector('[data-extract]')?.addEventListener('click', () => {
      this.store.getState().updateRegister(id, (entry) => ({ ...entry, extractionUsed: true }));
    });
    this.modalRoot.querySelector('[data-gentle]')?.addEventListener('click', () => {
      this.store.getState().updateRegister(id, (entry) => ({ ...entry, gentleMode: !entry.gentleMode }));
    });
    this.modalRoot.querySelector('[data-recover]')?.addEventListener('click', () => {
      this.store.getState().updateRegister(id, (entry) => ({ ...entry, screwsRecovered: entry.screwsRecovered + 1 }));
    });
    this.modalRoot.querySelector('[data-remove-screw]')?.addEventListener('click', () => this.removeScrew(id));
  }

  private removeScrew(id: string) {
    const state = this.store.getState();
    const register = state.registers.find((candidate) => candidate.id === id);
    if (!register || register.screwsRemoved >= 4) return;
    let penalty = 0;
    let reason = '';
    let damaged = register.damaged;
    if (register.condition === 'paintedScrews' && !register.paintScored) {
      penalty = -5;
      reason = 'Screwdriver slipped on painted-over screw';
    }
    if (register.condition === 'caulked' && !register.caulkScored) {
      penalty = -10;
      reason = 'Drywall ripped because caulk bead was not scored';
      damaged = true;
    }
    if (register.condition === 'strippedScrew' && !register.extractionUsed) {
      penalty = -5;
      reason = 'Stripped screw punched out instead of extracted';
    }
    if (register.condition === 'brittlePlastic' && !register.gentleMode) {
      penalty = -10;
      reason = 'Brittle plastic register cracked';
      damaged = true;
    }
    if (penalty) this.store.getState().addScoreEvent(reason, penalty);

    const willDrop = ((register.screwsRemoved + 1) * 17 + register.id.length * 11) % 10 === 0;
    this.store.getState().updateRegister(id, (entry) => ({
      ...entry,
      damaged,
      screwsRemoved: entry.screwsRemoved + 1,
      screwsDropped: entry.screwsDropped + (willDrop ? 1 : 0),
    }));
    const after = this.store.getState().registers.find((candidate) => candidate.id === id);
    if (willDrop) this.store.getState().pushMessage('A screw dropped and rolled under the carpet edge. Recover it before closeout.');
    if (after && after.screwsRemoved >= 4) {
      this.store.getState().removeRegister(id);
      this.store.getState().pushMessage(`${after.label} removed; opening exposed.`);
    }
  }

  private renderPatchModal(id: string) {
    const state = this.store.getState();
    const hole = state.accessHoles.find((candidate) => candidate.id === id);
    if (!hole) return;
    this.modalRoot.innerHTML = `
      <section class="${styles.smallModal}">
        <div class="${styles.modalHeader}">
          <div>
            <p class="${styles.kicker}">Patching</p>
            <h2>${hole.label}</h2>
          </div>
          <button class="${styles.iconButton}" data-close>×</button>
        </div>
        <div class="${styles.patchSteps}">
          <div class="${hole.masticApplied ? styles.done : ''}">Mastic around edge</div>
          <div class="${hole.patchPlaced ? styles.done : ''}">Sheet metal patch</div>
          <div class="${hole.screwsDriven >= 4 ? styles.done : ''}">${hole.screwsDriven}/4 screws</div>
          <div class="${hole.fskTapeApplied ? styles.done : hole.badTapeUsed ? styles.warningTask : ''}">FSK tape seal</div>
          <div class="${hole.insulationWrapped ? styles.done : ''}">Insulation wrap</div>
        </div>
        <div class="${styles.modalActions}">
          <button data-mastic>Apply Mastic</button>
          <button data-patch>Place Patch</button>
          <button data-screw>Drive Screw</button>
          <button data-tape>Seal Edge</button>
          <button data-wrap>Wrap Insulation</button>
        </div>
      </section>
    `;
    this.modalRoot.querySelector('[data-close]')?.addEventListener('click', () => {
      this.store.getState().setActivePatchHole(null);
      this.modalRoot.innerHTML = '';
    });
    this.modalRoot.querySelector('[data-mastic]')?.addEventListener('click', () => this.applyPatchStep(id, 'mastic'));
    this.modalRoot.querySelector('[data-patch]')?.addEventListener('click', () => this.applyPatchStep(id, 'patch'));
    this.modalRoot.querySelector('[data-screw]')?.addEventListener('click', () => this.applyPatchStep(id, 'screw'));
    this.modalRoot.querySelector('[data-tape]')?.addEventListener('click', () => this.applyPatchStep(id, 'tape'));
    this.modalRoot.querySelector('[data-wrap]')?.addEventListener('click', () => this.applyPatchStep(id, 'wrap'));
  }

  private applyPatchStep(id: string, step: 'mastic' | 'patch' | 'screw' | 'tape' | 'wrap') {
    const state = this.store.getState();
    const tool = state.currentToolId;
    const required: Record<'mastic' | 'patch' | 'screw' | 'tape' | 'wrap', string> = {
      mastic: 'mastic',
      patch: 'patch-kit',
      screw: 'screw-gun',
      tape: 'fsk-tape',
      wrap: 'insulation-wrap',
    };
    if (step === 'tape' && tool === 'duct-tape') {
      this.store.getState().updateAccessHole(id, (hole) => ({ ...hole, badTapeUsed: true, fskTapeApplied: false }));
      this.store.getState().pushMessage('Duct tape used. That patch will fail inspection.');
      return;
    }
    if (tool !== required[step]) {
      this.store.getState().pushMessage(`Select ${equipmentById.get(required[step])?.shortName ?? required[step]} for this patch step.`);
      return;
    }
    this.store.getState().updateAccessHole(id, (hole) => {
      if (step === 'mastic') return { ...hole, masticApplied: true };
      if (step === 'patch') return { ...hole, patchPlaced: true };
      if (step === 'screw') return { ...hole, screwsDriven: Math.min(8, hole.screwsDriven + 1) };
      if (step === 'tape') return { ...hole, fskTapeApplied: true };
      return { ...hole, insulationWrapped: true };
    });
  }

  private renderProblemModal(id: string) {
    const state = this.store.getState();
    const problem = state.cleaningProblems.find((candidate) => candidate.id === id);
    if (!problem || problem.resolved) {
      this.modalRoot.innerHTML = '';
      return;
    }
    const title = problemTitle(problem.type);
    let body = '';
    if (problem.type === 'whipStuck') {
      body = `<p>Whip head is hung at a branch seam. Use right-click three times with controlled pullback.</p>`;
    }
    if (problem.type === 'compressorOff') {
      body = `<p>Pressure dropped and the compressor kicked off. Reset it before continuing.</p><button class="${styles.primaryButton}" data-reset-compressor>Reset Compressor</button>`;
    }
    if (problem.type === 'customerQuestion') {
      body = `<p>The customer asks whether this will fix every indoor air quality problem.</p>
        <button data-good-answer>Explain scope professionally</button>
        <button data-bad-answer>Promise it fixes everything</button>`;
    }
    if (problem.type === 'moldDiscovery') {
      body = `<p>Suspected microbial growth found near the return branch. Stop agitation, document, and flag remediation.</p>
        <button data-photo>Photograph and document</button>
        <button data-ignore-mold>Keep cleaning</button>`;
    }
    if (problem.type === 'asbestosSuspicion') {
      body = `<p>Vermiculite-like insulation is visible near the duct. Stop immediately and call the supervisor.</p>
        <button data-stop-asbestos>Stop and call supervisor</button>
        <button data-continue-asbestos>Continue work</button>`;
    }
    this.modalRoot.innerHTML = `
      <section class="${styles.smallModal}">
        <p class="${styles.kicker}">Problem Event</p>
        <h2>${title}</h2>
        <div class="${styles.problemBody}">${body}</div>
      </section>
    `;
    this.modalRoot.querySelector('[data-reset-compressor]')?.addEventListener('click', () => {
      this.store.getState().setCompressorRunning(true);
      this.store.getState().resolveProblem(id);
    });
    this.modalRoot.querySelector('[data-good-answer]')?.addEventListener('click', () => {
      this.store.getState().resolveProblem(id);
      this.store.getState().pushMessage('Professional customer communication logged.');
    });
    this.modalRoot.querySelector('[data-bad-answer]')?.addEventListener('click', () => {
      this.store.getState().addScoreEvent('Unprofessional customer answer', -5);
      this.store.getState().resolveProblem(id);
    });
    this.modalRoot.querySelector('[data-photo]')?.addEventListener('click', () => {
      this.store.getState().addScoreEvent('Correct hazard protocol: mold documented', 5);
      this.store.getState().resolveProblem(id);
    });
    this.modalRoot.querySelector('[data-ignore-mold]')?.addEventListener('click', () => {
      this.store.getState().addScoreEvent('Ignored mold hazard', -30);
      this.store.getState().resolveProblem(id);
    });
    this.modalRoot.querySelector('[data-stop-asbestos]')?.addEventListener('click', () => {
      this.store.getState().addScoreEvent('Correct hazard protocol: asbestos stop-work', 5);
      this.store.getState().resolveProblem(id);
      this.store.getState().finalizeScorecard();
      this.store.getState().setPhase('scorecard');
      this.openScorecard();
    });
    this.modalRoot.querySelector('[data-continue-asbestos]')?.addEventListener('click', () => {
      this.store.getState().failJob('Asbestos suspicion ignored: instant fail', 50);
    });
  }
}

function phaseName(phase: string): string {
  if (phase === 'prejob') return 'Phase 1';
  if (phase === 'assessment') return 'Phase 2';
  if (phase === 'setup') return 'Phase 3';
  if (phase === 'registerRemoval') return 'Phase 4';
  if (phase === 'cleaning') return 'Phase 5';
  if (phase === 'patching' || phase === 'completion') return 'Phase 6';
  return 'Scorecard';
}

function phaseTitle(phase: string): string {
  const titles: Record<string, string> = {
    prejob: 'Pre-Job Loadout',
    assessment: 'Arrival & Assessment',
    setup: 'Setup',
    registerRemoval: 'Register Removal',
    cleaning: 'Cleaning',
    patching: 'Patching',
    completion: 'Final Walkthrough',
    scorecard: 'Scorecard',
    failed: 'Stop Work',
  };
  return titles[phase] ?? 'Job';
}

function tasksForState(state: GameStore) {
  if (state.phase === 'prejob') return [{ label: 'Open van and confirm loadout', done: state.loadoutStarted }];
  if (state.phase === 'assessment') {
    return [
      { label: `Count supply registers (${state.registers.filter((register) => register.kind === 'supply' && register.identified).length}/8)`, done: state.registers.filter((register) => register.kind === 'supply' && register.identified).length === 8 },
      { label: `Count return grilles (${state.registers.filter((register) => register.kind === 'return' && register.identified).length}/3)`, done: state.registers.filter((register) => register.kind === 'return' && register.identified).length === 3 },
      { label: 'Identify split system at AHU-1', done: state.airHandlerIdentified },
      { label: 'Plan two trunk access points', done: state.trunkAccessPlanned },
    ];
  }
  if (state.phase === 'setup') {
    return [
      { label: `Lay plastic sheeting (${Object.values(state.plasticLaidRooms).filter(Boolean).length}/${plasticRooms.length})`, done: Object.values(state.plasticLaidRooms).every(Boolean) },
      { label: `Cut access holes (${state.accessHoles.filter((hole) => hole.cut).length}/2)`, done: state.accessHoles.every((hole) => hole.cut) },
      { label: `Connect 8 in tubing (${state.accessHoles.filter((hole) => hole.tubingConnected).length}/2)`, done: state.accessHoles.every((hole) => hole.tubingConnected) },
      { label: 'Position negative air machine', done: state.negativeAirPositioned },
      { label: 'Run compressor hose', done: state.compressorHoseConnected },
    ];
  }
  if (state.phase === 'registerRemoval') {
    return [{ label: `Remove registers (${state.registers.filter((register) => register.removed).length}/11)`, done: state.registers.every((register) => register.removed) }];
  }
  if (state.phase === 'cleaning') {
    return [
      { label: `Clean returns first (${state.ducts.filter((duct) => duct.kind === 'return' && duct.cleaned).length}/3)`, done: state.ducts.filter((duct) => duct.kind === 'return').every((duct) => duct.cleaned), warning: state.orderPenaltyApplied },
      { label: `Clean supply branches (${state.ducts.filter((duct) => duct.kind === 'supply' && duct.cleaned).length}/8)`, done: state.ducts.filter((duct) => duct.kind === 'supply').every((duct) => duct.cleaned) },
      { label: 'Vacuum downstream, whip upstream, compressor on', done: Boolean(state.selectedDuctId && state.compressorRunning) },
    ];
  }
  if (state.phase === 'patching') {
    return [
      { label: `Patch access holes (${state.accessHoles.filter((hole) => hole.masticApplied && hole.patchPlaced && hole.screwsDriven >= 4 && hole.fskTapeApplied && hole.insulationWrapped).length}/2)`, done: state.accessHoles.every((hole) => hole.masticApplied && hole.patchPlaced && hole.screwsDriven >= 4 && hole.fskTapeApplied && hole.insulationWrapped) },
      { label: 'Replace filter', done: state.filterReplaced },
    ];
  }
  if (state.phase === 'completion') {
    return [
      { label: `Reinstall registers (${state.registers.filter((register) => register.reinstalled).length}/11)`, done: state.registers.every((register) => register.reinstalled) },
      { label: 'Return to van for scorecard', done: state.walkthroughComplete },
    ];
  }
  return [];
}

function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60).toString().padStart(2, '0');
  const secs = (total % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

function conditionLabel(condition: string): string {
  return condition.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}
