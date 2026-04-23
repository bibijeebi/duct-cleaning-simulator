import type { DuctSegmentState, RegisterState } from '../types/game';

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getRank(score: number, failed: boolean): string {
  if (failed) return 'Needs Retraining';
  if (score >= 95) return 'Master Tech';
  if (score >= 85) return 'Journeyman';
  if (score >= 70) return 'Apprentice';
  return 'Needs Retraining';
}

export function scoreColor(score: number, failed: boolean): string {
  if (failed) return '#ff6b6b';
  if (score >= 95) return '#ffd700';
  if (score >= 85) return '#55e39d';
  if (score >= 70) return '#52d6ff';
  return '#ff9a62';
}

export function countMissingScrews(registers: RegisterState[]): number {
  return registers.reduce((total, register) => {
    const recovered = register.screwsRecovered;
    return total + Math.max(0, register.screwsDropped - recovered);
  }, 0);
}

export function allReturnsCleanBeforeSupply(ducts: DuctSegmentState[]): boolean {
  return ducts.filter((duct) => duct.kind === 'return').every((duct) => duct.cleaned);
}
