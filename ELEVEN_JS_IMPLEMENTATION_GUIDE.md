# ELEVEN.JS — Implementation Quickstart & Scaffold Guide

## 1. MONOREPO BOOTSTRAP

```bash
# Create pnpm workspace
mkdir eleven-js && cd eleven-js
pnpm init
echo "packages:\n  - 'apps/*'\n  - 'packages/*'" > pnpm-workspace.yaml

# Scaffold SvelteKit app
pnpm create svelte@latest apps/game
# → Choose: SvelteKit, TypeScript, no demo, ESLint + Prettier

cd apps/game

# Core dependencies
vp add three @threlte/core @threlte/extras @threlte/rapier
vp add @dimforge/rapier3d-compat
vp add postprocessing
vp add dexie
pnpm add @tweenjs/tween.js
vp add gl-matrix

# Svelte UI
pnpm add -D tailwindcss @tailwindcss/vite
pnpm add -D shadcn-svelte

# Dev tools
pnpm add -D @types/three vite-plugin-top-level-await

# Install shadcn-svelte components
pnpx shadcn-svelte@latest init
pnpx shadcn-svelte@latest add button dialog sheet tabs badge progress
```

## 2. VITE CONFIG

```typescript
// apps/game/vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    sveltekit(),
    topLevelAwait(), // Required for Rapier WASM
  ],
  
  worker: {
    format: 'es',
  },
  
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat'], // WASM — don't pre-bundle
  },
  
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'threlte': ['@threlte/core', '@threlte/extras'],
          'rapier': ['@dimforge/rapier3d-compat'],
          'postprocessing': ['postprocessing'],
        }
      }
    }
  },
  
  server: {
    headers: {
      // Required for SharedArrayBuffer (physics worker)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  }
});
```

## 3. SVELTE CONFIG

```typescript
// apps/game/svelte.config.js
import adapter from '@sveltejs/adapter-static'; // Fully offline: static output
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: 'index.html', // SPA fallback
    }),
    alias: {
      '$engine': 'src/lib/engine',
      '$game': 'src/lib/game',
    }
  }
};
```

## 4. TAILWIND CSS V4 CONFIG

```css
/* src/app.css */
@import "tailwindcss";

@theme {
  /* Eleven.js design tokens */
  --color-pitch-green: #2d5a1b;
  --color-night-black: #0a0a0f;
  --color-stadium-grey: #1a1a2e;
  --color-accent-gold: #f5a623;
  --color-score-white: #f0f0f0;
  --color-home-blue: #1a56db;
  --color-away-red: #e02424;
  
  --font-display: "Barlow Condensed", system-ui;
  --font-hud: "Roboto Mono", monospace;
  --font-ui: "Inter Variable", system-ui;
  
  --radius-card: 0.75rem;
  --shadow-hud: 0 2px 12px rgba(0,0,0,0.8);
}
```

## 5. CORE GAME LOOP INTEGRATION (Svelte 5)

```svelte
<!-- src/routes/match/[id]/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Canvas } from '@threlte/core';
  import MatchScene from '$lib/ui/scenes/MatchScene.svelte';
  import HUD from '$lib/ui/hud/HUD.svelte';
  import PauseMenu from '$lib/ui/menus/PauseMenu.svelte';
  import { matchStore } from '$lib/game/match/match-store.svelte';
  import { inputManager } from '$lib/engine/input/input-manager.svelte';
  
  let paused = $state(false);
  
  onMount(() => {
    inputManager.on('PAUSE', () => paused = !paused);
  });
</script>

<div class="match-container">
  <!-- 3D Canvas -->
  <Canvas>
    <MatchScene {paused} />
  </Canvas>
  
  <!-- HUD overlay -->
  <HUD />
  
  <!-- Pause menu (conditionally shown) -->
  {#if paused}
    <PauseMenu onResume={() => paused = false} />
  {/if}
</div>

<style>
  .match-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #000;
  }
</style>
```

## 6. THRELTE SCENE SETUP

```svelte
<!-- src/lib/ui/scenes/MatchScene.svelte -->
<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { GLTF, Environment, Stars } from '@threlte/extras';
  import { EffectComposer, EffectPass, RenderPass, BloomEffect, TAAEffect } from 'postprocessing';
  import StadiumModel from './StadiumModel.svelte';
  import PitchMaterial from './PitchMaterial.svelte';
  import PlayerEntity from './PlayerEntity.svelte';
  import BallEntity from './BallEntity.svelte';
  import BroadcastCamera from './BroadcastCamera.svelte';
  import { matchStore } from '$lib/game/match/match-store.svelte';
  import { gameLoop } from '$lib/engine/core/game-loop';
  
  let { paused } = $props<{ paused: boolean }>();
  
  const { renderer, scene, camera } = useThrelte();
  
  // Start game loop
  gameLoop.start(paused);
  
  // Post-processing
  let composer: EffectComposer;
  $effect(() => {
    composer = new EffectComposer(renderer.current);
    composer.addPass(new RenderPass(scene.current, camera.current));
    composer.addPass(new EffectPass(camera.current,
      new TAAEffect(),
      new BloomEffect({ intensity: 0.4, luminanceThreshold: 0.85 }),
    ));
  });
  
  useTask((dt) => {
    if (!paused) composer?.render(dt);
  }, { autoInvalidate: false });
</script>

<!-- Stadium -->
<StadiumModel />

<!-- Pitch -->
<T.Mesh rotation.x={-Math.PI / 2}>
  <T.PlaneGeometry args={[68, 105]} />
  <PitchMaterial />
</T.Mesh>

<!-- Players -->
{#each matchStore.players as player (player.id)}
  <PlayerEntity {player} />
{/each}

<!-- Ball -->
<BallEntity ball={matchStore.ball} />

<!-- Camera -->
<BroadcastCamera target={matchStore.ball.position} />

<!-- Lighting -->
<T.AmbientLight intensity={0.15} />
{#each [[-30, 30, -40], [30, 30, -40], [-30, 30, 40], [30, 30, 40]] as pos}
  <T.DirectionalLight position={pos} intensity={0.8} castShadow />
{/each}

<!-- Environment -->
<Environment files="/assets/sky_night.hdr" isBackground />
```

## 7. PHYSICS WORKER SETUP

```typescript
// src/workers/physics.worker.ts
import RAPIER from '@dimforge/rapier3d-compat';

await RAPIER.init();

let world: RAPIER.World;
let ballBody: RAPIER.RigidBody;
let playerBodies: Map<number, RAPIER.RigidBody> = new Map();

function init(config: PhysicsInitConfig) {
  world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  
  // Ground
  const groundCollider = RAPIER.ColliderDesc.cuboid(34, 0.1, 52.5);
  world.createCollider(groundCollider);
  
  // Ball
  const ballDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(0, 0.11, 0)
    .setLinearDamping(0.3)
    .setAngularDamping(0.5);
  ballBody = world.createRigidBody(ballDesc);
  world.createCollider(
    RAPIER.ColliderDesc.ball(0.11)
      .setRestitution(0.65)
      .setFriction(0.5),
    ballBody
  );
  
  // Players
  for (const player of config.players) {
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(player.x, 0.925, player.z);
    const body = world.createRigidBody(bodyDesc);
    world.createCollider(
      RAPIER.ColliderDesc.capsule(0.65, 0.35),
      body
    );
    playerBodies.set(player.id, body);
  }
}

function tick(playerPositions: Float32Array) {
  // Update kinematic player positions from AI worker output
  let i = 0;
  for (const [id, body] of playerBodies) {
    body.setNextKinematicTranslation({
      x: playerPositions[i],
      y: playerPositions[i+1],
      z: playerPositions[i+2]
    });
    i += 3;
  }
  
  world.step();
  
  // Gather and return state
  const state = gatherState();
  self.postMessage({ type: 'TICK', state }, [state.buffer]);
}

self.onmessage = ({ data }) => {
  if (data.type === 'INIT') init(data.config);
  if (data.type === 'TICK') tick(data.playerPositions);
  if (data.type === 'IMPULSE') ballBody.applyImpulse(data.impulse, true);
};

function gatherState(): ArrayBuffer {
  const buf = new Float32Array(4);
  const t = ballBody.translation();
  buf[0] = t.x; buf[1] = t.y; buf[2] = t.z;
  buf[3] = ballBody.linvel().length();
  return buf.buffer;
}
```

## 8. MATCH STORE (SVELTE 5 RUNES)

```typescript
// src/lib/game/match/match-store.svelte.ts
import type { Player, Ball, MatchState } from '$lib/engine/core/types';

class MatchStore {
  // Reactive state
  homeScore = $state(0);
  awayScore = $state(0);
  minute = $state(0);
  phase = $state<MatchState['phase']>('PRE_MATCH');
  players = $state<Player[]>([]);
  ball = $state<Ball>({ position: { x: 0, y: 0.11, z: 0 }, velocity: { x: 0, y: 0, z: 0 } });
  events = $state<GameEvent[]>([]);
  paused = $state(false);
  
  // Derived
  isLosing = $derived(this.homeScore < this.awayScore);
  
  addGoal(scorer: Player) {
    if (scorer.teamId === 0) this.homeScore++;
    else this.awayScore++;
    // trigger commentary, celebration, etc.
  }
  
  updatePhysics(buffer: Float32Array) {
    this.ball.position.x = buffer[0];
    this.ball.position.y = buffer[1];
    this.ball.position.z = buffer[2];
  }
}

export const matchStore = new MatchStore();
```

## 9. PLAYER ENTITY COMPONENT

```svelte
<!-- src/lib/ui/scenes/PlayerEntity.svelte -->
<script lang="ts">
  import { T } from '@threlte/core';
  import { GLTF, useGltf, useAnimations } from '@threlte/extras';
  import type { Player } from '$lib/engine/core/types';
  
  let { player } = $props<{ player: Player }>();
  
  const gltf = useGltf('/assets/models/player_base_lod0.glb');
  
  // LOD: switch mesh based on camera distance
  let lodLevel = $state(0);
  
  $effect(() => {
    // Update transform from game state every frame
    if (gltfRef) {
      gltfRef.position.set(player.position.x, player.position.y, player.position.z);
      gltfRef.rotation.y = player.rotation;
    }
  });
  
  let gltfRef: THREE.Group;
</script>

{#await gltf then data}
  <T.Group bind:ref={gltfRef}>
    <T is={data.scene.clone()} />
    
    <!-- Selection indicator -->
    {#if player.isControlled}
      <T.Mesh position.y={0.05} rotation.x={-Math.PI / 2}>
        <T.RingGeometry args={[0.35, 0.45, 16]} />
        <T.MeshBasicMaterial color="#00ff88" transparent opacity={0.6} />
      </T.Mesh>
    {/if}
    
    <!-- Player name label (billboard) -->
    {#if player.showLabel}
      <T.Sprite position.y={2.2} scale={[2, 0.4, 1]}>
        <!-- Custom canvas texture with player name -->
      </T.Sprite>
    {/if}
  </T.Group>
{/await}
```

## 10. RUNNING LOCALLY

```bash
# Development
pnpm dev

# Build for production (fully static, works offline)
pnpm build

# Preview production build
pnpm preview

# Test in offline mode: build + serve
pnpm build && npx serve apps/game/build
```

The built output is a completely self-contained static site.  
Deploy to any static host (Vercel, Netlify, GitHub Pages, or local nginx) — no server needed.

## 11. ASSET PREPARATION PIPELINE

```bash
# Convert GLTF to GLB with Draco compression
npx gltf-pipeline -i player.gltf -o player_base_lod0.glb --draco.compressionLevel 7

# Convert textures to KTX2 (GPU-compressed, dramatically smaller VRAM)
npx ktx create --format R8G8B8A8_SRGB --encode uastc player_albedo.png player_albedo.ktx2

# Compress audio to OGG Vorbis (smaller than MP3, native browser support)
ffmpeg -i commentary_goal_01.wav -c:a libvorbis -q:a 5 commentary_goal_01.ogg

# Generate PMREM from HDR environment
# (Done at runtime via Three.js PMREMGenerator — no pre-processing needed)
```

---
*Eleven.js Implementation Guide v0.1 — Pre-Production*
