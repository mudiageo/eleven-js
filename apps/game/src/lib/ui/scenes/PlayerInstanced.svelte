<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { InstancedMesh, Object3D, MeshStandardMaterial, CapsuleGeometry } from 'three';
  import { matchStore } from '$lib/game/match/match-store.svelte';

  // Threlte hooks
  const { invalidate } = useThrelte();

  // Basic geometry/material for players for now
  const geometry = new CapsuleGeometry(0.3, 1, 4, 8);
  const homeMaterial = new MeshStandardMaterial({ color: '#1a56db', roughness: 0.7, metalness: 0.1 });
  const awayMaterial = new MeshStandardMaterial({ color: '#e02424', roughness: 0.7, metalness: 0.1 });

  let homeMesh = $state<InstancedMesh | undefined>(undefined);
  let awayMesh = $state<InstancedMesh | undefined>(undefined);

  const dummy = new Object3D();

  // We split instancing by team to easily apply different materials,
  // since `InstancedMesh` shares geometry and material.
  useTask(() => {
    if (!homeMesh || !awayMesh) return;

    let homeIndex = 0;
    let awayIndex = 0;

    for (const player of matchStore.players) {
        dummy.position.set(player.position.x, player.position.y, player.position.z);
        // Player rotations are normally around Y axis
        dummy.rotation.set(0, player.rotation, 0);
        dummy.updateMatrix();

        if (player.teamId === 0) {
            homeMesh.setMatrixAt(homeIndex++, dummy.matrix);
        } else {
            awayMesh.setMatrixAt(awayIndex++, dummy.matrix);
        }
    }

    homeMesh.instanceMatrix.needsUpdate = true;
    awayMesh.instanceMatrix.needsUpdate = true;

    // Request render
    invalidate();
  });
</script>

<T.Group>
    <!-- 11 Players per team -->
    <T is={InstancedMesh} args={[geometry, homeMaterial, 11]} bind:ref={homeMesh} castShadow receiveShadow />
    <T is={InstancedMesh} args={[geometry, awayMaterial, 11]} bind:ref={awayMesh} castShadow receiveShadow />
</T.Group>
