import type { StoreApi } from 'zustand/vanilla';
import type { GameStore } from '../state/gameStore';

export class AudioSystem {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private hvac: OscillatorNode | null = null;
  private compressor: OscillatorNode | null = null;
  private vacuum: OscillatorNode | null = null;
  private compressorGain: GainNode | null = null;
  private vacuumGain: GainNode | null = null;

  constructor(private readonly store: StoreApi<GameStore>) {
    document.addEventListener('pointerdown', () => this.ensureStarted(), { once: true });
    this.store.subscribe((state) => {
      this.setCompressor(state.compressorRunning);
      this.setVacuum(state.phase === 'cleaning' && state.negativeAirPositioned);
    });
  }

  ensureStarted() {
    if (this.context) return;
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = 0.15;
    master.connect(context.destination);

    const hvac = context.createOscillator();
    hvac.type = 'sawtooth';
    hvac.frequency.value = 55;
    const hvacGain = context.createGain();
    hvacGain.gain.value = 0.045;
    hvac.connect(hvacGain);
    hvacGain.connect(master);
    hvac.start();

    const compressor = context.createOscillator();
    compressor.type = 'square';
    compressor.frequency.value = 38;
    const compressorGain = context.createGain();
    compressorGain.gain.value = 0;
    compressor.connect(compressorGain);
    compressorGain.connect(master);
    compressor.start();

    const vacuum = context.createOscillator();
    vacuum.type = 'sawtooth';
    vacuum.frequency.value = 190;
    const vacuumGain = context.createGain();
    vacuumGain.gain.value = 0;
    vacuum.connect(vacuumGain);
    vacuumGain.connect(master);
    vacuum.start();

    this.context = context;
    this.master = master;
    this.hvac = hvac;
    this.compressor = compressor;
    this.vacuum = vacuum;
    this.compressorGain = compressorGain;
    this.vacuumGain = vacuumGain;
  }

  private setCompressor(active: boolean) {
    if (!this.context || !this.compressorGain) return;
    this.compressorGain.gain.setTargetAtTime(active ? 0.08 : 0, this.context.currentTime, 0.08);
  }

  private setVacuum(active: boolean) {
    if (!this.context || !this.vacuumGain) return;
    this.vacuumGain.gain.setTargetAtTime(active ? 0.035 : 0, this.context.currentTime, 0.1);
  }
}
