import { matchStore } from "$lib/game/match/match-store.svelte";
import type { Player } from "$lib/engine/core/types";

class InputManager {
  private keys: Set<string> = new Set();
  private callbacks: Map<string, Set<Function>> = new Map();

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.onKeyDown.bind(this));
      window.addEventListener("keyup", this.onKeyUp.bind(this));
    }
  }

  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event)!.add(callback);
  }

  private onKeyDown(e: KeyboardEvent) {
    this.keys.add(e.code);

    if (e.code === "Escape") {
      this.emit("PAUSE");
    }

    if (e.code === "Space") {
      this.emit("PASS");
    }

    if (e.code === "KeyD") {
      this.emit("SHOOT");
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    this.keys.delete(e.code);
  }

  private emit(event: string) {
    if (this.callbacks.has(event)) {
      for (const cb of this.callbacks.get(event)!) {
        cb();
      }
    }
  }

  getMovementVector(): { x: number; z: number } {
    let x = 0;
    let z = 0;

    if (this.keys.has("ArrowUp") || this.keys.has("KeyW")) z -= 1;
    if (this.keys.has("ArrowDown") || this.keys.has("KeyS")) z += 1;
    if (this.keys.has("ArrowLeft") || this.keys.has("KeyA")) x -= 1;
    if (this.keys.has("ArrowRight") || this.keys.has("KeyD")) x += 1;

    // Normalize
    const length = Math.sqrt(x * x + z * z);
    if (length > 0) {
      x /= length;
      z /= length;
    }

    return { x, z };
  }
}

export const inputManager = new InputManager();
