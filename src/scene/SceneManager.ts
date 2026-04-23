import RAPIER from '@dimforge/rapier3d-compat';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { materials } from './materials';

export interface ColliderOptions {
  position: Vector3;
  size: Vector3;
  rotationY?: number;
  sensor?: boolean;
}

export class SceneManager {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly renderer: WebGLRenderer;
  readonly world: RAPIER.World;
  readonly dynamicRoot = new Group();
  private readonly rapier: typeof RAPIER;

  constructor(container: HTMLElement, rapier: typeof RAPIER) {
    this.rapier = rapier;
    this.scene = new Scene();
    this.scene.background = new Color('#9ba8ad');
    this.scene.fog = new Fog('#9ba8ad', 18, 48);
    this.camera = new PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 120);
    this.camera.position.set(-13, 1.25, -17);

    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.world = new rapier.World({ x: 0, y: -9.81, z: 0 });
    this.scene.add(this.dynamicRoot);

    this.addLighting();
    window.addEventListener('resize', this.resize);
  }

  dispose() {
    window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  addBox(
    parent: Object3D,
    name: string,
    position: Vector3,
    size: Vector3,
    material: MeshStandardMaterial,
    castShadow = true,
    receiveShadow = true,
  ): Mesh {
    const mesh = new Mesh(new BoxGeometry(size.x, size.y, size.z), material);
    mesh.name = name;
    mesh.position.copy(position);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    parent.add(mesh);
    return mesh;
  }

  addPlane(
    parent: Object3D,
    name: string,
    position: Vector3,
    size: Vector3,
    material: MeshStandardMaterial,
  ): Mesh {
    const mesh = new Mesh(new PlaneGeometry(size.x, size.z), material);
    mesh.name = name;
    mesh.position.copy(position);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  addBoxCollider({ position, size, rotationY = 0, sensor = false }: ColliderOptions): RAPIER.Collider {
    const body = this.world.createRigidBody(
      this.rapier.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z).setRotation({
        x: 0,
        y: Math.sin(rotationY / 2),
        z: 0,
        w: Math.cos(rotationY / 2),
      }),
    );
    const desc = this.rapier.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2);
    if (sensor) desc.setSensor(true);
    return this.world.createCollider(desc, body);
  }

  addGround(width: number, depth: number, x = 0, z = 0) {
    this.addPlane(this.scene, 'Ground', new Vector3(x, -0.01, z), new Vector3(width, 0, depth), materials.asphalt);
    this.addBoxCollider({
      position: new Vector3(x, -0.08, z),
      size: new Vector3(width, 0.12, depth),
    });
  }

  private addLighting() {
    const ambient = new AmbientLight('#b6c9d8', 0.55);
    this.scene.add(ambient);

    // Hemisphere light simulates sky vs ground bounce — warms interiors up
    const hemi = new HemisphereLight('#e6f1ff', '#7a6b4f', 0.6);
    hemi.position.set(0, 10, 0);
    this.scene.add(hemi);

    const sun = new DirectionalLight('#fff1cb', 2.4);
    sun.position.set(-18, 24, -12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -34;
    sun.shadow.camera.right = 34;
    sun.shadow.camera.top = 34;
    sun.shadow.camera.bottom = -34;
    this.scene.add(sun);
  }

  private resize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}
