import type { AccessHoleDefinition, RegisterDefinition, RoomDefinition } from '../types/game';

export const scenarioName = 'Commercial Office - Summit View Office Suites';

export const rooms: RoomDefinition[] = [
  { id: 'reception', name: 'Reception', x: -8, z: -2, width: 8, depth: 8, needsPlastic: true },
  { id: 'office-a', name: 'Office A', x: 1.5, z: -5, width: 5, depth: 5, needsPlastic: true },
  { id: 'office-b', name: 'Office B', x: 7, z: -5, width: 5, depth: 5 },
  { id: 'office-c', name: 'Office C', x: 7, z: 2, width: 5, depth: 5, needsPlastic: true },
  { id: 'conference', name: 'Conference', x: -7, z: 6, width: 10, depth: 5 },
  { id: 'bathroom', name: 'Bathroom', x: 1.5, z: 4, width: 4, depth: 4 },
  { id: 'mechanical', name: 'Mechanical Room', x: 6.5, z: 8, width: 6, depth: 4 },
  { id: 'hall', name: 'Main Hall', x: 0, z: 0, width: 3, depth: 16 },
];

export const registers: RegisterDefinition[] = [
  {
    id: 'supply-reception-1',
    label: 'Supply 1 - Reception West',
    kind: 'supply',
    roomId: 'reception',
    position: [-10, 2.73, -4],
    ceilingMounted: true,
    condition: 'normal',
  },
  {
    id: 'supply-reception-2',
    label: 'Supply 2 - Reception East',
    kind: 'supply',
    roomId: 'reception',
    position: [-6, 2.73, 0],
    ceilingMounted: true,
    condition: 'paintedScrews',
  },
  {
    id: 'supply-office-a',
    label: 'Supply 3 - Office A',
    kind: 'supply',
    roomId: 'office-a',
    position: [1.5, 2.73, -5],
    ceilingMounted: true,
    condition: 'normal',
  },
  {
    id: 'supply-office-b',
    label: 'Supply 4 - Office B',
    kind: 'supply',
    roomId: 'office-b',
    position: [7, 2.73, -5],
    ceilingMounted: true,
    condition: 'strippedScrew',
  },
  {
    id: 'supply-office-c',
    label: 'Supply 5 - Office C Flex',
    kind: 'supply',
    roomId: 'office-c',
    position: [7, 2.73, 2],
    ceilingMounted: true,
    condition: 'caulked',
  },
  {
    id: 'supply-conference-1',
    label: 'Supply 6 - Conference North',
    kind: 'supply',
    roomId: 'conference',
    position: [-9, 2.73, 5],
    ceilingMounted: true,
    condition: 'normal',
  },
  {
    id: 'supply-conference-2',
    label: 'Supply 7 - Conference South Flex',
    kind: 'supply',
    roomId: 'conference',
    position: [-5, 2.73, 8],
    ceilingMounted: true,
    condition: 'brittlePlastic',
  },
  {
    id: 'supply-bathroom',
    label: 'Supply 8 - Bathroom',
    kind: 'supply',
    roomId: 'bathroom',
    position: [1.5, 2.73, 4],
    ceilingMounted: true,
    condition: 'normal',
  },
  {
    id: 'return-hall',
    label: 'Return 1 - Hall Low Wall',
    kind: 'return',
    roomId: 'hall',
    position: [-1.55, 0.85, -1.5],
    rotationY: Math.PI / 2,
    ceilingMounted: false,
    condition: 'paintedScrews',
  },
  {
    id: 'return-conference',
    label: 'Return 2 - Conference Low Wall',
    kind: 'return',
    roomId: 'conference',
    position: [-2.05, 0.85, 6.5],
    rotationY: Math.PI / 2,
    ceilingMounted: false,
    condition: 'normal',
  },
  {
    id: 'return-mechanical',
    label: 'Return 3 - Mechanical Low Wall',
    kind: 'return',
    roomId: 'mechanical',
    position: [3.45, 0.85, 8],
    rotationY: Math.PI / 2,
    ceilingMounted: false,
    condition: 'caulked',
  },
];

export const accessHoles: AccessHoleDefinition[] = [
  { id: 'access-west', label: 'West Trunk Access', position: [-1.25, 3.18, -2.8] },
  { id: 'access-east', label: 'East Trunk Access', position: [1.25, 3.18, 3.6] },
];

export const removableCeilingTiles = [
  { id: 'tile-west', label: 'Hall Drop Tile - West Trunk', position: [-1.25, 2.77, -2.8] as const },
  { id: 'tile-east', label: 'Hall Drop Tile - East Trunk', position: [1.25, 2.77, 3.6] as const },
  { id: 'tile-mech', label: 'Mechanical Room Drop Tile', position: [5.6, 2.77, 7.1] as const },
];

export const plasticRooms = rooms.filter((room) => room.needsPlastic).map((room) => room.id);

export const playerSpawns = {
  parkingLot: { x: -13.5, y: 1.15, z: -20.8 },
  frontDoor: { x: -1, y: 1.15, z: -11.2 },
  lobby: { x: -1, y: 1.15, z: -8.5 },
};

export const negativeAirMarker = { x: 5.2, y: 0.08, z: 8.3 };
export const cleaningStationMarker = { x: -0.9, y: 0.08, z: -3.8 };
export const compressorPosition = { x: -13.2, y: 0.45, z: -14.8 };
