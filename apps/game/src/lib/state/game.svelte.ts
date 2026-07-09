import { inputState } from './inpit.svelte'
import { cameraState } from './camera.svelte'

class GameState {
  input = $state(inputState);
  camera = $state(cameraState);
}

export const gameState = new GameState();