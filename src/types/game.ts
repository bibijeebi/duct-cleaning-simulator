import type { Vector3Tuple } from 'three';

export type GamePhase =
  | 'prejob'
  | 'assessment'
  | 'setup'
  | 'registerRemoval'
  | 'cleaning'
  | 'patching'
  | 'completion'
  | 'scorecard'
  | 'failed';

export type EquipmentCategory = 'critical' | 'minor' | 'trap' | 'helper';

export interface EquipmentItem {
  id: string;
  name: string;
  shortName: string;
  category: EquipmentCategory;
  description: string;
  defaultSelected: boolean;
  hotbarSlot?: number;
}

export interface RoomDefinition {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  needsPlastic?: boolean;
}

export type RegisterKind = 'supply' | 'return';

export type RegisterCondition =
  | 'normal'
  | 'paintedScrews'
  | 'strippedScrew'
  | 'caulked'
  | 'brittlePlastic';

export interface RegisterDefinition {
  id: string;
  label: string;
  kind: RegisterKind;
  roomId: string;
  position: Vector3Tuple;
  rotationY?: number;
  ceilingMounted: boolean;
  condition: RegisterCondition;
}

export interface RegisterState extends RegisterDefinition {
  identified: boolean;
  removed: boolean;
  reinstalled: boolean;
  screwsRemoved: number;
  screwsDropped: number;
  screwsRecovered: number;
  paintScored: boolean;
  caulkScored: boolean;
  extractionUsed: boolean;
  gentleMode: boolean;
  damaged: boolean;
}

export type DuctMaterial = 'rigidMetal' | 'flex' | 'ductboard';

export interface DuctSegmentDefinition {
  id: string;
  label: string;
  registerId: string;
  kind: RegisterKind;
  material: DuctMaterial;
  debris: number;
  mapX: number;
  mapY: number;
}

export interface DuctSegmentState extends DuctSegmentDefinition {
  cleaned: boolean;
  vacuumPlaced: boolean;
  whipInserted: boolean;
  collapsed: boolean;
  fiberReleased: boolean;
  wrongToolWarned: boolean;
}

export interface AccessHoleDefinition {
  id: string;
  label: string;
  position: Vector3Tuple;
}

export interface AccessHoleState extends AccessHoleDefinition {
  cut: boolean;
  tubingConnected: boolean;
  masticApplied: boolean;
  patchPlaced: boolean;
  screwsDriven: number;
  fskTapeApplied: boolean;
  insulationWrapped: boolean;
  badTapeUsed: boolean;
  leakPenaltyApplied: boolean;
  perfectBonusApplied: boolean;
}

export type CleaningProblemType =
  | 'whipStuck'
  | 'compressorOff'
  | 'customerQuestion'
  | 'moldDiscovery'
  | 'asbestosSuspicion';

export interface CleaningProblem {
  id: string;
  type: CleaningProblemType;
  ductId: string;
  triggered: boolean;
  resolved: boolean;
}

export interface ScoreEvent {
  id: string;
  label: string;
  points: number;
  createdAt: number;
}

export interface TaskItem {
  id: string;
  label: string;
  done: boolean;
  warning?: boolean;
}

export interface InteractiveData {
  id: string;
  type:
    | 'van'
    | 'frontDoor'
    | 'register'
    | 'ceilingTile'
    | 'airHandler'
    | 'trunk'
    | 'accessHole'
    | 'floorZone'
    | 'negativeAirMarker'
    | 'negativeAirMachine'
    | 'compressor'
    | 'cleaningStation'
    | 'filterSlot';
  label: string;
  payload?: string;
}

export interface Vec2 {
  x: number;
  y: number;
}
