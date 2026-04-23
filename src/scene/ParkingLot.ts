import { BoxGeometry, ConeGeometry, Group, Mesh, Vector3 } from 'three';
import { Van } from '../entities/Van';
import { SceneManager } from './SceneManager';
import { materials, makeTextMaterial } from './materials';
import type { InteractiveData } from '../types/game';

export class ParkingLot {
  readonly group = new Group();
  readonly van: Van;

  constructor(private readonly sceneManager: SceneManager) {
    this.group.name = 'Parking Lot and Exterior';
    this.sceneManager.addGround(42, 44, -2, -4);
    this.sceneManager.scene.add(this.group);
    this.createLotDetails();
    this.createExteriorFacade();
    this.van = new Van(sceneManager);
  }

  private createLotDetails() {
    for (let i = 0; i < 7; i += 1) {
      const stripe = new Mesh(new BoxGeometry(0.08, 0.012, 6.6), materials.parkingStripe);
      stripe.position.set(-20 + i * 3.1, 0.012, -15);
      stripe.rotation.y = -0.12;
      this.group.add(stripe);
    }

    for (const x of [-18, -8, 5, 13]) {
      const curb = new Mesh(new BoxGeometry(5, 0.24, 0.32), materials.concrete);
      curb.position.set(x, 0.12, -9.55);
      this.group.add(curb);
      this.sceneManager.addBoxCollider({ position: curb.position, size: new Vector3(5, 0.24, 0.32) });
    }

    this.addCone(new Vector3(-16.4, 0, -16.5));
    this.addCone(new Vector3(-9.4, 0, -16.6));
    this.addCone(new Vector3(-16.4, 0, -10.8));
  }

  private createExteriorFacade() {
    const facade = new Mesh(new BoxGeometry(24, 6.4, 0.38), materials.wallDark);
    facade.position.set(-1, 3.0, -9.92);
    facade.receiveShadow = true;
    facade.castShadow = true;
    this.group.add(facade);

    const sign = new Mesh(
      new BoxGeometry(4.8, 1.1, 0.08),
      makeTextMaterial('Summit View', 512, 256, { background: '#4f4a40', color: '#eeeeee', subtitle: 'Office Suites' }),
    );
    sign.position.set(-0.8, 2.85, -10.15);
    this.group.add(sign);

    const door = new Mesh(new BoxGeometry(2.0, 2.25, 0.12), materials.glass);
    door.position.set(-1, 1.12, -10.18);
    door.userData.interactive = {
      id: 'front-door',
      type: 'frontDoor',
      label: 'front office door',
    } satisfies InteractiveData;
    this.group.add(door);

    const pull = new Mesh(new BoxGeometry(0.08, 0.82, 0.08), materials.metal);
    pull.position.set(-0.22, 1.15, -10.28);
    this.group.add(pull);

    for (const y of [1.45, 4.15]) {
      for (let i = 0; i < 7; i += 1) {
        const window = new Mesh(new BoxGeometry(2.2, 0.92, 0.08), materials.glass);
        window.position.set(-10 + i * 3.1, y, -10.16);
        this.group.add(window);
      }
    }
  }

  private addCone(position: Vector3) {
    const cone = new Mesh(new ConeGeometry(0.34, 0.86, 18), materials.yellow);
    cone.position.copy(position);
    cone.position.y = 0.43;
    cone.castShadow = true;
    cone.receiveShadow = true;
    this.group.add(cone);
    const base = new Mesh(new BoxGeometry(0.78, 0.08, 0.78), materials.rubber);
    base.position.set(position.x, 0.04, position.z);
    this.group.add(base);
  }
}
