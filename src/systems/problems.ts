import type { CleaningProblem, CleaningProblemType, DuctSegmentState } from '../types/game';

const defaultProblemTypes: CleaningProblemType[] = ['whipStuck', 'customerQuestion', 'moldDiscovery', 'compressorOff'];

export function selectCleaningProblems(ducts: DuctSegmentState[]): CleaningProblem[] {
  const hazardParam = new URLSearchParams(window.location.search).get('hazard');
  const returnDuct = ducts.find((duct) => duct.kind === 'return') ?? ducts[0];
  const supplyDuct = ducts.find((duct) => duct.kind === 'supply') ?? ducts[ducts.length - 1];

  if (hazardParam === 'asbestos') {
    return [
      {
        id: 'problem-asbestos',
        type: 'asbestosSuspicion',
        ductId: returnDuct.id,
        triggered: false,
        resolved: false,
      },
      {
        id: 'problem-whip',
        type: 'whipStuck',
        ductId: supplyDuct.id,
        triggered: false,
        resolved: false,
      },
    ];
  }

  const shuffled = [...defaultProblemTypes].sort(() => Math.random() - 0.5);
  return [
    {
      id: `problem-${shuffled[0]}`,
      type: shuffled[0],
      ductId: returnDuct.id,
      triggered: false,
      resolved: false,
    },
    {
      id: `problem-${shuffled[1]}`,
      type: shuffled[1],
      ductId: supplyDuct.id,
      triggered: false,
      resolved: false,
    },
  ];
}

export function problemTitle(type: CleaningProblemType): string {
  switch (type) {
    case 'whipStuck':
      return 'Whip Stuck';
    case 'compressorOff':
      return 'Compressor Kicked Off';
    case 'customerQuestion':
      return 'Customer Walk-In';
    case 'moldDiscovery':
      return 'Mold Discovery';
    case 'asbestosSuspicion':
      return 'Asbestos Suspicion';
  }
}
