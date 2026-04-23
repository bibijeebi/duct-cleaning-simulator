import { BoxGeometry, CylinderGeometry, Group, Mesh, Vector3 } from 'three';
import { accessHoles, registers } from '../data/scenario';
import { ductSegments } from '../data/ductNetwork';
import { materials } from '../scene/materials';
import type { AccessHoleState, InteractiveData } from '../types/game';

export interface DuctVisuals {
  group: Group;
  accessMeshes: Map<string, Mesh>;
  accessHoleDiscs: Map<string, Mesh>;
  patchMeshes: Map<string, Mesh>;
}

export function createDuctVisuals(): DuctVisuals {
  const group = new Group();
  group.name = 'Procedural Duct Network';
  const accessMeshes = new Map<string, Mesh>();
  const accessHoleDiscs = new Map<string, Mesh>();
  const patchMeshes = new Map<string, Mesh>();

  const trunk = new Mesh(new BoxGeometry(1.0, 0.52, 15.5), materials.galvanized);
  trunk.position.set(0, 3.18, 0);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  trunk.userData.interactive = {
    id: 'trunk-main',
    type: 'trunk',
    label: 'main galvanized trunk line',
  } satisfies InteractiveData;
  group.add(trunk);

  for (const segment of ductSegments) {
    const register = registers.find((candidate) => candidate.id === segment.registerId);
    if (!register) continue;
    const start = new Vector3(0, 3.18, register.position[2]);
    const end = new Vector3(register.position[0], 3.1, register.position[2]);
    const branch = makeBranch(start, end, segment.material === 'flex');
    branch.name = segment.label;
    group.add(branch);
  }

  for (const hole of accessHoles) {
    const target = new Mesh(new CylinderGeometry(0.34, 0.34, 0.08, 32), materials.highlight.clone());
    target.rotation.x = Math.PI / 2;
    target.position.fromArray(hole.position);
    target.material.transparent = true;
    target.material.opacity = 0.18;
    target.userData.interactive = {
      id: hole.id,
      type: 'accessHole',
      label: hole.label,
      payload: hole.id,
    } satisfies InteractiveData;
    accessMeshes.set(hole.id, target);
    group.add(target);

    const disc = new Mesh(new CylinderGeometry(0.31, 0.31, 0.09, 32), materials.hole);
    disc.rotation.x = Math.PI / 2;
    disc.position.fromArray(hole.position);
    disc.visible = false;
    accessHoleDiscs.set(hole.id, disc);
    group.add(disc);

    const patch = new Mesh(new BoxGeometry(0.96, 0.04, 0.96), materials.galvanized);
    patch.position.fromArray(hole.position);
    patch.position.y += 0.02;
    patch.rotation.x = 0;
    patch.visible = false;
    patchMeshes.set(hole.id, patch);
    group.add(patch);
  }

  return { group, accessMeshes, accessHoleDiscs, patchMeshes };
}

export function syncAccessVisuals(visuals: DuctVisuals, holes: AccessHoleState[]) {
  for (const hole of holes) {
    const disc = visuals.accessHoleDiscs.get(hole.id);
    const patch = visuals.patchMeshes.get(hole.id);
    if (disc) disc.visible = hole.cut && !hole.patchPlaced;
    if (patch) {
      patch.visible = hole.patchPlaced;
      patch.material = hole.badTapeUsed ? materials.return : materials.galvanized;
      patch.scale.setScalar(hole.fskTapeApplied ? 1.08 : 1);
    }
  }
}

function makeBranch(start: Vector3, end: Vector3, flex: boolean): Group {
  const group = new Group();
  const length = Math.max(0.8, start.distanceTo(end));
  const mid = start.clone().lerp(end, 0.5);
  const branch = new Mesh(
    flex ? new CylinderGeometry(0.16, 0.16, length, 18) : new BoxGeometry(length, 0.32, 0.42),
    flex ? materials.ductDark : materials.galvanized,
  );
  branch.position.copy(mid);
  branch.rotation.z = Math.PI / 2;
  branch.castShadow = true;
  branch.receiveShadow = true;
  group.add(branch);

  if (flex) {
    const ribs = Math.floor(length * 3);
    for (let i = 0; i < ribs; i += 1) {
      const rib = new Mesh(new CylinderGeometry(0.172, 0.172, 0.025, 18, 1, true), materials.galvanized);
      rib.position.copy(start.clone().lerp(end, i / Math.max(1, ribs - 1)));
      rib.rotation.z = Math.PI / 2;
      group.add(rib);
    }
  }

  return group;
}
