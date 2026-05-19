<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { EffectComposer, EffectPass, RenderPass, BloomEffect, ToneMappingEffect, ToneMappingMode } from 'postprocessing';
  import PitchMaterial from './PitchMaterial.svelte';
  import PlayerInstanced from './PlayerInstanced.svelte';
  import BallEntity from './BallEntity.svelte';
  import BroadcastCamera from './BroadcastCamera.svelte';
  import { matchStore } from '$lib/game/match/match-store.svelte';
  import { gameLoop } from '$lib/engine/core/game-loop';
  import { onMount, onDestroy } from 'svelte';
  import { PCFSoftShadowMap } from 'three';
  import { Environment } from '@threlte/extras';
  import { Project, Sheet } from '@threlte/theatre';
  import { Studio } from '@threlte/studio';
  import state from './theatre-state.json';

  let { paused } = $props<{ paused: boolean }>();
  const { renderer, scene, camera, autoRender } = useThrelte();
  
  let physicsWorker: Worker;
  let aiWorker: Worker;

  // Setup High-Quality rendering
  onMount(() => {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    autoRender.current = false; // We take over rendering for post-processing

    matchStore.initPlayers();

    physicsWorker = new Worker(new URL('../../../workers/physics.worker.ts', import.meta.url), { type: 'module' });
    aiWorker = new Worker(new URL('../../../workers/ai.worker.ts', import.meta.url), { type: 'module' });

    physicsWorker.postMessage({
      type: 'INIT',
      config: { players: matchStore.players.map(p => ({ id: p.id, x: p.position.x, z: p.position.z })) }
    });

    aiWorker.postMessage({
      type: 'INIT',
      players: matchStore.players
    });

    physicsWorker.onmessage = ({ data }) => {
      if (data.type === 'TICK') {
        const stateBuffer = new Float32Array(data.state);
        matchStore.updatePhysics(stateBuffer);
      }
    };

    aiWorker.onmessage = ({ data }) => {
      if (data.type === 'TICK') {
        const positions = new Float32Array(data.positions);
        physicsWorker.postMessage({ type: 'TICK', playerPositions: positions }, [positions.buffer]);
      }
    };

    gameLoop.start(
      (dt) => {
        aiWorker.postMessage({ type: 'UPDATE_TARGETS', ballX: matchStore.ball.position.x, ballZ: matchStore.ball.position.z });
        aiWorker.postMessage({ type: 'TICK', dt });
      },
      (alpha) => {
        // Visual interpolation would happen here
      }
    );
  });
  
  onDestroy(() => {
    gameLoop.stop();
    physicsWorker?.terminate();
    aiWorker?.terminate();
  });

  // Setup Post-processing
  let composer: EffectComposer;
  $effect(() => {
    if (!composer && camera.current) {
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera.current));

        composer.addPass(new EffectPass(camera.current,
            new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }),
            new BloomEffect({ intensity: 0.5, luminanceThreshold: 0.8 })
        ));
    }
  });

  useTask((delta) => {
    if (!paused && composer) {
        composer.render(delta);
    }
  }, { stage: 'render', autoInvalidate: false });

</script>


<!-- Project and Sheet from Theatre.js for Cinematic Sequences -->
<Project name="ElevenJS Cinematic" config={{ state }}>
  <Sheet name="Match Intro">

    <!-- Stadium/Pitch -->
    <PitchMaterial />

    <!-- Players (Instanced) -->
    <PlayerInstanced />

    <!-- Ball -->
    <BallEntity />

    <!-- Camera -->
    <BroadcastCamera target={matchStore.ball.position} />

    <!-- Lighting setup from DOCS -->
    <T.AmbientLight intensity={0.4} />

    <!-- 4x Floodlights (Shadow casting) -->
    <T.DirectionalLight
        position={[-40, 30, -60]}
        intensity={1.2}
        castShadow
        shadow.mapSize.width={2048}
        shadow.mapSize.height={2048}
        shadow.camera.left={-40}
        shadow.camera.right={40}
        shadow.camera.top={40}
        shadow.camera.bottom={-40}
        shadow.camera.near={0.5}
        shadow.camera.far={150}
        shadow.bias={-0.0001}
    />
    <T.DirectionalLight
        position={[40, 30, -60]}
        intensity={1.2}
        castShadow
        shadow.mapSize.width={2048}
        shadow.mapSize.height={2048}
        shadow.camera.left={-40}
        shadow.camera.right={40}
        shadow.camera.top={40}
        shadow.camera.bottom={-40}
        shadow.camera.near={0.5}
        shadow.camera.far={150}
        shadow.bias={-0.0001}
    />
    <T.DirectionalLight
        position={[-40, 30, 60]}
        intensity={1.2}
        castShadow
        shadow.mapSize.width={2048}
        shadow.mapSize.height={2048}
        shadow.camera.left={-40}
        shadow.camera.right={40}
        shadow.camera.top={40}
        shadow.camera.bottom={-40}
        shadow.camera.near={0.5}
        shadow.camera.far={150}
        shadow.bias={-0.0001}
    />
    <T.DirectionalLight
        position={[40, 30, 60]}
        intensity={1.2}
        castShadow
        shadow.mapSize.width={2048}
        shadow.mapSize.height={2048}
        shadow.camera.left={-40}
        shadow.camera.right={40}
        shadow.camera.top={40}
        shadow.camera.bottom={-40}
        shadow.camera.near={0.5}
        shadow.camera.far={150}
        shadow.bias={-0.0001}
    />

  </Sheet>
</Project>
