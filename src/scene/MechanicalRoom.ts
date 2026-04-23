import { BoxGeometry, Group, Mesh, Vector3 } from 'three';
import { createAirHandler } from '../entities/AirHandler';
import { createNegativeAirMachine, makeHose } from '../entities/Equipment';
import { compressorPosition, negativeAirMarker } from '../data/scenario';
import { SceneManager } from './SceneManager';
import { materials } from './materials';
import type { InteractiveData } from '../types/game';

export class MechanicalRoom {
  readonly group = new Group();
  readonly negativeAirMachine = createNegativeAirMachine();
  readonly negativeAirMarkerMesh: Mesh;
  readonly compressor: Mesh;
  private readonly flexTubeGroup = new Group();
  private readonly compressorHose: Mesh;

  constructor(private readonly sceneManager: SceneManager) {
    this.group.name = 'Mechanical Room Equipment';
    this.sceneManager.scene.add(this.group);
    this.group.add(createAirHandler());

    const markerMaterial = materials.highlight.clone();
    markerMaterial.transparent = true;
    markerMaterial.opacity = 0.22;
    this.negativeAirMarkerMesh = new Mesh(new BoxGeometry(1.7, 0.06, 1.2), markerMaterial);
    this.negativeAirMarkerMesh.position.set(negativeAirMarker.x, negativeAirMarker.y, negativeAirMarker.z);
    this.negativeAirMarkerMesh.userData.interactive = {
      id: 'negative-air-marker',
      type: 'negativeAirMarker',
      label: 'negative air machine position',
    } satisfies InteractiveData;
    this.group.add(this.negativeAirMarkerMesh);

    this.negativeAirMachine.position.set(negativeAirMarker.x, 0, negativeAirMarker.z);
    this.negativeAirMachine.rotation.y = Math.PI;
    this.negativeAirMachine.visible = false;
    this.negativeAirMachine.userData.interactive = {
      id: 'negative-air-machine',
      type: 'negativeAirMachine',
      label: 'negative air machine',
    } satisfies InteractiveData;
    this.group.add(this.negativeAirMachine);

    this.compressor = new Mesh(new BoxGeometry(1.15, 0.58, 0.7), materials.yellow);
    this.compressor.position.set(compressorPosition.x, compressorPosition.y, compressorPosition.z);
    this.compressor.castShadow = true;
    this.compressor.userData.interactive = {
      id: 'compressor',
      type: 'compressor',
      label: 'air compressor',
    } satisfies InteractiveData;
    this.group.add(this.compressor);

    this.compressorHose = makeHose(
      new Vector3(compressorPosition.x, 0.34, compressorPosition.z),
      new Vector3(-0.9, 0.08, -3.8),
      0.04,
      materials.yellow,
    );
    this.compressorHose.visible = false;
    this.group.add(this.compressorHose);

    this.flexTubeGroup.visible = false;
    this.group.add(this.flexTubeGroup);
  }

  setNegativeAirVisible(visible: boolean) {
    this.negativeAirMachine.visible = visible;
    this.negativeAirMarkerMesh.visible = !visible;
  }

  setCompressorHoseVisible(visible: boolean) {
    this.compressorHose.visible = visible;
  }

  setFlexTubeVisible(visible: boolean) {
    this.flexTubeGroup.visible = visible;
  }

  rebuildFlexTubes(points: Vector3[]) {
    this.flexTubeGroup.clear();
    for (const point of points) {
      const hose = makeHose(point, new Vector3(negativeAirMarker.x, 1.0, negativeAirMarker.z), 0.18, materials.galvanized);
      this.flexTubeGroup.add(hose);
    }
  }
}
