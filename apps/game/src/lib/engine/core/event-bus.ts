import type { GameEvent } from "./ecs";

class TypedEventBus {
  private listeners = new Map<string, Set<Function>>();

  on<T extends GameEvent["type"]>(type: T, handler: (e: Extract<GameEvent, { type: T }>) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
  }

  off<T extends GameEvent["type"]>(type: T, handler: (e: Extract<GameEvent, { type: T }>) => void) {
    this.listeners.get(type)?.delete(handler);
  }

  emit<T extends GameEvent>(event: T) {
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      for (const callback of typeListeners) {
        callback(event);
      }
    }
  }
}

export const eventBus = new TypedEventBus();
