import { BoxGeometry, Group, Mesh, Vector3 } from 'three';
import { materials } from '../scene/materials';
import type { InteractiveData, RegisterState } from '../types/game';

export interface RegisterVisual {
  group: Group;
  face: Mesh;
  hole: Mesh;
  registerId: string;
}

export function createRegisterVisual(register: RegisterState): RegisterVisual {
  const group = new Group();
  group.name = register.label;
  group.position.fromArray(register.position);
  if (register.rotationY) group.rotation.y = register.rotationY;

  const size = register.kind === 'supply' ? new Vector3(0.72, 0.08, 0.72) : new Vector3(1.1, 0.74, 0.08);
  const face = new Mesh(
    new BoxGeometry(size.x, size.y, size.z),
    register.kind === 'supply' ? materials.supply : materials.return,
  );
  face.castShadow = true;
  face.receiveShadow = true;
  face.userData.interactive = {
    id: register.id,
    type: 'register',
    label: register.label,
    payload: register.id,
  } satisfies InteractiveData;

  if (register.ceilingMounted) {
    face.rotation.x = 0;
  }
  group.add(face);

  for (let i = -2; i <= 2; i += 1) {
    const slot = new Mesh(
      new BoxGeometry(register.kind === 'supply' ? 0.58 : 0.86, 0.012, 0.018),
      materials.darkMetal,
    );
    if (register.kind === 'supply') {
      slot.position.set(0, -0.045, i * 0.095);
    } else {
      slot.position.set(0, i * 0.095, -0.048);
    }
    group.add(slot);
  }

  const holeSize = register.kind === 'supply' ? new Vector3(0.56, 0.04, 0.56) : new Vector3(0.92, 0.56, 0.045);
  const hole = new Mesh(new BoxGeometry(holeSize.x, holeSize.y, holeSize.z), materials.hole);
  hole.visible = false;
  hole.userData.interactive = {
    id: `${register.id}-hole`,
    type: 'register',
    label: `${register.label} opening`,
    payload: register.id,
  } satisfies InteractiveData;
  if (register.kind === 'supply') {
    hole.position.y = -0.02;
  } else {
    hole.position.z = -0.055;
  }
  group.add(hole);

  return { group, face, hole, registerId: register.id };
}
