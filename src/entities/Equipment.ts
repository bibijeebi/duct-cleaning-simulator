import {
  BoxGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { materials } from '../scene/materials';

export function createNegativeAirMachine(): Group {
  const group = new Group();
  group.name = 'Negative Air Machine';

  const body = new Mesh(new BoxGeometry(1.5, 1.1, 1.05), materials.yellow);
  body.position.y = 0.62;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const panel = new Mesh(new BoxGeometry(1.32, 0.34, 0.05), materials.darkMetal);
  panel.position.set(0, 0.72, -0.55);
  group.add(panel);

  const intake = new Mesh(new CylinderGeometry(0.26, 0.26, 0.08, 24), materials.rubber);
  intake.rotation.x = Math.PI / 2;
  intake.position.set(-0.42, 0.72, -0.6);
  group.add(intake);

  const gauge = new Mesh(new CylinderGeometry(0.14, 0.14, 0.04, 24), materials.metal);
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set(0.25, 0.75, -0.61);
  group.add(gauge);

  for (const x of [-0.55, 0.55]) {
    for (const z of [-0.34, 0.34]) {
      const wheel = new Mesh(new CylinderGeometry(0.11, 0.11, 0.12, 14), materials.rubber);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.12, z);
      group.add(wheel);
    }
  }

  const handle = new Mesh(new BoxGeometry(1.25, 0.08, 0.08), materials.rubber);
  handle.position.set(0, 1.24, 0.36);
  group.add(handle);
  return group;
}

export function createShopVac(): Group {
  const group = new Group();
  const tank = new Mesh(new CylinderGeometry(0.38, 0.42, 0.85, 22), materials.darkMetal);
  tank.position.y = 0.54;
  tank.castShadow = true;
  group.add(tank);
  const lid = new Mesh(new CylinderGeometry(0.43, 0.4, 0.16, 22), materials.yellow);
  lid.position.y = 1.04;
  group.add(lid);
  const hose = makeHose(new Vector3(0.26, 0.88, 0), new Vector3(0.82, 0.6, -0.45), 0.045, materials.rubber);
  group.add(hose);
  return group;
}

export function createWandModel(): Group {
  const group = new Group();
  const grip = new Mesh(new CylinderGeometry(0.06, 0.06, 0.72, 16), materials.rubber);
  grip.rotation.z = Math.PI / 2;
  grip.position.set(0.12, -0.1, -0.42);
  group.add(grip);

  const rod = new Mesh(new CylinderGeometry(0.025, 0.025, 1.95, 12), materials.darkMetal);
  rod.rotation.z = Math.PI / 2;
  rod.position.set(0.86, 0.02, -0.42);
  group.add(rod);

  const head = new Mesh(new SphereGeometry(0.15, 16, 8), materials.rubber);
  head.position.set(1.88, 0.02, -0.42);
  group.add(head);

  for (let i = 0; i < 18; i += 1) {
    const bristle = new Mesh(new BoxGeometry(0.015, 0.19, 0.015), materials.rubber);
    const angle = (i / 18) * Math.PI * 2;
    bristle.position.set(1.88, 0.02 + Math.cos(angle) * 0.12, -0.42 + Math.sin(angle) * 0.12);
    bristle.rotation.x = angle;
    group.add(bristle);
  }
  return group;
}

export function makeHose(start: Vector3, end: Vector3, radius = 0.08, material: MeshStandardMaterial = materials.rubber): Mesh {
  const mid = start.clone().lerp(end, 0.5);
  mid.y += Math.max(0.25, start.distanceTo(end) * 0.08);
  const curve = new CatmullRomCurve3([start, mid, end]);
  const geometry = new TubeGeometry(curve, 18, radius, 12, false);
  const mesh = new Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function makeFlexTube(start: Vector3, end: Vector3): Group {
  const group = new Group();
  const hose = makeHose(start, end, 0.18, materials.galvanized);
  group.add(hose);

  const distance = start.distanceTo(end);
  const count = Math.max(5, Math.floor(distance * 2.3));
  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const p = start.clone().lerp(end, t);
    p.y += Math.sin(t * Math.PI) * 0.5;
    const rib = new Mesh(new TorusLikeGeometry(0.2, 0.012), materials.ductDark);
    rib.position.copy(p);
    rib.lookAt(end);
    group.add(rib);
  }
  return group;
}

class TorusLikeGeometry extends CylinderGeometry {
  constructor(radius: number, thickness: number) {
    super(radius, radius, thickness, 24, 1, true);
  }
}
