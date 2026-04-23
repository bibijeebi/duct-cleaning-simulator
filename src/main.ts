import RAPIER from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';
import { gameStore } from './state/gameStore';
import { SceneManager } from './scene/SceneManager';
import { ParkingLot } from './scene/ParkingLot';
import { Building } from './scene/Building';
import { Controller } from './player/Controller';
import { Interaction } from './player/Interaction';
import { HUD } from './ui/HUD';
import { PhaseDirector } from './phases/PhaseDirector';
import { AudioSystem } from './systems/audio';
import { playerSpawns } from './data/scenario';
import './ui/hud.module.css';

async function bootstrap() {
  await RAPIER.init();
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) throw new Error('Missing #app root');

  const sceneManager = new SceneManager(app, RAPIER);
  const parkingLot = new ParkingLot(sceneManager);
  const building = new Building(sceneManager);
  const controller = new Controller(sceneManager.camera, sceneManager.renderer.domElement, RAPIER, sceneManager.world, gameStore);
  const hud = new HUD(gameStore, app);
  const audio = new AudioSystem(gameStore);
  void audio;

  const director = new PhaseDirector({
    store: gameStore,
    ui: hud,
    teleport: (position, yaw) => controller.teleport(position, yaw),
  });

  hud.setCallbacks({
    onLoadoutStart: () => director.afterLoadoutStart(),
    onRestart: () => {
      gameStore.getState().resetGame();
      controller.teleport(new Vector3(playerSpawns.parkingLot.x, playerSpawns.parkingLot.y, playerSpawns.parkingLot.z), Math.PI);
      building.sync(gameStore.getState());
      parkingLot.van.setCompressorHoseVisible(false);
    },
  });

  const interaction = new Interaction(sceneManager.camera, sceneManager.scene, gameStore, director, (prompt) => hud.setPrompt(prompt));

  gameStore.subscribe((state) => {
    building.sync(state);
    parkingLot.van.setCompressorHoseVisible(state.compressorHosePulled || state.compressorHoseConnected);
  });

  let last = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    gameStore.getState().tick(dt);
    sceneManager.world.timestep = dt;
    sceneManager.world.step();
    controller.update(dt);
    director.update(dt);
    interaction.update(dt);
    sceneManager.render();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

bootstrap().catch((error) => {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (app) {
    app.innerHTML = `<pre style="color:#ff8b8b;padding:24px;background:#05080b;min-height:100vh;">${String(
      error instanceof Error ? error.stack : error,
    )}</pre>`;
  }
  console.error(error);
});
