export class GameLoop {
  private readonly FIXED_STEP = 1 / 60; // 60Hz physics/AI tick
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private animationFrameId: number | null = null;

  start(
    fixedUpdate: (dt: number) => void, // Physics + AI
    renderUpdate: (alpha: number) => void, // Interpolated render
  ) {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();

    const loop = (timestamp: number) => {
      if (!this.running) return;

      const elapsed = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap at 50ms
      this.lastTime = timestamp;
      this.accumulator += elapsed;

      // Fixed-step updates (deterministic)
      while (this.accumulator >= this.FIXED_STEP) {
        fixedUpdate(this.FIXED_STEP);
        this.accumulator -= this.FIXED_STEP;
      }

      // Render at display frequency (interpolated)
      const alpha = this.accumulator / this.FIXED_STEP;
      renderUpdate(alpha);

      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

export const gameLoop = new GameLoop();
