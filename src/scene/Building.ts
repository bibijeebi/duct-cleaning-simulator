import { BoxGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, PlaneGeometry, Texture, Vector3 } from 'three';
import { createDuctVisuals, DuctVisuals, syncAccessVisuals } from '../entities/Duct';
import { createRegisterVisual, RegisterVisual } from '../entities/Register';
import {
  accessHoles,
  cleaningStationMarker,
  plasticRooms,
  registers,
  removableCeilingTiles,
  rooms,
} from '../data/scenario';
import { gameStore, type GameState } from '../state/gameStore';
import type { InteractiveData } from '../types/game';
import { MechanicalRoom } from './MechanicalRoom';
import { SceneManager } from './SceneManager';
import { decalTextures, makeGridMaterial, materials } from './materials';

export class Building {
  readonly group = new Group();
  readonly registerVisuals = new Map<string, RegisterVisual>();
  readonly ceilingTiles = new Map<string, Mesh>();
  readonly plasticMeshes = new Map<string, Mesh>();
  readonly ductVisuals: DuctVisuals;
  readonly mechanicalRoom: MechanicalRoom;
  private readonly cleaningStation: Mesh;
  private readonly floorZoneMeshes = new Map<string, Mesh>();

  constructor(private readonly sceneManager: SceneManager) {
    this.group.name = 'Office Suite Interior';
    this.sceneManager.scene.add(this.group);
    this.createFloors();
    this.createWalls();
    this.createCeiling();
    this.createRegisters();
    this.ductVisuals = createDuctVisuals();
    this.group.add(this.ductVisuals.group);
    this.mechanicalRoom = new MechanicalRoom(sceneManager);
    this.cleaningStation = this.createCleaningStation();
    this.createPosters();
    this.sync(gameStore.getState());
  }

  sync(state: GameState) {
    for (const register of state.registers) {
      const visual = this.registerVisuals.get(register.id);
      if (!visual) continue;
      visual.face.visible = !register.removed || register.reinstalled;
      visual.hole.visible = register.removed && !register.reinstalled;
      if (register.identified && register.kind === 'supply') visual.face.material = materials.identifiedSupply;
      if (register.identified && register.kind === 'return') visual.face.material = materials.identifiedReturn;
      if (register.damaged) visual.face.scale.set(0.88, 0.88, 0.88);
    }

    for (const [tileId, tile] of this.ceilingTiles.entries()) {
      tile.visible = !state.ceilingTilesOpen[tileId];
    }

    for (const roomId of plasticRooms) {
      const mesh = this.plasticMeshes.get(roomId);
      if (mesh) mesh.visible = Boolean(state.plasticLaidRooms[roomId]);
    }

    syncAccessVisuals(this.ductVisuals, state.accessHoles);
    const tubePoints = state.accessHoles
      .filter((hole) => hole.tubingConnected)
      .map((hole) => new Vector3(hole.position[0], hole.position[1], hole.position[2]));
    this.mechanicalRoom.rebuildFlexTubes(tubePoints);
    this.mechanicalRoom.setFlexTubeVisible(tubePoints.length > 0);
    this.mechanicalRoom.setNegativeAirVisible(state.negativeAirPositioned);
    this.mechanicalRoom.setCompressorHoseVisible(state.compressorHoseConnected);
    this.cleaningStation.visible = !state.firstCleaningStationReady;
  }

  private createFloors() {
    const carpetMaterial = makeGridMaterial('#525b63', '#68727b', 128);
    this.addFloor(new Vector3(-1, 0, 0.6), new Vector3(23, 0, 20), carpetMaterial);
    for (const room of rooms) {
      if (room.id === 'hall') continue;
      const labelStrip = new Mesh(new BoxGeometry(room.width * 0.35, 0.012, 0.04), materials.baseboard);
      labelStrip.position.set(room.x, 0.018, room.z - room.depth / 2 + 0.24);
      this.group.add(labelStrip);
    }

    for (const roomId of plasticRooms) {
      const room = rooms.find((candidate) => candidate.id === roomId);
      if (!room) continue;
      const zoneMaterial = materials.highlight.clone();
      zoneMaterial.transparent = true;
      zoneMaterial.opacity = 0.01;
      const zone = new Mesh(new BoxGeometry(room.width * 0.82, 0.04, room.depth * 0.82), zoneMaterial);
      zone.position.set(room.x, 0.06, room.z);
      zone.userData.interactive = {
        id: `floor-${roomId}`,
        type: 'floorZone',
        label: `${room.name} floor protection zone`,
        payload: roomId,
      } satisfies InteractiveData;
      this.floorZoneMeshes.set(roomId, zone);
      this.group.add(zone);

      const plastic = new Mesh(new BoxGeometry(room.width * 0.78, 0.018, room.depth * 0.78), materials.plastic);
      plastic.position.set(room.x, 0.045, room.z);
      plastic.visible = false;
      this.plasticMeshes.set(roomId, plastic);
      this.group.add(plastic);
    }
  }

  private createWalls() {
    const wallHeight = 2.74;
    const wallY = wallHeight / 2;
    this.addWall(new Vector3(-12.5, wallY, 0.5), new Vector3(0.28, wallHeight, 20.2));
    this.addWall(new Vector3(10.5, wallY, 0.5), new Vector3(0.28, wallHeight, 20.2));
    this.addWall(new Vector3(-1, wallY, 10.55), new Vector3(23.3, wallHeight, 0.28));
    this.addWall(new Vector3(-7.1, wallY, -9.45), new Vector3(10.8, wallHeight, 0.28));
    this.addWall(new Vector3(5.8, wallY, -9.45), new Vector3(9.4, wallHeight, 0.28));

    this.addWall(new Vector3(-2.0, wallY, -3.8), new Vector3(0.2, wallHeight, 7.0));
    this.addWall(new Vector3(-2.0, wallY, 5.1), new Vector3(0.2, wallHeight, 3.7));
    this.addWall(new Vector3(2.0, wallY, -3.8), new Vector3(0.2, wallHeight, 6.4));
    this.addWall(new Vector3(2.0, wallY, 4.7), new Vector3(0.2, wallHeight, 2.1));
    this.addWall(new Vector3(2.0, wallY, 8.5), new Vector3(0.2, wallHeight, 3.5));

    this.addWall(new Vector3(4.4, wallY, -2.4), new Vector3(5.1, wallHeight, 0.18));
    this.addWall(new Vector3(4.4, wallY, -7.6), new Vector3(5.1, wallHeight, 0.18));
    this.addWall(new Vector3(4.4, wallY, 0.1), new Vector3(5.1, wallHeight, 0.18));
    this.addWall(new Vector3(4.4, wallY, 6.1), new Vector3(4.4, wallHeight, 0.18));
    this.addWall(new Vector3(-7.0, wallY, 3.2), new Vector3(9.8, wallHeight, 0.18));

    for (const room of rooms) {
      if (room.id === 'hall') continue;
      const doorHeader = new Mesh(new BoxGeometry(1.2, 0.18, 0.08), materials.darkMetal);
      doorHeader.position.set(Math.max(-1.88, Math.min(1.88, room.x > 0 ? 2.1 : -2.1)), 2.22, room.z);
      this.group.add(doorHeader);
    }
  }

  private createCeiling() {
    const tileMat = materials.ceilingTile;
    for (let x = -11; x <= 9; x += 2) {
      for (let z = -8; z <= 9; z += 2) {
        const tile = new Mesh(new BoxGeometry(1.94, 0.035, 1.94), tileMat);
        tile.position.set(x, 2.78, z);
        tile.receiveShadow = true;
        this.group.add(tile);
      }
    }

    for (const tile of removableCeilingTiles) {
      const tileMaterial = materials.ceilingTile.clone();
      tileMaterial.emissive.set('#222');
      const mesh = new Mesh(new BoxGeometry(1.94, 0.045, 1.94), tileMaterial);
      mesh.position.fromArray(tile.position);
      mesh.userData.interactive = {
        id: tile.id,
        type: 'ceilingTile',
        label: tile.label,
        payload: tile.id,
      } satisfies InteractiveData;
      this.ceilingTiles.set(tile.id, mesh);
      this.group.add(mesh);
    }

    for (const z of [-6, -2, 2, 6]) {
      const light = new Mesh(new BoxGeometry(1.6, 0.025, 0.72), materials.fluorescent);
      light.position.set(0, 2.74, z);
      this.group.add(light);
    }
  }

  private createRegisters() {
    for (const registerDef of registers) {
      const state = gameStore.getState().registers.find((register) => register.id === registerDef.id);
      if (!state) continue;
      const visual = createRegisterVisual(state);
      this.registerVisuals.set(state.id, visual);
      this.group.add(visual.group);
    }
  }

  private createCleaningStation(): Mesh {
    const material = materials.highlight.clone();
    material.transparent = true;
    material.opacity = 0.24;
    const marker = new Mesh(new BoxGeometry(1.0, 0.06, 1.0), material);
    marker.position.set(cleaningStationMarker.x, cleaningStationMarker.y, cleaningStationMarker.z);
    marker.userData.interactive = {
      id: 'cleaning-station',
      type: 'cleaningStation',
      label: 'first cleaning station',
    } satisfies InteractiveData;
    this.group.add(marker);
    return marker;
  }

  private addFloor(position: Vector3, size: Vector3, material: MeshStandardMaterial) {
    const floor = new Mesh(new BoxGeometry(size.x, 0.08, size.z), material);
    floor.position.set(position.x, -0.04, position.z);
    floor.receiveShadow = true;
    this.group.add(floor);
    this.sceneManager.addBoxCollider({ position: floor.position, size: new Vector3(size.x, 0.08, size.z) });
  }

  private addWall(position: Vector3, size: Vector3) {
    const wall = new Mesh(new BoxGeometry(size.x, size.y, size.z), materials.wall);
    wall.position.copy(position);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.group.add(wall);
    this.sceneManager.addBoxCollider({ position, size });

    const trim = new Mesh(new BoxGeometry(size.x + 0.02, 0.12, size.z + 0.02), materials.baseboard);
    trim.position.set(position.x, 0.12, position.z);
    this.group.add(trim);
  }

  private createPosters() {
    // Attach OSHA-style safety posters to walls. Each: 0.9m x 1.2m, mounted at eye level.
    const make = (textureFn: () => Texture, position: Vector3, rotationY: number) => {
      const mat = new MeshStandardMaterial({
        map: textureFn(),
        roughness: 0.85,
        metalness: 0.02,
        side: DoubleSide,
      });
      const plane = new Mesh(new PlaneGeometry(0.9, 1.2), mat);
      plane.position.copy(position);
      plane.rotation.y = rotationY;
      plane.castShadow = false;
      plane.receiveShadow = true;
      this.group.add(plane);
    };

    // Reception area - Safety First poster on the south wall
    make(decalTextures.posterSafety, new Vector3(-8, 1.55, -9.31), 0);

    // Main hallway - Think Safety poster
    make(decalTextures.posterThinkSafety, new Vector3(-2.11, 1.55, 2), Math.PI / 2);

    // Conference room wall - NADCA certification
    make(decalTextures.posterNadca, new Vector3(-7, 1.55, 3.31), 0);

    // Mechanical room - Asbestos hazard warning (immersive foreshadowing)
    make(decalTextures.posterAsbestos, new Vector3(4.4, 1.55, 6.21), 0);
  }
}
