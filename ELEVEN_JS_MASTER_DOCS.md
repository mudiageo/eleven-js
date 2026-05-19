# ELEVEN.JS — Master Technical & Design Documentation
### A Browser-Native AAA Football Game Engine
**Version:** 0.1.0-alpha  
**Stack:** SvelteKit 2 · Svelte 5 Runes · Threlte 8 · Three.js r170+ · Rapier3D · Vite+ · Tailwind CSS v4 · shadcn-svelte · WebGPU/WebGL2  
**Status:** Pre-production Design Document

---

## TABLE OF CONTENTS

1. [Vision & Pillars](#1-vision--pillars)
2. [Technical Architecture](#2-technical-architecture)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Rendering & Graphics Pipeline](#4-rendering--graphics-pipeline)
5. [3D Asset Pipeline](#5-3d-asset-pipeline)
6. [Game Engine Core](#6-game-engine-core)
7. [Physics System](#7-physics-system)
8. [Player AI & Behavior Trees](#8-player-ai--behavior-trees)
9. [Match Gameplay Systems](#9-match-gameplay-systems)
10. [Controls & Input System](#10-controls--input-system)
11. [Camera System](#11-camera-system)
12. [Animation System](#12-animation-system)
13. [Foul, Referee & Disciplinary System](#13-foul-referee--disciplinary-system)
14. [Score, Match & Competition Management](#14-score-match--competition-management)
15. [Formation & Tactical System](#15-formation--tactical-system)
16. [Substitution & Squad Management](#16-substitution--squad-management)
17. [Commentary System](#17-commentary-system)
18. [Celebration System](#18-celebration-system)
19. [Audio Architecture](#19-audio-architecture)
20. [Game Modes](#20-game-modes)
21. [Offline League & Tournament Engine](#21-offline-league--tournament-engine)
22. [Local Multiplayer](#22-local-multiplayer)
23. [UI/UX Architecture](#23-uiux-architecture)
24. [Data Layer & Persistence](#24-data-layer--persistence)
25. [Performance Targets & Optimisation](#25-performance-targets--optimisation)
26. [Roadmap & Phased Delivery](#26-roadmap--phased-delivery)
27. [Third-Party Libraries & Licences](#27-third-party-libraries--licences)

---

## 1. VISION & PILLARS

### 1.1 The Goal
Eleven.js is a browser-first, fully offline-capable AAA football simulation that matches or exceeds the visual fidelity and gameplay depth of EA Sports FC 2026 and Konami eFootball 2025 — running entirely on commodity hardware with no native install, no server dependency, and no internet requirement after initial asset load.

### 1.2 Design Pillars

| Pillar | Description |
|---|---|
| **Pixel-Perfect Realism** | Subsurface scattering skin shaders, PBR stadium materials, volumetric lighting, motion-captured animations at 60fps |
| **Simulation Depth** | Physics-driven ball, fatigue system, player personality AI, positional intelligence, set-piece variety |
| **Browser-Native** | WebGPU primary, WebGL2 fallback; Service Worker asset caching; IndexedDB for all save data |
| **Local-First** | Full offline league engine, local split-screen, no account required |
| **Extensible** | Plugin architecture for future online multiplayer, transfer market, card packs |

### 1.3 Target Specs

| Metric | Target |
|---|---|
| Frame rate | 60fps stable on mid-range GPU (RTX 2060 / RX 6600 class) |
| Resolution | 1080p native, 1440p upscaled via TAA |
| Draw calls per frame | < 800 (batched + instanced) |
| Initial bundle | < 2MB JS; assets streamed/cached via Service Worker |
| VRAM budget | < 2GB |
| Load time (cold) | < 12 seconds |
| Load time (warm) | < 3 seconds |

---

## 2. TECHNICAL ARCHITECTURE

### 2.1 Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  SvelteKit 2 (App Shell, Routing, SSG for menus)                │
│  Svelte 5 Runes (Reactive state, stores)                        │
├─────────────────────────────────────────────────────────────────┤
│  Threlte 8 (Svelte ↔ Three.js declarative bridge)               │
│  Three.js r170+ (WebGPU Renderer primary, WebGLRenderer fallback)│
├─────────────────────────────────────────────────────────────────┤
│  Rapier3D WASM (Deterministic rigid-body / collision physics)    │
│  Custom Game Loop (ECS-inspired, fixed 60Hz tick)               │
├─────────────────────────────────────────────────────────────────┤
│  Web Workers: AI Worker · Physics Worker · Audio Worker         │
├─────────────────────────────────────────────────────────────────┤
│  Tailwind CSS v4 + shadcn-svelte (All UI outside the 3D canvas) │
│  Vite+ (Build, HMR, chunk splitting, WASM integration)          │
├─────────────────────────────────────────────────────────────────┤
│  IndexedDB (via Dexie.js) — all persistence                     │
│  Service Worker — asset caching, offline shell                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Rendering Backend Selection

```typescript
// src/lib/engine/renderer/backend.ts
export async function createRenderer(canvas: HTMLCanvasElement) {
  // Prefer WebGPU — dramatically better instancing, compute shaders
  if (navigator.gpu) {
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (adapter) {
      const { WebGPURenderer } = await import('three/webgpu');
      const renderer = new WebGPURenderer({ canvas, antialias: false }); // TAA handles AA
      await renderer.init();
      return { renderer, backend: 'webgpu' as const };
    }
  }
  // WebGL2 fallback
  const { WebGLRenderer } = await import('three');
  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  return { renderer, backend: 'webgl2' as const };
}
```

### 2.3 Thread Architecture

The game runs critical systems off the main thread to avoid janky UI:

```
Main Thread
├── Threlte/Three.js render loop (rAF)
├── Input handling
├── Svelte UI reactivity
└── Audio scheduling (Web Audio API)

Worker: physics.worker.ts
├── Rapier3D world (deterministic 60Hz fixed step)
├── Ball trajectory + spin
├── Player collision volumes
└── PostMessage results → main thread interpolated

Worker: ai.worker.ts
├── All 22 player behavior trees (100Hz)
├── Tactical positioning recalculation
├── Pathfinding (navigation mesh)
└── Decision tree evaluation

Worker: audio.worker.ts
├── Commentary audio selection
├── Crowd simulation state
└── Spatial audio position updates
```

---

## 3. MONOREPO STRUCTURE

```
eleven-js/
├── apps/
│   └── game/                        # Main SvelteKit app
│       ├── src/
│       │   ├── app.html
│       │   ├── routes/
│       │   │   ├── +layout.svelte   # App shell, audio context init
│       │   │   ├── +page.svelte     # Main menu
│       │   │   ├── match/
│       │   │   │   └── [id]/+page.svelte   # Live match view
│       │   │   ├── league/
│       │   │   ├── squad/
│       │   │   ├── settings/
│       │   │   └── kit-editor/
│       │   ├── lib/
│       │   │   ├── engine/          # All game engine code
│       │   │   │   ├── core/        # ECS, game loop, event bus
│       │   │   │   ├── renderer/    # Three.js / WebGPU setup
│       │   │   │   ├── physics/     # Rapier bridge
│       │   │   │   ├── ai/          # Behavior trees
│       │   │   │   ├── animation/   # Animation state machines
│       │   │   │   ├── audio/       # Web Audio / Howler
│       │   │   │   ├── input/       # Gamepad / keyboard
│       │   │   │   └── camera/      # Camera controllers
│       │   │   ├── game/            # Football-specific logic
│       │   │   │   ├── match/       # Match state machine
│       │   │   │   ├── ball/        # Ball physics wrapper
│       │   │   │   ├── player/      # Player entity
│       │   │   │   ├── referee/     # Foul detection
│       │   │   │   ├── tactics/     # Formation & AI tactics
│       │   │   │   ├── league/      # League / cup engine
│       │   │   │   ├── commentary/  # Commentary system
│       │   │   │   └── celebration/ # Celebration triggers
│       │   │   ├── data/            # Static DB (teams, players, kits)
│       │   │   └── ui/              # Svelte UI components (HUD, menus)
│       │   └── workers/
│       │       ├── physics.worker.ts
│       │       ├── ai.worker.ts
│       │       └── audio.worker.ts
│       ├── static/
│       │   ├── assets/
│       │   │   ├── models/          # GLTF player, stadium, ball
│       │   │   ├── textures/        # 4K PBR textures, normal maps
│       │   │   ├── audio/           # Commentary lines, SFX, crowd
│       │   │   └── shaders/         # GLSL / WGSL custom shaders
│       │   └── sw.js                # Service Worker
│       └── vite.config.ts
├── packages/
│   ├── game-data/                   # Shared player/team JSON data
│   ├── physics-types/               # Shared Rapier type definitions
│   └── ai-types/                    # Shared AI interfaces
└── pnpm-workspace.yaml
```

---

## 4. RENDERING & GRAPHICS PIPELINE

### 4.1 Render Pipeline Overview

Eleven.js targets **physically-based rendering (PBR)** across all materials with a deferred shading approach via Three.js WebGPU nodes.

```
Scene → G-Buffer Pass → Lighting Pass → Post-Processing → TAA → UI Composite
```

**G-Buffer layout:**
| Buffer | Contents |
|---|---|
| RT0 (RGBA16F) | Albedo + AO |
| RT1 (RGBA16F) | World Normal + Roughness |
| RT2 (RGBA16F) | Metalness + Emissive |
| RT3 (R32F) | Depth |

### 4.2 Lighting System

```typescript
// src/lib/engine/renderer/lighting.ts
export class StadiumLighting {
  // Primary: 4 × floodlight clusters at stadium corners
  floodlights: DirectionalLight[]     // Shadows, PCF soft
  // Secondary: Sky irradiance via HDRI environment map
  envMap: PMREMGenerator              // 512×512 pre-filtered
  // Fill: Ambient occlusion baked into player/stadium UVs
  // Dynamic: Ball and player contact shadow (blob shadow as fallback)
  
  // Time-of-day presets
  presets = {
    day:       { sunAngle: 45, skyHDRI: 'day.hdr',    floodIntensity: 0.2 },
    dusk:      { sunAngle: 8,  skyHDRI: 'dusk.hdr',   floodIntensity: 0.8 },
    night:     { sunAngle: -5, skyHDRI: 'night.hdr',  floodIntensity: 1.0 },
    overcast:  { sunAngle: 60, skyHDRI: 'cloudy.hdr', floodIntensity: 0.0 },
  }
}
```

### 4.3 Player Shaders — Skin & Kit

**Skin Shader (WGSL/GLSL):**
```glsl
// Subsurface scattering approximation for player skin
// Using Pre-Integrated SSS Lookup Table (Jimenez 2010)
uniform sampler2D sssLUT;
uniform float sssStrength;

vec3 computeSSS(vec3 albedo, float curvature, float NdotL) {
  vec2 sssUV = vec2(NdotL * 0.5 + 0.5, curvature);
  vec3 sssColor = texture2D(sssLUT, sssUV).rgb;
  return mix(albedo * max(NdotL, 0.0), sssColor * albedo, sssStrength);
}
```

**Kit Shader features:**
- Fabric weave normal map (microdetail)
- Dynamic number/name decal layer
- Sweat darkening (driven by match time + sprint amount)
- Mud/grass stain accumulation (sliding tackles increment dirt mask)
- Cloth simulation (vertex shader spring lattice on jersey hem)

### 4.4 Stadium Rendering

**Pitch (grass):**
```glsl
// Procedural grass shader — no texture repetition
// Combines: base color + mowing stripe mask + wear mask + lighting
float stripePattern = step(0.5, fract(worldPos.z / STRIPE_WIDTH));
float wearMask = texture2D(pitchWearTex, uv).r; // Updated during match
vec3 grassColor = mix(GRASS_LIGHT, GRASS_DARK, stripePattern);
grassColor = mix(grassColor, DIRT_COLOR, wearMask * 0.4);
```

**Crowd:**
- Billboard impostor crowd using instanced mesh
- 8 unique spectator sprite sheets × 4 animation frames
- Seated/standing/celebration state driven by match events
- Spatial density: front rows = individual meshes (LOD0), back rows = instanced billboards (LOD2)

**Stadium geometry LOD:**
- LOD0 (< 50m): Full PBR geometry
- LOD1 (50–150m): Reduced polygon, merged materials  
- LOD2 (> 150m): Baked impostor billboard

### 4.5 Ball Rendering

```typescript
// Premium ball shader
// - Hexagonal panel seams with parallax normal map
// - Specular highlight elongation (Beckmann anisotropic)
// - Motion blur trail (velocity buffer → blur in post)
// - Dirtying system: mud accumulation texture
const ballMaterial = new MeshStandardNodeMaterial();
ballMaterial.colorNode = /* panel albedo + seam mask */;
ballMaterial.normalNode = /* parallax-offset normal */;
ballMaterial.roughnessNode = /* panel roughness variation */;
// Ball spin visible via normal map rotation
ballMaterial.onBeforeRender = (renderer, scene, camera, geo, obj) => {
  obj.material.normalMapTransform.setFromMatrix2(spinMatrix);
};
```

### 4.6 Post-Processing Stack

```typescript
// Three.js PostProcessing (pmndrs/postprocessing)
const composer = new EffectComposer(renderer);

composer.addPass(new RenderPass(scene, camera));
composer.addPass(new EffectPass(camera,
  // 1. Temporal Anti-Aliasing — eliminates shimmer
  new TAAEffect({ samples: 16, blendFunction: BlendFunction.NORMAL }),
  // 2. Ambient Occlusion — HBAO quality
  new HBAOEffect({ radius: 0.5, intensity: 1.5 }),
  // 3. Bloom — stadium floodlight glare, ball specular
  new BloomEffect({ intensity: 0.4, luminanceThreshold: 0.85, kernelSize: KernelSize.LARGE }),
  // 4. Depth of Field — broadcast lens simulation
  new DepthOfFieldEffect({ focusDistance: 0.0, focalLength: 0.048, bokehScale: 2.5 }),
  // 5. Chromatic Aberration — lens realism
  new ChromaticAberrationEffect({ offset: new Vector2(0.001, 0.0005) }),
  // 6. Film Grain — cinematic texture
  new NoiseEffect({ premultiply: true }),
  // 7. Vignette
  new VignetteEffect({ darkness: 0.4 }),
  // 8. Color Grading — broadcast LUT
  new LUT3DEffect(broadcastLUT),
));
```

### 4.7 Shadow System

- **Cascaded Shadow Maps (CSM)** — 4 cascades for floodlights
- **PCSS** (Percentage Closer Soft Shadows) — realistic penumbra
- **Contact shadows** — screen-space contact shadow pass for ball-on-pitch
- **Player blob shadows** — disk shadow projected downward per player (zero-cost)

---

## 5. 3D ASSET PIPELINE

### 5.1 Player Model Spec

| Attribute | Value |
|---|---|
| Base mesh | ~8,000 triangles (LOD0) |
| LOD1 | ~4,000 triangles (> 20m from camera) |
| LOD2 | ~1,500 triangles (> 50m) |
| Rig | 65 bones: spine chain, full IK limbs, facial rig (10 blend shapes) |
| Textures | Albedo 2K, Normal 2K, ORM (Occlusion/Roughness/Metal) 2K, SSS 1K |
| Format | GLB (single file, Draco compressed) |
| Facial blend shapes | Angry, celebrate, tired, grim, neutral, smile, shout |

### 5.2 Player Customisation System

```typescript
// Runtime kit customisation via texture compositing
class PlayerTextureCompositor {
  async composite(player: Player, kit: KitDefinition): Promise<Texture> {
    const offscreenCanvas = new OffscreenCanvas(2048, 2048);
    const ctx = offscreenCanvas.getContext('2d')!;
    
    // Layer 1: Kit base colour
    ctx.fillStyle = kit.primaryColor;
    ctx.fillRect(0, 0, 2048, 2048);
    
    // Layer 2: Kit pattern (stripes, checks, gradient)
    await this.drawPattern(ctx, kit.pattern);
    
    // Layer 3: Club badge at chest
    await this.drawBadge(ctx, kit.badgeTexture);
    
    // Layer 4: Sponsor logo
    await this.drawSponsor(ctx, kit.sponsorTexture);
    
    // Layer 5: Player number + name (custom font)
    await this.drawNumber(ctx, player.number, player.name, kit.numberStyle);
    
    return new CanvasTexture(offscreenCanvas);
  }
}
```

### 5.3 Stadium Asset Tiers

| Tier | Polygons | VRAM | Use |
|---|---|---|---|
| Generic Small | 120K tris | 128MB | Lower leagues, custom cups |
| Generic Large | 280K tris | 256MB | Main competition |
| Signature (optional DLC pattern) | 480K tris | 512MB | Showpiece venues |

All stadiums: modular construction (pitch + 4 stand sections + roof + surrounds) for easier variant creation.

### 5.4 Animation Library

All animations stored as GLB morph+skinning animations:

**Locomotion (root motion):**
- Walk, Jog, Run, Sprint (all directions, 8-directional blending)
- Turn transitions (45°, 90°, 180°)
- Idle variations × 4

**Ball Interaction:**
- Short pass (both feet) × 4 variants
- Long pass × 3
- Ground cross × 2
- Lofted cross × 2
- First-time volley × 3
- Diving header × 2
- Standing header × 3
- Chip shot × 2
- Power shot × 4
- Outside-boot shot × 2
- Heel flick × 2
- Bicycle kick × 1 (rare trigger)

**Dribbling:**
- Body feint L/R × 2
- Step-over L/R × 3
- Elastico × 2
- Roulette × 1
- Rabona × 1
- Drag-back × 2
- Heel-to-heel × 1
- Lollipop × 1
- Ball roll L/R × 2

**Goalkeeper:**
- Dive low L/R × 3 each
- Dive high L/R × 2 each
- Punch × 2
- Parry × 3
- Distribution throw × 2
- Goal kick × 2
- Catch × 3

**Physical Challenges:**
- Slide tackle × 3
- Standing tackle × 4
- Block × 3
- Shoulder challenge × 2
- Trip fall × 4 (foul received)
- Push reaction × 2

**Celebrations:** see Section 18

### 5.5 GLB Loading & Caching

```typescript
// Persistent model cache via Cache API
class AssetManager {
  private cache = caches.open('eleven-assets-v1');
  
  async loadGLB(url: string): Promise<GLTF> {
    const cached = await (await this.cache).match(url);
    if (cached) {
      const blob = await cached.blob();
      return this.parseGLB(URL.createObjectURL(blob));
    }
    
    // Stream download with progress
    const response = await fetch(url);
    await (await this.cache).put(url, response.clone());
    return this.parseGLB(URL.createObjectURL(await response.blob()));
  }
  
  // Instance pool — reuse geometry across all 22 players
  private geometryPool = new Map<string, BufferGeometry>();
  private materialPool = new Map<string, Material>();
}
```

---

## 6. GAME ENGINE CORE

### 6.1 Entity Component System (ECS-Inspired)

Eleven.js uses a **lightweight ECS pattern** (not a full ECS library) — entities are typed TypeScript classes, components are plain objects, systems are functions operating on entity arrays.

```typescript
// src/lib/engine/core/ecs.ts

type EntityId = number;

interface Entity {
  id: EntityId;
  components: Map<string, Component>;
}

// Core components
interface TransformComponent {
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
}

interface PlayerComponent {
  teamId: 0 | 1;
  positionRole: PositionRole;
  stats: PlayerStats;
  stamina: number;           // 0–100
  actionState: PlayerAction;
  ballPossession: boolean;
  destinationNode: Vector3 | null;
  tacticSlot: number;        // Index in formation
}

interface BallComponent {
  spin: Vector3;
  lastTouchedBy: EntityId | null;
  inFlight: boolean;
  height: number;
}
```

### 6.2 Fixed-Step Game Loop

```typescript
// src/lib/engine/core/game-loop.ts
export class GameLoop {
  private readonly FIXED_STEP = 1 / 60;  // 60Hz physics/AI tick
  private accumulator = 0;
  private lastTime = 0;
  private running = false;

  start(
    fixedUpdate: (dt: number) => void,   // Physics + AI
    renderUpdate: (alpha: number) => void // Interpolated render
  ) {
    this.running = true;
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
      
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
```

### 6.3 Event Bus

```typescript
// src/lib/engine/core/event-bus.ts
// Strongly-typed game events
export type GameEvent =
  | { type: 'GOAL'; scorer: EntityId; assist: EntityId | null; minute: number }
  | { type: 'FOUL'; offender: EntityId; victim: EntityId; severity: FoulSeverity }
  | { type: 'CARD'; player: EntityId; cardType: 'yellow' | 'red'; minute: number }
  | { type: 'SUBSTITUTION'; off: EntityId; on: EntityId; teamId: number; minute: number }
  | { type: 'KICKOFF'; teamId: number }
  | { type: 'HALF_TIME' }
  | { type: 'FULL_TIME' }
  | { type: 'CORNER'; teamId: number }
  | { type: 'THROW_IN'; teamId: number; position: Vector3 }
  | { type: 'FREEKICK'; teamId: number; position: Vector3; direct: boolean }
  | { type: 'PENALTY'; teamId: number; taker: EntityId }
  | { type: 'OFFSIDE'; teamId: number }
  | { type: 'SAVE'; goalkeeper: EntityId; shotPower: number }
  | { type: 'INJURY'; player: EntityId; severity: 'minor' | 'major' }
  | { type: 'BALL_OUT'; side: 'left' | 'right' | 'goal-left' | 'goal-right' }
  | { type: 'PLAYER_SPRINT'; player: EntityId }
  | { type: 'TACKLE_SUCCESS'; tackler: EntityId; victim: EntityId };

class TypedEventBus {
  private listeners = new Map<string, Set<Function>>();
  
  on<T extends GameEvent['type']>(
    type: T,
    handler: (e: Extract<GameEvent, { type: T }>) => void
  ) { /* ... */ }
  
  emit<T extends GameEvent>(event: T) { /* ... */ }
}
```

### 6.4 Match State Machine

```
                     ┌─────────────┐
                     │  PRE_MATCH  │ ← Team selection, formation
                     └──────┬──────┘
                            │ kickoff()
                     ┌──────▼──────┐
              ┌──────│  FIRST_HALF │──────┐
              │      └──────┬──────┘      │
              │             │             │
        foul/dead ball  half_time()   goal scored
              │             │             │
              │      ┌──────▼──────┐      │
              └─────▶│  HALF_TIME  │◀─────┘
                     │  (15s break)│
                     └──────┬──────┘
                            │ kickoff()
                     ┌──────▼──────┐
                     │ SECOND_HALF │
                     └──────┬──────┘
                            │ full_time()
                     ┌──────▼──────┐
                     │  FULL_TIME  │
                     └──────┬──────┘
                            │ (if knockout + draw)
                     ┌──────▼──────┐
                     │    ET_1ST   │
                     └──────┬──────┘
                     ┌──────▼──────┐
                     │    ET_2ND   │
                     └──────┬──────┘
                            │ (if still level)
                     ┌──────▼──────┐
                     │  PENALTIES  │
                     └─────────────┘
```

---

## 7. PHYSICS SYSTEM

### 7.1 Rapier3D Integration

Rapier is a high-performance WASM physics engine with deterministic simulation — critical for consistent gameplay across hardware.

```typescript
// workers/physics.worker.ts
import RAPIER from '@dimforge/rapier3d-compat';

class PhysicsWorld {
  private world: RAPIER.World;
  private ballBody: RAPIER.RigidBody;
  private playerColliders: Map<EntityId, RAPIER.Collider>;
  
  init() {
    const gravity = { x: 0, y: -9.81, z: 0 };
    this.world = new RAPIER.World(gravity);
    
    // Fixed substep count for determinism
    this.world.timestep = 1 / 60;
    this.world.numSolverIterations = 8;
    this.world.numAdditionalFrictionIterations = 4;
  }
  
  tick() {
    this.world.step();
    // Gather state and postMessage to main thread
    const state = this.gatherState();
    self.postMessage({ type: 'PHYSICS_STATE', state }, [state.buffer]);
  }
}
```

### 7.2 Ball Physics

The ball is the single most important physics object. We simulate:

**Magnus Effect (spin physics):**
```typescript
// Computed each physics tick
function applyMagnusForce(ball: BallState): Vector3 {
  // F_magnus = 0.5 * ρ * Cl * A * |v|² * (ω̂ × v̂)
  const rho = 1.225;       // Air density kg/m³
  const Cl = 0.35;         // Lift coefficient (football)
  const A = Math.PI * 0.11 * 0.11; // Cross-section area
  
  const speed = ball.velocity.length();
  const spinDir = ball.angularVelocity.clone().normalize();
  const velDir = ball.velocity.clone().normalize();
  
  const magnusDir = spinDir.cross(velDir);
  const magnitude = 0.5 * rho * Cl * A * speed * speed;
  
  return magnusDir.multiplyScalar(magnitude);
}
```

**Grass friction model:**
```typescript
function computeGroundFriction(ball: BallState, pitch: PitchState): number {
  // Friction varies by pitch zone (wet near goals, worn in midfield)
  const wetness = pitch.getWetness(ball.position);
  const wear = pitch.getWear(ball.position);
  
  const baseFriction = 0.85;
  const wetBonus = wetness * 0.08;     // Wet = faster rolling
  const wearPenalty = wear * 0.05;     // Worn = slower
  
  return baseFriction + wetBonus - wearPenalty;
}
```

**Bounce model:**
- Coefficient of restitution: 0.65 (standard match ball)
- Topspin bounce: forward momentum preserved, height reduced
- Backspin bounce: speed dramatically reduced
- Swerve in air: Magnus + Bernoulli combined

### 7.3 Player Collision

Each player has:
- **Cylinder collider** (body): radius 0.35m, height 1.85m
- **Sphere collider** (foot contact): r=0.12m, sensor mode for ball interaction
- **Capsule collider** (tackle box): active only during tackle animation

Shoulder-to-shoulder challenges use **overlap detection** between two cylinder colliders with mass weighting:
```typescript
function resolveShoulderChallenge(a: Player, b: Player): ShoulderResult {
  const strengthA = a.stats.strength * (a.stamina / 100);
  const strengthB = b.stats.strength * (b.stamina / 100);
  const momentumA = a.velocity.length() * strengthA;
  const momentumB = b.velocity.length() * strengthB;
  
  const winner = momentumA > momentumB * 1.15 ? a :
                 momentumB > momentumA * 1.15 ? b : null; // 50/50
  return { winner, loser: winner ? (winner === a ? b : a) : null };
}
```

### 7.4 Offside Detection

```typescript
// Precise offside line calculation — runs every AI tick
function computeOffsideLine(attackingTeamId: number, players: Player[]): number {
  const defenders = players
    .filter(p => p.teamId !== attackingTeamId)
    .map(p => p.position.z)
    .sort((a, b) => a - b); // Sort by depth from goal
  
  // Second-last defender = offside line (includes GK)
  const offsideLine = defenders[1] ?? defenders[0];
  return offsideLine;
}

function isOffside(attacker: Player, offsideLine: number, ballPosition: Vector3): boolean {
  const passMoment = attacker.position.z;
  // Check: was attacker past offside line at moment of pass?
  return passMoment > offsideLine && passMoment > ballPosition.z;
}
```

---

## 8. PLAYER AI & BEHAVIOR TREES

### 8.1 AI Architecture Overview

Each player runs a **behavior tree** evaluated at 100Hz in the AI worker. The tree decides:
1. **Strategic role** — positional responsibilities
2. **Tactical action** — press, hold, support, attack
3. **Immediate action** — run for ball, dribble, pass, shoot, tackle

```typescript
// packages/ai-types/src/behavior-tree.ts
type NodeStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING';

abstract class BTNode {
  abstract tick(context: AIContext): NodeStatus;
}

class SelectorNode extends BTNode {
  // Returns SUCCESS on first child success (OR logic)
  tick(ctx: AIContext): NodeStatus {
    for (const child of this.children) {
      const result = child.tick(ctx);
      if (result !== 'FAILURE') return result;
    }
    return 'FAILURE';
  }
}

class SequenceNode extends BTNode {
  // Returns FAILURE on first child failure (AND logic)
  tick(ctx: AIContext): NodeStatus {
    for (const child of this.children) {
      const result = child.tick(ctx);
      if (result !== 'SUCCESS') return result;
    }
    return 'SUCCESS';
  }
}
```

### 8.2 Player Behavior Tree (Full)

```
PlayerRoot (Selector)
├── [Goalkeeper] GoalkeeperTree (Sequence — only if GK role)
│   ├── IsGoalkeeper?
│   └── GKBehavior (Selector)
│       ├── BallInDangerZone → DiveSave | PunchClear | CatchCross
│       ├── BallMidRange → PositionOnLine | SweepUpBehindDefense
│       └── BallFarAway → Distribute | ShoutDefensiveShape
│
├── [Possession] TeamHasBall? (Sequence)
│   └── WithBall (Selector)
│       ├── IHaveBall (Sequence)
│       │   ├── CanShoot? (distance + angle + stamina)
│       │   │   └── Shoot (Selector: PowerShot | Placed | Chip | Volley)
│       │   ├── DefenderClosing? (within 1.5m)
│       │   │   └── Dribble (Selector: BodyFeint | StepOver | Sprint | Elastico)
│       │   ├── BetterPassOption? (passing angle utility function)
│       │   │   └── PassTo(bestTeammate)
│       │   └── HoldBall (shield possession)
│       └── SupportAttack (Selector)
│           ├── MakeRun (overlapping | through-ball-run | decoy-run)
│           ├── TakeUpSupportPosition (triangulate with ball carrier)
│           └── TrackBackIfWinger
│
└── [Defense] OpponentHasBall? (Sequence)
    └── Defend (Selector)
        ├── AmIClosestToBall? → Press (Selector: ClosingDown | SlideTackle | StandingTackle)
        ├── AmIInDefensiveLine? → HoldLine (maintain offside trap or drop deep)
        ├── IsZoneMarking? → MarkZone
        └── IsManMarking? → MarkAssignedPlayer
```

### 8.3 Player Intelligence Stats Influence

Stats directly scale AI decision thresholds:

```typescript
interface PlayerStats {
  // Technical
  finishing: number;       // Shoot decision threshold
  shortPassing: number;    // Pass accuracy
  longPassing: number;     // Long ball success rate
  dribbling: number;       // Feint success probability
  ballControl: number;     // First-touch quality
  crossing: number;        // Cross accuracy
  
  // Physical  
  acceleration: number;    // Velocity ramp rate
  sprintSpeed: number;     // Max velocity (m/s, typical 8.5–10.5)
  stamina: number;         // Fatigue resistance
  strength: number;        // Shoulder challenge, shielding
  jumping: number;         // Header reach height
  
  // Mental
  vision: number;          // Pass option detection radius
  composure: number;       // Shot accuracy under pressure
  aggression: number;      // Press intensity, tackle frequency
  positioning: number;     // Positional intelligence accuracy
  reactions: number;       // AI re-decision speed
  workRate: { attack: 'low'|'med'|'high'; defense: 'low'|'med'|'high' };
  
  // Goalkeeper
  diving: number;
  handling: number;
  reflexes: number;
  oneOnOnes: number;
  
  // Weak foot & skill moves
  weakFootRating: 1|2|3|4|5;     // 1=unusable, 5=equal to strong foot
  skillMoves: 1|2|3|4|5;          // Unlocks more complex feints
}
```

### 8.4 Team Tactics AI

The **team brain** runs once per 10 AI ticks and updates collective shape:

```typescript
class TeamTacticsAI {
  recalculateShape(team: Team, match: MatchState): void {
    const pressure = this.computePressure(team, match);
    
    if (pressure > 0.7) {
      // High pressure: push up, compact lines, press aggressively
      team.defensiveLine = 'high';
      team.pressingTrigger = 'highPress';
    } else if (match.isLosing && match.minutesRemaining < 20) {
      // Losing late: park midfield, look for counter
      team.defensiveLine = 'mid';
      team.attackBias = 'longBall';
    } else {
      // Default: maintain formation shape
      team.defensiveLine = team.tactic.defaultLine;
    }
    
    // Redistribute formation slots based on ball position
    this.updatePositionalSlots(team, match.ballPosition);
  }
}
```

### 8.5 Goalkeeper AI

GK is a specialised behavior with unique sub-systems:

```typescript
class GoalkeeperAI {
  computeSavePosition(ball: BallState, shot: ShotVector): SaveAction {
    // Predict ball trajectory (integrate Magnus + gravity for 0.4s)
    const predicted = this.predictTrajectory(ball, shot, 0.4);
    
    // Map to save type
    const targetPoint = predicted.impactPoint;
    const reachable = this.isReachable(targetPoint);
    
    if (!reachable) return { type: 'CONCEDE' };
    
    const horizontal = targetPoint.x;  // -3.66 to +3.66 (goal width)
    const vertical = targetPoint.y;    // 0 to 2.44 (goal height)
    
    // Choose save animation based on target quadrant
    if (vertical > 1.6) return { type: 'DIVE_HIGH', direction: Math.sign(horizontal) };
    if (Math.abs(horizontal) > 2.5) return { type: 'DIVE_LOW', direction: Math.sign(horizontal) };
    if (vertical < 0.4) return { type: 'GROUND_SAVE', direction: Math.sign(horizontal) };
    return { type: 'STANDING_SAVE', direction: Math.sign(horizontal) };
  }
}
```

---

## 9. MATCH GAMEPLAY SYSTEMS

### 9.1 Ball Striking System

Shooting is driven by a **timing + power + accuracy** model:

```typescript
interface ShotInput {
  holdDuration: number;    // ms — maps to power
  releaseAccuracy: number; // 0–1 based on timing relative to animation frame
  playerFacing: Vector3;
  ballPosition: Vector3;
  playerStats: PlayerStats;
  pressureLevel: number;   // 0–1 from nearby defenders
}

function computeShot(input: ShotInput): ShotResult {
  // Power: logarithmic curve, max hold = 800ms
  const power = Math.min(1, Math.log(1 + input.holdDuration / 400) / Math.log(3));
  
  // Accuracy: timing window ±80ms around sweet spot gives clean contact
  const timingAccuracy = 1 - Math.abs(input.releaseAccuracy - 0.5) * 2;
  
  // Combined accuracy: stats reduce randomness cone
  const accuracyCone = (1 - timingAccuracy) * (1 - input.playerStats.finishing / 100);
  const randomOffset = new Vector2(
    (Math.random() - 0.5) * accuracyCone * 2,
    (Math.random() - 0.5) * accuracyCone
  );
  
  // Pressure reduces effective composure
  const composureFactor = 1 - (input.pressureLevel * (1 - input.playerStats.composure / 100) * 0.4);
  
  return {
    velocity: power * 32 * composureFactor,     // Max ~32 m/s ≈ 115 km/h
    direction: input.playerFacing.clone().add(randomOffset),
    spin: computeSpin(input),                   // Magnus spin axis
  };
}
```

### 9.2 Passing System

```typescript
// Through-ball prediction: AI calculates interception point
function computeThroughBall(passer: Player, target: Player, defenders: Player[]): ThroughBallResult {
  // Predict target's position at ball arrival time
  const distance = passer.position.distanceTo(target.position);
  const travelTime = distance / THROUGH_BALL_SPEED;
  const predictedPosition = target.position.clone()
    .add(target.velocity.clone().multiplyScalar(travelTime));
  
  // Check defenders can't intercept
  for (const def of defenders) {
    const defTime = def.position.distanceTo(predictedPosition) / def.maxSpeed;
    if (defTime < travelTime * 0.9) {
      return { safe: false, risk: 'INTERCEPTED', defender: def };
    }
  }
  
  return { safe: true, target: predictedPosition };
}
```

### 9.3 Dribbling System

```typescript
// Skill move success probability
function evaluateSkillMove(move: SkillMove, player: Player, defender: Player): boolean {
  const moveRating = SKILL_MOVE_REQUIREMENTS[move]; // 1–5 star requirement
  if (player.stats.skillMoves < moveRating) return false;
  
  // Base probability from skill rating difference
  const skillAdvantage = player.stats.dribbling - defender.stats.defensiveAwareness;
  const baseProb = 0.5 + skillAdvantage / 200;
  
  // Fatigue penalty
  const fatiguePenalty = (1 - player.stamina / 100) * 0.2;
  
  const prob = Math.max(0.1, Math.min(0.95, baseProb - fatiguePenalty));
  return Math.random() < prob;
}
```

### 9.4 Heading System

```typescript
// Aerial duel resolution
function resolveAerialDuel(attacker: Player, defender: Player, ball: BallState): AerialResult {
  const attackerReach = attacker.position.y + (attacker.stats.jumping / 100) * 0.8 + 1.85;
  const defenderReach = defender.position.y + (defender.stats.jumping / 100) * 0.8 + 1.85;
  const ballHeight = ball.position.y;
  
  const aWins = attackerReach > ballHeight && attackerReach > defenderReach;
  const dWins = defenderReach > ballHeight && defenderReach > attackerReach + 0.05;
  
  if (aWins) return { winner: attacker, type: 'ATTACKING_HEADER' };
  if (dWins) return { winner: defender, type: 'DEFENSIVE_HEADER' };
  return { winner: null, type: 'CONTESTED' };
}
```

### 9.5 Stamina & Fatigue

```typescript
// Runs every fixed tick per player
function updateStamina(player: Player, dt: number): void {
  const isRunning = player.velocity.length() > 4;    // 4 m/s threshold
  const isSprinting = player.velocity.length() > 7;
  
  const drain = isSprinting ? 0.08 :
                isRunning ? 0.02 : 0;
  
  const recovery = !isRunning ? 0.015 : 0;
  
  player.stamina = Math.max(0, Math.min(100, player.stamina - drain + recovery));
  
  // Fatigue effects on stats
  const fatigueFactor = player.stamina / 100;
  player.effectiveStats.sprintSpeed = player.stats.sprintSpeed * (0.7 + fatigueFactor * 0.3);
  player.effectiveStats.finishing = player.stats.finishing * (0.85 + fatigueFactor * 0.15);
}
```

---

## 10. CONTROLS & INPUT SYSTEM

### 10.1 Input Abstraction Layer

All input is abstracted so keyboard, gamepad (Xbox/PS/generic), and touch all map to the same logical actions.

```typescript
// src/lib/engine/input/input-map.ts
type Action =
  | 'PASS' | 'SHOOT' | 'SPRINT' | 'THROUGH_BALL' | 'LOFTED_PASS'
  | 'SKILL_MOVE' | 'FAKE_SHOT' | 'TACKLE' | 'HEADER' | 'SWITCH_PLAYER'
  | 'CALL_FOR_BALL' | 'PRESSURE' | 'CHANGE_PLAYER_MANUAL'
  | 'MENU_CONFIRM' | 'MENU_BACK' | 'PAUSE';

const GAMEPAD_MAP: Record<number, Action> = {
  0: 'PASS',           // A / Cross
  1: 'SHOOT',          // B / Circle
  2: 'THROUGH_BALL',   // X / Square
  3: 'LOFTED_PASS',    // Y / Triangle
  4: 'SWITCH_PLAYER',  // LB / L1
  5: 'PRESSURE',       // RB / R1
  6: 'TACKLE',         // LT / L2
  7: 'SPRINT',         // RT / R2
  8: 'PAUSE',          // Start / Options
};

const KEYBOARD_MAP: Record<string, Action> = {
  'Space': 'PASS',
  'Enter': 'SHOOT',
  'KeyF': 'THROUGH_BALL',
  'KeyC': 'LOFTED_PASS',
  'ShiftLeft': 'SPRINT',
  'KeyS': 'TACKLE',
  'KeyX': 'SKILL_MOVE',
  'Tab': 'SWITCH_PLAYER',
  'Escape': 'PAUSE',
};
```

### 10.2 Gamepad Support

```typescript
// src/lib/engine/input/gamepad.ts
class GamepadManager {
  private gamepads = new Map<number, Gamepad>();
  private deadzone = 0.12;
  
  poll(): GamepadState[] {
    return navigator.getGamepads()
      .filter(Boolean)
      .map(gp => ({
        id: gp.index,
        leftStick: this.applyDeadzone({ x: gp.axes[0], y: gp.axes[1] }),
        rightStick: this.applyDeadzone({ x: gp.axes[2], y: gp.axes[3] }),
        buttons: gp.buttons.map((b, i) => ({
          action: GAMEPAD_MAP[i],
          held: b.pressed,
          value: b.value  // Analog triggers (0–1) for sprint/shoot power
        }))
      }));
  }
  
  private applyDeadzone(stick: {x:number,y:number}) {
    const mag = Math.sqrt(stick.x**2 + stick.y**2);
    if (mag < this.deadzone) return { x: 0, y: 0 };
    const normalized = (mag - this.deadzone) / (1 - this.deadzone);
    return { x: (stick.x / mag) * normalized, y: (stick.y / mag) * normalized };
  }
}
```

### 10.3 Player Movement Controls

```typescript
// Translates stick input to player movement direction
// Camera-relative controls (stick up = toward opponent goal)
function computeMovementDirection(stick: Stick2D, cameraForward: Vector3): Vector3 {
  const cameraFlat = new Vector3(cameraForward.x, 0, cameraForward.z).normalize();
  const cameraRight = new Vector3().crossVectors(cameraFlat, Vector3.UP);
  
  const dir = new Vector3()
    .addScaledVector(cameraFlat, -stick.y)  // Forward = negative Z in world
    .addScaledVector(cameraRight, stick.x);
  
  return dir.normalize().multiplyScalar(stick.magnitude);
}
```

### 10.4 Advanced Controls Reference

| Input | Action | Notes |
|---|---|---|
| Left Stick | Move | Camera-relative |
| Right Stick | Manual camera / dribble stick | Context-sensitive |
| RT/R2 (hold) | Sprint | Drains stamina |
| A/Cross (tap) | Short pass / clear | Direction: left stick |
| A/Cross (hold) | Through ball charge | Hold = more weight |
| B/Circle (tap) | Low shot / quick finish | Power from hold time |
| B/Circle (hold) | Power shot | Release = shoot |
| Y/Triangle | Lofted ball / chip shot | Height from hold |
| X/Square | Skill move | Combo: RS direction |
| LB/L1 | Player switch | Nearest to ball |
| RB/R1 | Call for ball / pressure | Attack/defense |
| LT/L2 | Finesse modifier / contain | Context-sensitive |
| LS press | Fake shot | + directional |
| RS press | Cancel / turn | |
| D-Pad Up | Raise defensive line | Tactical quick-adjust |
| D-Pad Down | Drop defensive line | |
| D-Pad Left | Switch to offside trap | |
| D-Pad Right | Ultra-attacking | |

---

## 11. CAMERA SYSTEM

### 11.1 Camera Modes

```typescript
type CameraMode =
  | 'BROADCAST'        // Classic TV angle, follows play
  | 'TELE'             // Zoomed broadcast, close to action
  | 'END_TO_END'       // Wide pitch overview
  | 'PLAYER_LOCK'      // Follows controlled player
  | 'BALL_LOCK'        // Follows ball (cinematic)
  | 'TACTICAL'         // Top-down tactical view
  | 'GOAL_CELEBRATION' // Dynamic goal cam
  | 'REPLAY'           // Post-action multi-angle replay
  | 'DYNAMIC'          // Auto-switches based on match state
```

### 11.2 Broadcast Camera (Primary)

```typescript
class BroadcastCamera {
  private rig: CameraRig;
  private baseHeight = 22;      // meters above pitch
  private baseFOV = 55;         // degrees
  private tightFOV = 45;        // when play is compact
  
  update(ball: Vector3, matchState: MatchState, dt: number) {
    // Smooth follow of ball center of gravity
    const targetX = ball.x * 0.6; // Don't fully follow sideways
    const targetZ = 52;            // Fixed depth from touchline
    
    // FOV widens when play spreads
    const playWidth = this.computePlayWidth(matchState.players);
    const targetFOV = this.baseFOV + playWidth * 0.1;
    
    // Smoothly lerp position and FOV
    this.rig.position.x = lerp(this.rig.position.x, targetX, dt * 3);
    this.rig.fov = lerp(this.rig.fov, targetFOV, dt * 2);
    
    // Slight camera shake on big events
    if (matchState.recentEvent === 'GOAL') this.addShake(0.3, 1.2);
  }
}
```

### 11.3 Goal Celebration Camera

```typescript
class GoalCelebrationCamera {
  async play(scorer: Player, goalPosition: Vector3): Promise<void> {
    // Phase 1: Dramatic zoom into net (0.8s)
    await this.tweenTo({
      position: goalPosition.clone().add(new Vector3(0, 2, 6)),
      lookAt: goalPosition,
      fov: 30,
      duration: 0.8,
      easing: 'easeInOut'
    });
    
    // Phase 2: Pull back to show scorer celebration (1.5s)
    await this.tweenTo({
      position: scorer.position.clone().add(new Vector3(3, 2, 5)),
      lookAt: scorer.position,
      fov: 50,
      duration: 1.5,
    });
    
    // Phase 3: Follow scorer celebration (5s)
    // Camera orbits scorer while celebration plays
    this.orbitTarget = scorer;
    this.orbitRadius = 5;
    this.orbitSpeed = 0.3;
    await this.wait(5);
  }
}
```

### 11.4 Replay System

```typescript
class ReplayRecorder {
  private buffer: ReplayFrame[] = [];    // Ring buffer, last 30s
  private maxFrames = 60 * 30;           // 60fps × 30s
  
  record(state: MatchState): void {
    const frame: ReplayFrame = {
      timestamp: state.clock,
      ballPosition: state.ball.position.clone(),
      ballVelocity: state.ball.velocity.clone(),
      playerStates: state.players.map(p => ({
        position: p.position.clone(),
        rotation: p.rotation.clone(),
        animationState: p.animationState,
      }))
    };
    
    this.buffer.push(frame);
    if (this.buffer.length > this.maxFrames) this.buffer.shift();
  }
  
  // Play back from N seconds ago
  async playHighlight(fromSeconds: number): Promise<void> {
    const startIdx = Math.max(0, this.buffer.length - fromSeconds * 60);
    const frames = this.buffer.slice(startIdx);
    
    // Auto-select best camera angle based on event type
    const cameraSequence = this.generateCameraSequence(frames);
    await this.playback(frames, cameraSequence);
  }
}
```

---

## 12. ANIMATION SYSTEM

### 12.1 Animation State Machine

Built on Three.js `AnimationMixer` with a custom layered state machine:

```typescript
// Layer 0: Locomotion (walk/run/idle) — base layer, full body
// Layer 1: Upper body (ball interaction) — additive
// Layer 2: Facial expression — additive on head only

class PlayerAnimationController {
  private mixer: AnimationMixer;
  private locomotionState: LocomotionState = 'idle';
  private actionQueue: AnimationAction[] = [];
  
  update(player: Player, dt: number): void {
    // Locomotion: blend based on speed
    const speed = player.velocity.length();
    
    if (speed < 0.5) this.transitionTo('idle');
    else if (speed < 3.0) this.transitionTo('walk');
    else if (speed < 6.0) this.transitionTo('jog');
    else if (speed < 8.0) this.transitionTo('run');
    else this.transitionTo('sprint');
    
    // Direction blending (8-directional)
    const angle = Math.atan2(player.velocity.x, player.velocity.z);
    this.setDirectionalBlend(angle);
    
    // Dequeue and play ball interactions
    if (this.actionQueue.length > 0) {
      const action = this.actionQueue.shift()!;
      this.playAction(action);
    }
    
    this.mixer.update(dt);
  }
  
  // Smooth crossfade between states
  private transitionTo(state: string, duration = 0.15): void {
    if (this.locomotionState === state) return;
    const prevAction = this.actions.get(this.locomotionState);
    const nextAction = this.actions.get(state)!;
    nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
    nextAction.crossFadeFrom(prevAction!, duration, true);
    nextAction.play();
    this.locomotionState = state;
  }
}
```

### 12.2 Procedural IK

Foot IK ensures players don't float above uneven terrain:

```typescript
// Two-bone IK solver for foot placement
class FootIKSolver {
  solve(hip: Bone, knee: Bone, foot: Bone, targetPosition: Vector3): void {
    const upperLen = hip.position.distanceTo(knee.position);
    const lowerLen = knee.position.distanceTo(foot.position);
    const totalLen = upperLen + lowerLen;
    const dist = hip.position.distanceTo(targetPosition);
    
    if (dist > totalLen * 0.99) {
      // Fully extended — point toward target
      const dir = targetPosition.clone().sub(hip.position).normalize();
      this.orientChain(hip, knee, foot, dir);
      return;
    }
    
    // Law of cosines for knee angle
    const hipAngle = Math.acos(
      (upperLen**2 + dist**2 - lowerLen**2) / (2 * upperLen * dist)
    );
    
    // Apply rotations
    this.applyIKRotations(hip, knee, foot, targetPosition, hipAngle);
  }
}
```

### 12.3 Ball-Player Synchronization

Critical: the ball and player animation must be synchronized — the ball must visually leave the foot at the exact frame where the kick animation triggers:

```typescript
class KickSynchronizer {
  getKickFrameOffset(animation: string): number {
    // Per-animation: frame index where foot contacts ball
    const contactFrames: Record<string, number> = {
      'shot_power': 18,        // frame 18/30
      'pass_short': 12,
      'pass_long': 22,
      'cross_ground': 15,
      'volley': 20,
      'header': 14,
    };
    return contactFrames[animation] ?? 15;
  }
  
  scheduleKick(player: Player, animation: string, shot: ShotResult): void {
    const contactFrame = this.getKickFrameOffset(animation);
    const contactTime = contactFrame / 30; // assuming 30fps animation
    
    setTimeout(() => {
      // Apply force to ball at exact contact moment
      this.physicsWorld.applyImpulse(this.ballBody, shot.impulse);
    }, contactTime * 1000);
  }
}
```

---

## 13. FOUL, REFEREE & DISCIPLINARY SYSTEM

### 13.1 Foul Detection

```typescript
// Runs every physics tick
class RefereeSystem {
  private readonly FOUL_VELOCITY_THRESHOLD = 4.0;  // m/s relative velocity
  private readonly LATE_TACKLE_WINDOW = 0.3;        // seconds after ball played
  
  detectFouls(players: Player[], ball: BallState): FoulEvent[] {
    const fouls: FoulEvent[] = [];
    
    for (const player of players) {
      for (const opponent of players) {
        if (player.teamId === opponent.teamId) continue;
        if (!this.areColliding(player, opponent)) continue;
        
        const severity = this.assessFoul(player, opponent, ball);
        if (severity !== 'NONE') {
          fouls.push({ offender: player, victim: opponent, severity, position: opponent.position });
        }
      }
    }
    
    return fouls;
  }
  
  private assessFoul(tackler: Player, victim: Player, ball: BallState): FoulSeverity {
    const ballProximity = ball.position.distanceTo(victim.position);
    const relativeVelocity = tackler.velocity.clone().sub(victim.velocity).length();
    const fromBehind = this.isTackleFromBehind(tackler, victim);
    const dangerousHeight = tackler.footPosition.y > 0.5; // studs up
    const lateTackle = this.isLateTackle(tackler, ball);
    
    // Dangerous/reckless → red card
    if (dangerousHeight && fromBehind) return 'RED';
    if (relativeVelocity > 8.0 && fromBehind) return 'RED';
    
    // Careless but not malicious → yellow
    if (fromBehind && relativeVelocity > FOUL_VELOCITY_THRESHOLD) return 'YELLOW';
    if (lateTackle && relativeVelocity > 5.0) return 'YELLOW';
    
    // Regular foul
    if (relativeVelocity > FOUL_VELOCITY_THRESHOLD && ballProximity > 0.5) return 'FOUL';
    
    // Advantage — referee plays on
    if (victim.team.hasAdvantage()) return 'ADVANTAGE';
    
    return 'NONE';
  }
}
```

### 13.2 Referee Personality

Each referee has a personality profile affecting decisions:

```typescript
interface RefereeProfile {
  name: string;
  strictness: number;       // 0–1: how quick to card
  advantageUsage: number;   // 0–1: how often plays advantage
  homeTeamBias: number;     // -0.1 to +0.1 (subtle)
  varUsage: boolean;        // Reviews borderline decisions with VAR simulation
}
```

### 13.3 VAR System

```typescript
class VARSystem {
  async reviewDecision(incident: Incident, matchState: MatchState): Promise<VARVerdict> {
    // Trigger VAR review animation (screen lines)
    this.showVARLines(incident);
    
    await this.delay(3000 + Math.random() * 5000); // 3–8s review
    
    // Recompute from replay frames
    const verdict = this.analyzeFromMultipleAngles(incident, matchState.replayBuffer);
    
    if (verdict.overturned) {
      this.eventBus.emit({ type: 'VAR_OVERTURN', original: incident.decision, new: verdict.decision });
    }
    
    return verdict;
  }
}
```

### 13.4 Set Piece System

**Free Kicks:**
```typescript
class FreekickSetup {
  computeWallPosition(ballPos: Vector3, targetGoal: Vector3): Vector3[] {
    const dirToGoal = targetGoal.clone().sub(ballPos).normalize();
    const wallDist = 9.15; // regulation
    const wallCenter = ballPos.clone().add(dirToGoal.multiplyScalar(wallDist));
    
    // 3–5 defenders in wall based on danger zone
    const wallCount = this.computeWallSize(ballPos, targetGoal);
    return this.distributeWall(wallCenter, dirToGoal, wallCount);
  }
  
  setupWallBreakingKick(kick: FreekickKick): ShotResult {
    // Over-wall: high loft angle + backspin to dip
    // Around wall: heavy sidespin
    // Through gap: low flat driven
    return this.shotSystem.computeSpecialShot(kick);
  }
}
```

**Corners:**
- Near-post flick-on
- Far-post delivery
- Short corner variation
- In-swinging / out-swinging based on corner position
- Set-piece routines: pre-designed runner paths (3–5 patterns per team)

**Penalties:**
```typescript
class PenaltyShootout {
  async takePenalty(taker: Player, goalkeeper: Player): Promise<PenaltyResult> {
    // Taker: choose direction (left stick) + power (button hold)
    // GK: dive direction chosen 300ms before contact
    
    const takerChoice = await this.getPlayerInput('SHOOT', 5000);
    const gkDive = await this.getGKDecision(goalkeeper, 300); // must decide early
    
    const shot = this.computePenaltyShot(taker, takerChoice);
    const save = this.computeSave(goalkeeper, gkDive, shot);
    
    return { scored: !save.success, power: shot.power, direction: shot.direction };
  }
}
```

---

## 14. SCORE, MATCH & COMPETITION MANAGEMENT

### 14.1 Match Manager

```typescript
class MatchManager {
  state: MatchState = {
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    addedTime: { firstHalf: 0, secondHalf: 0 },
    phase: 'PRE_MATCH',
    events: [],    // Full event log for match report
    stats: {
      possession: [50, 50],
      shots: [0, 0],
      shotsOnTarget: [0, 0],
      corners: [0, 0],
      fouls: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      passes: [0, 0],
      passAccuracy: [100, 100],
      tackles: [0, 0],
      headers: [0, 0],
      offsides: [0, 0],
    }
  };
  
  addGoal(scorer: Player, assistBy: Player | null): void {
    const team = scorer.teamId === 0 ? 'home' : 'away';
    this.state[`${team}Score`]++;
    
    const event: GoalEvent = {
      type: 'GOAL',
      minute: this.state.minute,
      scorer: scorer.id,
      scorerName: scorer.name,
      assist: assistBy?.id ?? null,
      assistName: assistBy?.name ?? null,
      teamId: scorer.teamId,
      ownGoal: false,
    };
    
    this.state.events.push(event);
    this.eventBus.emit(event);
    
    // Trigger: celebration, commentary, score HUD update
  }
  
  computeAddedTime(half: 1 | 2): number {
    // Based on: substitutions × 0.5min, VAR reviews × 1.5min, injuries × 2min, goals × 0.5min
    const base = 1 + Math.floor(Math.random() * 3);
    const substitutions = this.state.events.filter(e => 
      e.type === 'SUBSTITUTION' && e.half === half
    ).length;
    return base + Math.floor(substitutions * 0.5);
  }
}
```

### 14.2 Match Statistics Engine

All stats tracked in real-time with spatial metadata:

```typescript
interface MatchStats {
  possession: number[];        // [home%, away%]
  shots: Shot[];               // With position, power, outcome
  heatmap: Float32Array;       // 68×44 grid, intensity values
  passNetwork: PassEdge[];     // Directed graph of passes
  pressureMap: Float32Array;   // Where each team applies pressure
  xG: number[];                // Expected goals per team
  ppda: number[];              // Passes allowed per defensive action
}

// xG model: logistic regression trained on shot position + type
function computeXG(shot: Shot): number {
  const distanceFromGoal = shot.position.distanceTo(GOAL_CENTER);
  const angle = computeShootingAngle(shot.position);
  const isHeader = shot.type === 'header';
  const bigChance = shot.pressureLevel < 0.2;
  
  // Simplified logistic model
  const logit = -3.19
    + (-0.095 * distanceFromGoal)
    + (0.018 * angle)
    + (isHeader ? -0.4 : 0)
    + (bigChance ? 0.6 : 0);
  
  return 1 / (1 + Math.exp(-logit));
}
```

---

## 15. FORMATION & TACTICAL SYSTEM

### 15.1 Formation Definitions

```typescript
// All positions defined as relative coordinates [0–1] on half-pitch
const FORMATIONS: Record<string, Formation> = {
  '4-4-2': {
    name: '4-4-2 Classic',
    slots: [
      { role: 'GK',  relPos: [0.5, 0.05] },
      { role: 'LB',  relPos: [0.1, 0.25] },
      { role: 'CB',  relPos: [0.33, 0.2] },
      { role: 'CB',  relPos: [0.67, 0.2] },
      { role: 'RB',  relPos: [0.9, 0.25] },
      { role: 'LM',  relPos: [0.1, 0.55] },
      { role: 'CM',  relPos: [0.35, 0.5] },
      { role: 'CM',  relPos: [0.65, 0.5] },
      { role: 'RM',  relPos: [0.9, 0.55] },
      { role: 'ST',  relPos: [0.35, 0.82] },
      { role: 'ST',  relPos: [0.65, 0.82] },
    ]
  },
  '4-3-3': { /* ... */ },
  '4-2-3-1': { /* ... */ },
  '3-5-2': { /* ... */ },
  '5-3-2': { /* ... */ },
  '4-1-4-1': { /* ... */ },
  '4-5-1': { /* ... */ },
  '3-4-3': { /* ... */ },
  '4-3-2-1': { /* ... */ },   // Christmas tree
};
```

### 15.2 Dynamic Formation Adjustment

```typescript
// Formation morphs based on phase of play
class FormationController {
  getPositionalTarget(player: Player, ballPosition: Vector3, phase: GamePhase): Vector3 {
    const basePos = this.getFormationSlot(player.tacticSlot);
    
    // Stretch formation toward ball (compact = tighter, stretched = wider)
    const ballInfluence = this.team.tactic.compactness;
    const ballOffset = ballPosition.clone().sub(new Vector3(0.5, 0, 0.5));
    
    const adjustedPos = basePos.clone().addScaledVector(ballOffset, ballInfluence * 0.3);
    
    // Attack phase: push all lines up
    if (phase === 'ATTACK') {
      adjustedPos.z += this.team.tactic.attackingLineHeight;
    }
    
    // Defense phase: drop deep, maintain shape
    if (phase === 'DEFENSE') {
      adjustedPos.z -= this.team.tactic.defensiveDepth;
    }
    
    return this.clampToPlayingArea(adjustedPos);
  }
}
```

### 15.3 Tactical Instructions

```typescript
interface TacticsConfig {
  // Pressing
  pressingIntensity: 'low' | 'medium' | 'high' | 'gegenpress';
  pressTrigger: 'always' | 'ball-lost' | 'goalkeeper';
  
  // Defense
  defensiveLine: 'low' | 'medium' | 'high';
  markingType: 'zonal' | 'man' | 'hybrid';
  offsideTrap: boolean;
  
  // Attack
  buildUpPlay: 'short' | 'long' | 'mixed';
  attackWidth: 'narrow' | 'normal' | 'wide';
  playersInBox: 'few' | 'balanced' | 'many';
  
  // Player instructions (per player)
  playerInstructions: Map<EntityId, PlayerInstruction>;
}

interface PlayerInstruction {
  // Attacking
  getInBehind: boolean;
  comeShort: boolean;
  stayWide: boolean;
  cutInside: boolean;
  
  // Defensive
  trackBack: boolean;
  markTightlyOn: EntityId | null;
  holdPosition: boolean;
}
```

---

## 16. SUBSTITUTION & SQUAD MANAGEMENT

### 16.1 In-Game Substitution UI

Triggered by pause menu → Substitutions panel (shadcn-svelte Dialog).

```typescript
class SubstitutionManager {
  private maxSubs = 5;
  private usedSubs = 0;
  private subWindows = 2; // Only 2 windows in 90 min (3rd allowed in ET)
  
  canSubstitute(teamId: number, minute: number): boolean {
    if (this.usedSubs >= this.maxSubs) return false;
    // No subs in final 5 min unless injury (enforced by referee)
    return true;
  }
  
  executeSubstitution(off: Player, on: Player, newFormationSlot?: number): void {
    // Fade out player (walk to touchline animation)
    // Fade in sub (run onto pitch)
    // Inherit: tactical slot, stamina = 100, form rating carries over
    on.tacticSlot = newFormationSlot ?? off.tacticSlot;
    on.stamina = 100;
    
    this.usedSubs++;
    this.eventBus.emit({ type: 'SUBSTITUTION', off: off.id, on: on.id, teamId: off.teamId, minute: this.match.minute });
  }
}
```

### 16.2 Squad Builder UI

Full squad management screen with:
- Formation selector (visual interactive pitch diagram)
- Drag-and-drop player assignment
- Chemistry indicator (players familiar with each other)
- Player condition (fit / knock / unavailable)
- Kit selection per position

---

## 17. COMMENTARY SYSTEM

### 17.1 Architecture

Triple-AAA commentary delivered via a **pre-recorded audio bank + real-time selection engine** that feels dynamic and contextual.

```typescript
class CommentaryEngine {
  private activeCommentators: [Commentator, Commentator]; // Lead + analyst
  private lastSpokenMinute = -2;
  private recentEvents: string[] = [];
  
  // Trigger commentary on events
  onEvent(event: GameEvent): void {
    const line = this.selectLine(event);
    if (!line) return;
    
    this.addedDelay = this.computeNaturalDelay(event.type);
    setTimeout(() => this.speak(line), this.addedDelay);
  }
  
  selectLine(event: GameEvent): CommentaryLine | null {
    const candidates = this.lineBank
      .filter(l => l.triggers.includes(event.type))
      .filter(l => !this.recentlyUsed(l))
      .filter(l => l.condition?.(event, this.matchState) ?? true);
    
    // Weight by: context match, how long since last used, event importance
    return this.weightedSelect(candidates);
  }
}
```

### 17.2 Commentary Line Bank Categories

```typescript
type CommentaryTrigger =
  // Goals
  | 'GOAL'
  | 'GOAL_HEADER'
  | 'GOAL_VOLLEY'
  | 'GOAL_LONG_RANGE'
  | 'GOAL_FREE_KICK'
  | 'GOAL_PENALTY'
  | 'GOAL_OWN'
  | 'GOAL_EQUALIZER'
  | 'GOAL_LATE'           // 85th minute+
  | 'GOAL_WINNER'
  | 'GOAL_BICYCLE_KICK'
  
  // Near misses
  | 'POST_HIT'
  | 'BAR_HIT'
  | 'INCREDIBLE_MISS'
  | 'GREAT_SAVE'
  | 'SAVE_POINT_BLANK'
  
  // Discipline
  | 'FOUL'
  | 'DANGEROUS_TACKLE'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'SECOND_YELLOW'
  
  // Set pieces
  | 'CORNER'
  | 'FREE_KICK_DANGEROUS'
  | 'FREE_KICK_CLEARED'
  | 'PENALTY_AWARDED'
  | 'PENALTY_SCORED'
  | 'PENALTY_MISSED'
  | 'PENALTY_SAVED'
  
  // General
  | 'KICKOFF'
  | 'HALF_TIME'
  | 'FULL_TIME'
  | 'SUBSTITUTION'
  | 'OFFSIDE'
  | 'VAR_REVIEW'
  | 'COUNTER_ATTACK'
  | 'POSSESSION_PERIOD'    // 60s of same-team possession
  | 'SKILL_MOVE'
  | 'PLAYER_THROUGH_ON_GOAL'
  | 'CROWD_ERUPTION'
  | 'INJURY'
  | 'EXTRA_TIME'
  | 'PENALTIES_ANNOUNCED';
```

### 17.3 Dynamic Name/Stat Insertion

Commentary lines use tokens that are filled at runtime:

```
"What a goal from {SCORER_NAME}! His {STAT_GOALS}th of the season!"
"Assisted by the impressive {ASSIST_NAME} — {ASSIST_ASSISTS} assists now."
"The {MATCH_MINUTE} minute — and {LOSING_TEAM} are running out of time."
```

### 17.4 Commentary Audio Production Spec

For production, commentary is pre-recorded by 2 professional commentators (lead + analyst) with the following format:
- 2,500+ unique lines per commentator
- All player names spoken individually (recorded as phoneme banks → stitched)
- Emotional variations: calm, excited, screaming (for goals)
- Ambient: stadium noise ducked when commentary speaks
- Mixing: -14 LUFS target, sidechained to crowd audio

---

## 18. CELEBRATION SYSTEM

### 18.1 Celebration Library

```typescript
type Celebration =
  | 'ARMS_OUT'          // Classic run with arms spread
  | 'KNEE_SLIDE'        // Sliding on knees (grass stain!)
  | 'SHIRT_OFF'         // → automatic yellow card
  | 'SHUSH'             // Finger to lips (provoke opponent fans)
  | 'PHONE_CAMERA'      // Pull out imaginary phone
  | 'BACKFLIP'          // Athletic (high skill stat required)
  | 'ROBOT_DANCE'       // Quirky dance
  | 'HEART_HANDS'       // Heart with both hands
  | 'TEAM_PILE_ON'      // All nearby players join — crowd favourite
  | 'SOMBRERO'          // Iconic hat celebration
  | 'BENCH_RUN'         // Sprint to bench, hug staff
  | 'CORNER_FLAG'       // Run to corner flag
  | 'CROUCH_EXPLODE'    // Crouch → spring up arms wide
  | 'MUSCLE_FLEX'       // Bicep curl pose
  | 'PENALTY_BOX_SLIDE' // Slide into penalty box
  | 'PANENKA_POINT'     // Only after Panenka chip penalty
  | 'SKIP_DANCE'        // Playful skip
  | 'GOALKEEPER_SPRINT' // GK runs full pitch after rare goal
  | 'LATE_WINNER_FRENZY'// Special wild animation for 90th+ min winners
```

### 18.2 Celebration Triggers

```typescript
class CelebrationDirector {
  selectCelebration(scorer: Player, event: GoalEvent): Celebration {
    // Late winner = always LATE_WINNER_FRENZY
    if (event.minute >= 88 && this.isWinner(event)) return 'LATE_WINNER_FRENZY';
    
    // GK goal = always GOALKEEPER_SPRINT
    if (scorer.role === 'GK') return 'GOALKEEPER_SPRINT';
    
    // Panenka = special celebration
    if (event.shotType === 'PANENKA') return 'PANENKA_POINT';
    
    // Player-assigned celebration (configurable in squad menu)
    if (scorer.assignedCelebration) return scorer.assignedCelebration;
    
    // Random weighted by personality
    return this.weightedRandom(scorer.personality);
  }
  
  async playCelebration(scorer: Player, celebration: Celebration): Promise<void> {
    // Nearest 3 teammates run toward scorer
    const teammates = this.getNearestTeammates(scorer, 3);
    
    await Promise.all([
      this.animateScorer(scorer, celebration),
      ...teammates.map(t => this.animateTeammateJoin(t, scorer.position)),
    ]);
    
    // After 6s: walk back to halfway line
    await this.returnToKickoff([scorer, ...teammates]);
  }
}
```

---

## 19. AUDIO ARCHITECTURE

### 19.1 Audio Layers

```typescript
// Web Audio API graph
const ctx = new AudioContext();

// Layer 1: Commentary (mono, centred, ducked over crowd)
const commentaryGain = ctx.createGain(); // 0.9 base
const commentaryCompressor = ctx.createDynamicsCompressor();

// Layer 2: Crowd (stereo, spatialised L/R for home/away sections)
const crowdGain = ctx.createGain(); // 0.7 base, 0.2 when commentary speaks
const crowdAnalyser = ctx.createAnalyser();

// Layer 3: Match SFX (3D spatial audio — ball kick, boot squeak, tackle)
const sfxPanner = ctx.createPannerNode();
sfxPanner.panningModel = 'HRTF';
sfxPanner.distanceModel = 'inverse';

// Layer 4: Stadium ambience (constant loop — rain, wind, general hum)
const ambienceGain = ctx.createGain(); // 0.3 constant

// Layer 5: Music (menus only, fades when match loads)
const musicGain = ctx.createGain();
```

### 19.2 Crowd Simulation

```typescript
class CrowdSimulator {
  private crowdState: 'neutral' | 'excited' | 'tense' | 'celebrating' | 'booing' = 'neutral';
  
  onEvent(event: GameEvent): void {
    switch (event.type) {
      case 'GOAL':
        if (event.teamId === this.homeTeamId) {
          this.erupt('GOAL_HOME', 8.0); // 8s of roar
        } else {
          this.playGroan(3.0);
          this.playAwayFansCheer(4.0);
        }
        break;
      case 'SAVE':
        this.playGasp(1.5);
        break;
      case 'FREEKICK':
        if (this.isDangerousPosition(event.position)) {
          this.buildTension(2.0); // Rising hum
        }
        break;
    }
  }
  
  // Crowd volume ties to match excitement level
  update(matchState: MatchState): void {
    const excitement = this.computeExcitement(matchState);
    this.crowdGain.gain.setTargetAtTime(0.4 + excitement * 0.5, this.ctx.currentTime, 0.5);
  }
}
```

### 19.3 Ball & Match SFX

| Event | Sound | Notes |
|---|---|---|
| Boot contact (pass) | `kick_short_*.wav` × 6 variants | Pitch = power |
| Boot contact (shot) | `kick_power_*.wav` × 4 | High frequency, snap |
| Header | `header_*.wav` × 3 | Dull thud |
| Ball on post | `post_*.wav` × 2 | Metallic ring |
| Ball on crossbar | `crossbar_*.wav` × 2 | Different frequency |
| Tackle | `tackle_*.wav` × 4 | Impact + thud |
| Goalkeeper catch | `catch_*.wav` × 3 | Leather + grip |
| Whistle | `whistle_*.wav` × 3 | Short / long / penalty |
| Crowd roar | `crowd_roar_*.wav` × 6 | Layered, spatialised |
| Net ripple | `net_*.wav` × 3 | Goal! |

---

## 20. GAME MODES

### 20.1 Kick Off (Exhibition)

- Quick match: choose two teams, formation, difficulty
- Weather/time-of-day selection
- Editable match length (5/15/30/45/90 min halves)
- Local 1v1 (split controller) or 1 vs CPU

### 20.2 Career Mode

```typescript
interface CareerMode {
  type: 'manager' | 'player';
  seasons: SeasonRecord[];
  currentSeason: number;
  userTeam: TeamId;
  
  // Manager
  transferBudget: number;
  wageBudget: number;
  boardObjectives: Objective[];
  
  // Player career
  controlledPlayerId: PlayerId;
  careerStats: PlayerCareerStats;
}
```

Features:
- Multi-season progression
- Player development arcs (youngsters peak, veterans decline)
- Transfer windows (AI-driven offers)
- Injury system (0–12 week recovery)
- Staff management (coach, physio, scout ratings)
- Stadium expansion (budget-dependent)
- Youth academy (produce wonderkids)

### 20.3 Tournament Mode

- Custom cup bracket (any number of teams, 2–64)
- Round robin group stage + knockout
- Historical competitions (Community Shield, Champions League format)
- All fixtures, results, and standings persisted in IndexedDB

### 20.4 Penalty Shootout

- Standalone 5-kick + sudden death
- Full animation and GK AI

### 20.5 Training Mode

- Shooting practice (static, moving ball)
- Passing drills (mannequins)
- Dribbling slalom
- Free kick practice (adjustable wall)
- Skills practice arena

### 20.6 Local Multiplayer

See Section 22.

---

## 21. OFFLINE LEAGUE & TOURNAMENT ENGINE

### 21.1 League Simulation

```typescript
class LeagueEngine {
  async simulateMatchday(matchday: number): Promise<MatchResult[]> {
    const fixtures = this.season.fixtures[matchday];
    const results: MatchResult[] = [];
    
    for (const fixture of fixtures) {
      if (fixture.isUserMatch) {
        // Queue for human play
        results.push({ fixture, status: 'AWAITING_PLAY' });
      } else {
        // Simulate AI match
        const result = await this.simulateMatch(fixture.home, fixture.away);
        results.push(result);
      }
    }
    
    return results;
  }
  
  // AI match simulation (no graphics, instant result)
  simulateMatch(home: Team, away: Team): MatchResult {
    // Monte Carlo model: 1000 micro-events per match
    // Each event: shot probability, save probability, goal probability
    const homeXG = this.computeTeamXG(home, 'home') + Math.random() * 0.5;
    const awayXG = this.computeTeamXG(away, 'away') + Math.random() * 0.5;
    
    const homeGoals = this.samplePoisson(homeXG);
    const awayGoals = this.samplePoisson(awayXG);
    
    return {
      home: { team: home, score: homeGoals },
      away: { team: away, score: awayGoals },
      events: this.generateMatchEvents(home, away, homeGoals, awayGoals),
    };
  }
}
```

### 21.2 League Table

```typescript
interface LeagueTable {
  teams: TeamStanding[];
  season: number;
  
  // Full European rules: GD → Goals For → H2H
  sort(): TeamStanding[] {
    return this.teams.sort((a, b) =>
      b.points - a.points ||
      (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor ||
      this.headToHead(a, b)
    );
  }
}
```

### 21.3 Player Development

```typescript
// Players grow and decline based on age + performance
function updatePlayerStats(player: Player, season: SeasonPerformance): void {
  const age = player.age;
  const peakAge = 27;
  
  // Growth window: 16–24
  // Peak: 24–30
  // Decline: 30+
  const growthFactor = age < peakAge
    ? (1 + (peakAge - age) * 0.003)    // Young: grow 0.3%/year per stat
    : (1 - (age - peakAge) * 0.006);   // Old: decline 0.6%/year
  
  // Form affects growth
  const formBonus = (season.rating - 6.5) * 0.002;
  
  for (const stat of GROWABLE_STATS) {
    player.stats[stat] = Math.round(
      Math.max(40, Math.min(99, player.stats[stat] * (growthFactor + formBonus)))
    );
  }
  
  player.age++;
}
```

---

## 22. LOCAL MULTIPLAYER

### 22.1 Controller Assignment

```typescript
class MultiplayerManager {
  assignControllers(): void {
    const gamepads = navigator.getGamepads().filter(Boolean);
    
    // First gamepad → Player 1 (home team)
    // Second gamepad → Player 2 (away team)
    // Keyboard → fallback for Player 1
    
    this.player1Input = gamepads[0] ? 'gamepad:0' : 'keyboard';
    this.player2Input = gamepads[1] ? 'gamepad:1' : null; // null = CPU
  }
}
```

### 22.2 Split-Screen (Optional)

For 2-player on same screen: canvas splits horizontally/vertically. Each half renders from that team's broadcast angle.

```typescript
// Two render targets, two camera instances, rendered side by side
class SplitScreenRenderer {
  renderFrame(scene: Scene, state: MatchState): void {
    // Left half — Player 1 camera
    this.renderer.setViewport(0, 0, width/2, height);
    this.renderer.render(scene, this.camera1);
    
    // Right half — Player 2 camera
    this.renderer.setViewport(width/2, 0, width/2, height);
    this.renderer.render(scene, this.camera2);
    
    // Centre divider line
    this.renderDivider();
  }
}
```

---

## 23. UI/UX ARCHITECTURE

### 23.1 UI Layers

All UI outside the 3D canvas is pure Svelte 5 + Tailwind CSS v4 + shadcn-svelte, positioned absolutely over the canvas.

```
<canvas id="game-canvas" />                    ← Three.js renders here
<div id="hud-layer">                           ← Match HUD (z-index: 10)
  <ScoreBar />
  <MinuteClock />
  <TeamFormationIndicator />
  <EventToast />                               ← Goal/card notifications
</div>
<div id="pause-layer">                         ← Pause menu (z-index: 20)
  <PauseMenu />
  <SubstitutionPanel />
  <TacticsPanel />
</div>
<div id="ui-layer">                            ← Menus (z-index: 30)
  <MainMenu />
  <TeamSelector />
  <LeagueBrowser />
</div>
```

### 23.2 HUD Design

```svelte
<!-- src/lib/ui/hud/ScoreBar.svelte -->
<script lang="ts">
  import { matchStore } from '$lib/game/match/match-store.svelte';
  const { homeScore, awayScore, minute, addedTime, homeTeam, awayTeam } = $derived(matchStore);
</script>

<div class="score-bar">
  <!-- Home team -->
  <div class="team home">
    <img class="badge" src={homeTeam.badge} alt={homeTeam.name} />
    <span class="name">{homeTeam.shortName}</span>
  </div>
  
  <!-- Score -->
  <div class="score-display">
    <span class="score">{homeScore}</span>
    <span class="divider">:</span>
    <span class="score">{awayScore}</span>
  </div>
  
  <!-- Time -->
  <div class="time">
    <span class="minute">{minute}'</span>
    {#if addedTime > 0}
      <span class="added">+{addedTime}</span>
    {/if}
  </div>
  
  <!-- Away team -->
  <div class="team away">
    <span class="name">{awayTeam.shortName}</span>
    <img class="badge" src={awayTeam.badge} alt={awayTeam.name} />
  </div>
</div>
```

### 23.3 Main Menu

Dark, cinematic aesthetic. Full-screen stadium background (animated Three.js scene — empty stadium at night, floodlights flickering on). Menu items slide in from bottom.

### 23.4 Tactical Pause Screen

Real-time formation drag-and-drop:
- Interactive pitch SVG overlay
- Player bubbles draggable to new positions
- Formation preset quick-select row
- Player instruction modal (tap player → instruction panel)

---

## 24. DATA LAYER & PERSISTENCE

### 24.1 IndexedDB Schema (Dexie.js)

```typescript
// src/lib/data/db.ts
import Dexie from 'dexie';

class ElevenDB extends Dexie {
  teams!: Table<Team>;
  players!: Table<Player>;
  leagues!: Table<League>;
  seasons!: Table<Season>;
  matches!: Table<MatchRecord>;
  careers!: Table<CareerState>;
  settings!: Table<Settings>;
  kits!: Table<KitDefinition>;
  
  constructor() {
    super('ElevenJS');
    this.version(1).stores({
      teams: '++id, name, leagueId',
      players: '++id, name, teamId, nationality, position',
      leagues: '++id, name, country',
      seasons: '++id, leagueId, year',
      matches: '++id, homeTeamId, awayTeamId, seasonId, played',
      careers: '++id, userId, teamId, currentSeason',
      settings: '++id, key',
      kits: '++id, teamId, type',
    });
  }
}

export const db = new ElevenDB();
```

### 24.2 Team & Player Data

Bundled as JSON (no server required):
- 30 leagues × 20 teams × 25 players = 15,000 base players
- All data: name, age, nationality, position, stats (0–99), contract, value, preferred foot
- Kit data: primary/secondary colours, badge SVG paths, pattern type

### 24.3 Save System

```typescript
// Auto-save after every match, every 5 minutes in career mode
class SaveManager {
  async quickSave(state: GameState): Promise<void> {
    await db.careers.put({
      ...state,
      savedAt: Date.now(),
      version: SAVE_VERSION,
    });
  }
  
  // Export save as JSON blob for cross-device portability
  async exportSave(careerId: number): Promise<Blob> {
    const career = await db.careers.get(careerId);
    return new Blob([JSON.stringify(career)], { type: 'application/json' });
  }
}
```

---

## 25. PERFORMANCE TARGETS & OPTIMISATION

### 25.1 Budgets

| System | Budget |
|---|---|
| Rendering (GPU) | 10ms/frame (60fps) |
| Physics (Worker) | 4ms/tick |
| AI (Worker) | 3ms/tick |
| Main thread JS | < 4ms/frame |
| VRAM total | < 2GB |
| JS heap | < 512MB |
| Network (initial) | < 2MB JS bundle |

### 25.2 Instanced Rendering

All 22 player meshes use a single `InstancedMesh`:
```typescript
const playerMesh = new InstancedMesh(playerGeometry, playerMaterial, 22);
// Per-instance: transform matrix + custom attribute (kit colour, number)
```

### 25.3 Level of Detail

```typescript
const playerLOD = new LOD();
playerLOD.addLevel(highPolyMesh, 0);    // < 20m from camera
playerLOD.addLevel(midPolyMesh, 20);    // 20–50m
playerLOD.addLevel(lowPolyMesh, 50);    // > 50m
playerLOD.addLevel(billboardMesh, 80);  // > 80m (corner players)
```

### 25.4 Texture Streaming

Textures loaded progressively:
1. 256px placeholder → immediate
2. 512px low → after 100ms
3. 2048px full → after asset cache hit

### 25.5 Web Worker Data Transfer

Use `SharedArrayBuffer` for zero-copy physics state transfer between worker and main thread:

```typescript
// SharedArrayBuffer layout for all 22 players + ball
// [0–87]: player positions (22 × 4 floats × 3 components)
// [88–109]: player rotations (22 × 4 components quaternion)
// [110–113]: ball position
// [114–116]: ball velocity
const sharedBuffer = new SharedArrayBuffer(4 * (88 + 22 + 4 + 3));
const physicsView = new Float32Array(sharedBuffer);
```

### 25.6 Service Worker Asset Caching

```javascript
// static/sw.js
const STATIC_CACHE = 'eleven-static-v1';
const ASSET_CACHE = 'eleven-assets-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      cache.addAll(['/app.html', '/game.js', '/game.css'])
    )
  );
});

self.addEventListener('fetch', event => {
  // Cache-first for GLB assets
  if (event.request.url.match(/\.(glb|hdr|ktx2|webp)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => 
        cached ?? fetch(event.request).then(response => {
          caches.open(ASSET_CACHE).then(c => c.put(event.request, response.clone()));
          return response;
        })
      )
    );
  }
});
```

---

## 26. ROADMAP & PHASED DELIVERY

### Phase 1 — Engine Foundation (Months 1–3)
- [ ] SvelteKit + Threlte scaffold, WebGPU renderer
- [ ] Rapier physics: ball + 22 player colliders
- [ ] Basic locomotion AI (players move to positions)
- [ ] Simple pass/shoot controls
- [ ] Basic stadium (no crowd)
- [ ] Score tracking, half-time, full-time

### Phase 2 — Core Gameplay (Months 3–6)
- [ ] Full AI behavior trees
- [ ] Animation system (all locomotion + ball interactions)
- [ ] Goalkeeper AI + save animations
- [ ] Foul detection + basic referee
- [ ] All camera modes
- [ ] Commentary audio bank (500 lines)
- [ ] Full PBR rendering (skin SSS, kit shader)

### Phase 3 — Modes & Depth (Months 6–9)
- [ ] Offline league engine (Dexie persistence)
- [ ] Career mode (manager)
- [ ] Substitutions + tactics panel
- [ ] Celebration system (10 celebrations)
- [ ] VAR system
- [ ] Penalties + extra time
- [ ] Commentary expanded (2000 lines)
- [ ] Crowd simulation

### Phase 4 — Polish & AAA Quality (Months 9–12)
- [ ] Motion capture animation upgrades
- [ ] WebGPU compute shaders for grass/crowd
- [ ] Full post-processing stack (bloom, DOF, LUT)
- [ ] 15,000 player database
- [ ] Kit editor
- [ ] Training modes
- [ ] Audio mix mastering
- [ ] Performance profiling + LOD tuning
- [ ] Service Worker offline caching
- [ ] PWA packaging

### Phase 5 — Online (Post v1.0)
- [ ] WebRTC peer-to-peer multiplayer
- [ ] Online ranked matches
- [ ] Transfer market API
- [ ] Live score integration

---

## 27. THIRD-PARTY LIBRARIES & LICENCES

| Library | Purpose | Licence |
|---|---|---|
| `three` r170+ | 3D rendering engine | MIT |
| `@threlte/core` 8.x | Svelte ↔ Three.js bridge | MIT |
| `@threlte/extras` | Helpers, GLTF loader, post-processing | MIT |
| `@dimforge/rapier3d-compat` | Physics WASM | Apache 2.0 |
| `postprocessing` (pmndrs) | Post-process effects | MIT |
| `dexie` | IndexedDB wrapper | Apache 2.0 |
| `howler.js` | Advanced audio (fallback) | MIT |
| `@tweenjs/tween.js` | Animation tweening | MIT |
| `gl-matrix` | High-perf math (in workers) | MIT |
| `svelte` 5 | UI framework | MIT |
| `@sveltejs/kit` 2 | App framework | MIT |
| `shadcn-svelte` | UI component library | MIT |
| `tailwindcss` v4 | Utility CSS | MIT |
| `vite` + vite-plugin-plus | Build tool | MIT |
| `draco3dgltf` | GLB compression | Apache 2.0 |
| `ktx2loader` (three) | GPU texture compression | MIT |

**Asset sources (for production):**
- Player motion capture: Mixamo (free) + custom mocap session
- Stadium models: Custom-built in Blender (GPL self-authored)
- Crowd textures: Custom sprite sheets
- Ball models: Custom Blender + Substance Painter
- Commentary audio: Professional studio recording session
- SFX: Custom Foley recording + Freesound.org (CC0)
- HDRI environments: Poly Haven (CC0)

---

## APPENDIX A — File Naming Conventions

```
models/
  player_base_lod0.glb          # Base player mesh (no kit)
  player_base_lod1.glb
  player_gk_base_lod0.glb       # Goalkeeper mesh (gloves)
  ball_match_lod0.glb
  stadium_generic_large.glb
  stadium_generic_small.glb

textures/
  player_skin_albedo.ktx2       # KTX2 GPU-compressed
  player_skin_normal.ktx2
  player_skin_orm.ktx2          # Occlusion/Roughness/Metal packed
  player_skin_sss.ktx2
  pitch_albedo_4k.ktx2
  pitch_normal_4k.ktx2
  pitch_wear_mask.ktx2          # Updated during match
  crowd_sheet_01.webp
  sky_day.hdr
  sky_night.hdr
  sky_dusk.hdr

audio/
  sfx/
    kick_short_01.ogg .. _06.ogg
    kick_power_01.ogg .. _04.ogg
    crowd_roar_01.ogg .. _06.ogg
    whistle_short.ogg
    net_ripple_01.ogg .. _03.ogg
  commentary/
    en_lead/
      goal_01.ogg .. goal_120.ogg
      save_01.ogg .. save_60.ogg
      foul_01.ogg .. foul_80.ogg
      names/
        [player_id].ogg          # Individual player name pronunciations
```

---

## APPENDIX B — Coordinate System

```
World coordinate system (right-handed, Y-up):
                +Y (up)
                │
                │
    ────────────┼──────────── +X (right touchline)
                │
                └─────────── +Z (toward home end)

Pitch dimensions:
  X: -34 to +34 (width, 68m)
  Y:   0 to ∞   (height)
  Z: -52.5 to +52.5 (length, 105m)

Goal positions:
  Home: Z = +52.5, X = -3.66 to +3.66
  Away: Z = -52.5, X = -3.66 to +3.66
```

---

## APPENDIX C — Performance Profiling Targets Per Phase

| Phase | Target FPS | Renderer | Notes |
|---|---|---|---|
| Phase 1 | 60fps | WebGL2 | No post-processing |
| Phase 2 | 60fps | WebGL2 + basic post | TAA + SSAO |
| Phase 3 | 60fps | WebGPU primary | Full post stack |
| Phase 4 | 60fps stable | WebGPU | Adaptive quality fallback |

**Adaptive quality system:** If frame time exceeds 18ms (< 55fps) for 10 consecutive frames, auto-reduce: crowd density → shadow cascade → post-processing → LOD bias, in that order.

---

*Document version 0.1.0 — Eleven.js Pre-Production Design*  
*All systems described are designed for browser-native deployment with no server runtime dependency.*  
*Questions: github.com/[your-handle]/eleven-js/issues*
