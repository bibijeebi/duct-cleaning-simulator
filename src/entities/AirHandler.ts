import { BoxGeometry, CylinderGeometry, Group, Mesh, Vector3 } from 'three';
import { materials, makeTextMaterial } from '../scene/materials';
import type { InteractiveData } from '../types/game';

export function createAirHandler(): Group {
  const group = new Group();
  group.name = 'AHU-1 Split System Air Handler';

  const cabinet = new Mesh(new BoxGeometry(1.8, 2.15, 1.1), materials.darkMetal);
  cabinet.position.set(0, 1.15, 0);
  cabinet.castShadow = true;
  cabinet.receiveShadow = true;
  group.add(cabinet);

  const upper = new Mesh(new BoxGeometry(1.65, 0.74, 1.0), materials.galvanized);
  upper.position.set(0, 2.54, 0);
  upper.castShadow = true;
  group.add(upper);

  const filter = new Mesh(new BoxGeometry(1.35, 0.48, 0.08), materials.ceilingTile);
  filter.position.set(0, 0.5, -0.59);
  filter.userData.interactive = {
    id: 'filter-slot',
    type: 'filterSlot',
    label: '20x20x2 filter rack',
  } satisfies InteractiveData;
  group.add(filter);

  const label = new Mesh(new BoxGeometry(0.72, 0.32, 0.02), makeTextMaterial('AHU-1', 256, 128, { color: '#224cff' }));
  label.position.set(-0.36, 1.65, -0.57);
  group.add(label);

  const returnPort = new Mesh(new CylinderGeometry(0.38, 0.38, 0.16, 24), materials.galvanized);
  returnPort.rotation.x = Math.PI / 2;
  returnPort.position.set(0.68, 2.44, -0.64);
  group.add(returnPort);

  const copper = new Mesh(new CylinderGeometry(0.025, 0.025, 2.25, 12), materials.yellow);
  copper.position.set(-1.04, 1.46, 0.1);
  copper.rotation.x = 0.08;
  group.add(copper);

  const interactive = new Mesh(new BoxGeometry(2.0, 2.7, 1.25), materials.highlight.clone());
  interactive.position.set(0, 1.45, 0);
  interactive.material.transparent = true;
  interactive.material.opacity = 0;
  interactive.userData.interactive = {
    id: 'air-handler',
    type: 'airHandler',
    label: 'AHU-1 split system',
  } satisfies InteractiveData;
  group.add(interactive);

  group.position.copy(new Vector3(6.8, 0, 8.35));
  return group;
}
