import RAPIER from '@dimforge/rapier3d-compat';
import type { StoreApi } from 'zustand/vanilla';
import { Euler, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import type { GameStore } from '../state/gameStore';
import { playerSpawns } from '../data/scenario';

const PLAYER_RADIUS = 0.34;
const PLAYER_HALF_HEIGHT = 0.58;

export class Controller {
  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  private readonly characterController: RAPIER.KinematicCharacterController;
  private readonly keys = new Set<string>();
  private readonly cameraRig = new Vector3();
  private yaw = 0;
  private pitch = 0;
  private verticalVelocity = 0;
  private grounded = false;
  private crouched = false;
  private enabled = true;

  constructor(
    private readonly camera: PerspectiveCamera,
    private readonly canvas: HTMLCanvasElement,
    private readonly rapier: typeof RAPIER,
    private readonly world: RAPIER.World,
    private readonly store: StoreApi<GameStore>,
  ) {
    this.body = this.world.createRigidBody(
      this.rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(
        playerSpawns.parkingLot.x,
        playerSpawns.parkingLot.y,
        playerSpawns.parkingLot.z,
      ),
    );
    this.collider = this.world.createCollider(this.rapier.ColliderDesc.capsule(PLAYER_HALF_HEIGHT, PLAYER_RADIUS), this.body);
    this.characterController = this.world.createCharacterController(0.04);
    this.characterController.setSlideEnabled(true);
    this.characterController.enableAutostep(0.35, 0.2, true);
    this.characterController.enableSnapToGround(0.18);
    this.teleport(new Vector3(playerSpawns.parkingLot.x, playerSpawns.parkingLot.y, playerSpawns.parkingLot.z), Math.PI);
    this.bindEvents();
  }

  update(dt: number) {
    if (!this.enabled || this.store.getState().pauseOpen) return;

    // Arrow-key look (trackpad-friendly alternative to mouse)
    const lookSpeed = 2.2 * dt;
    if (this.keys.has('ArrowLeft')) this.yaw += lookSpeed;
    if (this.keys.has('ArrowRight')) this.yaw -= lookSpeed;
    if (this.keys.has('ArrowUp')) this.pitch += lookSpeed;
    if (this.keys.has('ArrowDown')) this.pitch -= lookSpeed;
    this.pitch = Math.max(-1.38, Math.min(1.38, this.pitch));

    const movement = this.getMovement(dt);
    this.characterController.computeColliderMovement(this.collider, movement);
    const corrected = this.characterController.computedMovement();
    const current = this.body.translation();
    const next = {
      x: current.x + corrected.x,
      y: current.y + corrected.y,
      z: current.z + corrected.z,
    };
    this.body.setNextKinematicTranslation(next);
    this.grounded = Math.abs(corrected.y - movement.y) > 0.001 && this.verticalVelocity <= 0;
    if (this.grounded) this.verticalVelocity = Math.max(0, this.verticalVelocity);

    this.cameraRig.set(next.x, next.y + (this.crouched ? 0.68 : 0.95), next.z);
    this.camera.position.copy(this.cameraRig);
    this.camera.quaternion.copy(this.getCameraQuaternion());
  }

  teleport(position: Vector3, yaw = this.yaw) {
    this.yaw = yaw;
    this.pitch = 0;
    this.body.setNextKinematicTranslation({ x: position.x, y: position.y, z: position.z });
    this.body.setTranslation({ x: position.x, y: position.y, z: position.z }, true);
    this.camera.position.set(position.x, position.y + 0.95, position.z);
    this.camera.quaternion.copy(this.getCameraQuaternion());
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isPointerLocked() {
    return document.pointerLockElement === this.canvas;
  }

  private bindEvents() {
    this.canvas.addEventListener('click', () => {
      if (!this.isPointerLocked() && !this.store.getState().pauseOpen) {
        void this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      if (!this.isPointerLocked() && !this.store.getState().pauseOpen) {
        this.store.getState().setPauseOpen(true);
      }
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.isPointerLocked() || this.store.getState().pauseOpen) return;
      this.yaw -= event.movementX * 0.006;
      this.pitch -= event.movementY * 0.006;
      this.pitch = Math.max(-1.38, Math.min(1.38, this.pitch));
    });

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Tab') {
        event.preventDefault();
        this.store.getState().setInventoryOpen(!this.store.getState().inventoryOpen);
        return;
      }
      if (event.code === 'Escape') {
        this.store.getState().setPauseOpen(true);
        return;
      }
      if (/^Digit[1-9]$/.test(event.code)) {
        const slot = Number(event.code.replace('Digit', ''));
        const hotbar = ['agitation-wand', 'negative-air-machine', 'flex-tubing', 'plastic-sheeting', 'screw-gun', 'hole-saw', 'fsk-tape', 'mastic', 'compressor-hose'];
        const tool = hotbar[slot - 1];
        if (tool) this.store.getState().setCurrentTool(tool);
      }
      if (event.code === 'Space' && this.grounded) {
        this.verticalVelocity = 4.8;
      }
      if (event.code === 'KeyC') {
        this.crouched = true;
      }
      this.keys.add(event.code);
    });

    document.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      if (event.code === 'KeyC') this.crouched = false;
    });
  }

  private getMovement(dt: number): Vector3 {
    const input = new Vector3();
    if (this.keys.has('KeyW')) input.z += 1;
    if (this.keys.has('KeyS')) input.z -= 1;
    if (this.keys.has('KeyA')) input.x -= 1;
    if (this.keys.has('KeyD')) input.x += 1;
    if (input.lengthSq() > 0) input.normalize();

    const speed = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 4.9 : 3.0) * (this.crouched ? 0.55 : 1);
    const forward = new Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const movement = new Vector3();
    movement.addScaledVector(forward, input.z * speed * dt);
    movement.addScaledVector(right, input.x * speed * dt);

    this.verticalVelocity -= 13.5 * dt;
    this.verticalVelocity = Math.max(this.verticalVelocity, -10);
    movement.y = this.verticalVelocity * dt;
    return movement;
  }

  private getCameraQuaternion(): Quaternion {
    const euler = new Euler(this.pitch, this.yaw, 0, 'YXZ');
    return new Quaternion().setFromEuler(euler);
  }
}
