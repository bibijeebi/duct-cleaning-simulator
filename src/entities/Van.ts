import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, Vector3 } from 'three';
import { SceneManager } from '../scene/SceneManager';
import { materials, makeTextMaterial, decalTextures } from '../scene/materials';
import { createNegativeAirMachine, createShopVac, makeHose } from './Equipment';
import type { InteractiveData } from '../types/game';

export class Van {
  readonly group = new Group();
  readonly rearInteract: Mesh;
  private readonly compressorHose: Mesh;

  constructor(private readonly sceneManager: SceneManager) {
    this.group.name = 'Carolina Quality Air Van';
    this.group.position.set(-13.5, 0, -14.5);
    this.group.rotation.y = Math.PI;

    const body = new Mesh(new BoxGeometry(2.25, 1.75, 5.2), materials.vanWhite);
    body.position.set(0, 1.08, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);

    const cab = new Mesh(new BoxGeometry(2.2, 1.5, 1.75), materials.vanWhite);
    cab.position.set(0, 1.02, -3.15);
    cab.castShadow = true;
    this.group.add(cab);

    const windshield = new Mesh(new BoxGeometry(1.7, 0.58, 0.04), materials.glass);
    windshield.position.set(0, 1.48, -4.04);
    windshield.rotation.x = -0.16;
    this.group.add(windshield);

    // Van side decals - both sides with real Carolina Quality Air branding
    const decalMat = new MeshStandardMaterial({
      map: decalTextures.vanSide(),
      roughness: 0.55,
      metalness: 0.05,
    });
    const decalRight = new Mesh(new PlaneGeometry(3.8, 1.3), decalMat);
    decalRight.position.set(1.128, 1.22, -0.2);
    decalRight.rotation.y = -Math.PI / 2;
    this.group.add(decalRight);

    const decalLeft = new Mesh(new PlaneGeometry(3.8, 1.3), decalMat);
    decalLeft.position.set(-1.128, 1.22, -0.2);
    decalLeft.rotation.y = Math.PI / 2;
    this.group.add(decalLeft);

    const leftDoor = new Mesh(new BoxGeometry(0.06, 1.55, 1.05), materials.vanWhite);
    leftDoor.position.set(-0.42, 1.1, 2.72);
    leftDoor.rotation.y = -0.56;
    this.group.add(leftDoor);

    const rightDoor = new Mesh(new BoxGeometry(0.06, 1.55, 1.05), materials.vanWhite);
    rightDoor.position.set(0.42, 1.1, 2.72);
    rightDoor.rotation.y = 0.56;
    this.group.add(rightDoor);

    const floor = new Mesh(new BoxGeometry(1.9, 0.08, 1.2), materials.darkMetal);
    floor.position.set(0, 0.42, 2.05);
    this.group.add(floor);

    const machine = createNegativeAirMachine();
    machine.scale.setScalar(0.55);
    machine.position.set(-0.45, 0.42, 2.04);
    machine.rotation.y = Math.PI;
    this.group.add(machine);

    const vac = createShopVac();
    vac.scale.setScalar(0.65);
    vac.position.set(0.45, 0.42, 2.02);
    this.group.add(vac);

    const coil = makeHose(new Vector3(-0.82, 1.36, 1.8), new Vector3(0.85, 1.36, 1.78), 0.1, materials.galvanized);
    this.group.add(coil);

    for (const x of [-0.78, 0.78]) {
      for (const z of [-2.9, 1.55]) {
        const wheel = new Mesh(new CylinderGeometry(0.42, 0.42, 0.28, 24), materials.rubber);
        wheel.position.set(x, 0.42, z);
        wheel.rotation.z = Math.PI / 2;
        this.group.add(wheel);
      }
    }

    const rearMaterial = materials.highlight.clone();
    rearMaterial.transparent = true;
    rearMaterial.opacity = 0;
    this.rearInteract = new Mesh(new BoxGeometry(2.8, 2.7, 0.7), rearMaterial);
    this.rearInteract.position.set(0, 1.35, 3.05);
    this.rearInteract.userData.interactive = {
      id: 'van-rear',
      type: 'van',
      label: 'Carolina Quality Air van rear doors',
    } satisfies InteractiveData;
    this.group.add(this.rearInteract);

    this.compressorHose = makeHose(new Vector3(-0.1, 0.44, 2.72), new Vector3(-4.4, 0.1, 2.1), 0.045, materials.yellow);
    this.compressorHose.visible = false;
    this.group.add(this.compressorHose);

    this.sceneManager.scene.add(this.group);
    this.addColliders();
  }

  setCompressorHoseVisible(visible: boolean) {
    this.compressorHose.visible = visible;
  }

  private addColliders() {
    const basePosition = this.group.position;
    this.sceneManager.addBoxCollider({
      position: new Vector3(basePosition.x, 0.95, basePosition.z),
      size: new Vector3(2.4, 1.85, 5.4),
      rotationY: this.group.rotation.y,
    });
  }
}
