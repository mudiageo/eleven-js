<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { Vector3 } from 'three';

  let { target } = $props<{ target: { x: number; y: number; z: number } }>();

  let cameraPosition: [number, number, number] = $state([0, 15, 30]);
  let lookAt: [number, number, number] = $state([0, 0, 0]);

  let camRef = $state<any>();

  useTask(() => {
    // Basic follow camera logic
    const targetZ = target.z > 0 ? Math.min(target.z + 10, 60) : Math.max(target.z - 10, -60);
    const targetX = target.x * 0.5;

    // Smooth interpolation (lerp) for camera
    cameraPosition[0] += (targetX - cameraPosition[0]) * 0.05;
    cameraPosition[2] += (targetZ - cameraPosition[2]) * 0.05;

    lookAt[0] += (target.x - lookAt[0]) * 0.1;
    lookAt[2] += (target.z - lookAt[2]) * 0.1;

    if (camRef) {
        camRef.lookAt(lookAt[0], 0, lookAt[2]);
    }
  });
</script>

<T.PerspectiveCamera
  makeDefault
  bind:ref={camRef}
  position={cameraPosition}
  fov={45}
/>
