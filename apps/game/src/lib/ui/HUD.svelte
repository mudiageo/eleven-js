<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { useTask } from '@threlte/core'
  import { onMount } from 'svelte'
  import { matchStore }  from '$lib/state/match-store.svelte';
  import { Vector3, MathUtils, Quaternion } from 'three'
  
  let joystickZone: HTMLDivElement;
  let moveVector = new Vector3();
  let meshPosition = new Vector3(0, 0, 0);

 
 onMount(async () => {
  const nipplejs = await import('nipplejs')
  
    // Initialize the virtual joystick
    const manager = nipplejs.create({
      zone: joystickZone,
      mode: 'static',
      position: { left: '10%', bottom: '150px' },
      color: 'cyan',
      size: 100
    });

    // Capture move events and update our directional vector
    manager.on('move', (evt, data) => {
      const angle = data.angle.radian;
      const force = data.force; // Value between 0 and 1
      
      // Map joystick X/Y to Three.js X/Z (Forward/Backward is typically Z)
      moveVector.x = Math.cos(angle) * force * 0.1; 
      moveVector.z = -Math.sin(angle) * force * 0.1;
    });

    // Reset when the user lifts their finger
    manager.on('end', () => {
      moveVector.set(0, 0, 0);
    });
  });

  // Update mesh position every frame based on the joystick vector
  // useTask((delta) => {
  //   meshPosition.add(moveVector);
  // });
</script>
<div bind:this={joystickZone} class="joystick-zone absolute bottom-0 left-0 w-full"></div>
<div class="fixed bottom-0 right-0 z-500">
  <Button class="" onclick={() =>  matchStore.moveBall()}>
  move ball
  </Button>
  
  <div class="flex flex-col gap-8">
  <Button variant="outline" size="icon" class="rounded-full" onclick={() => alert()}>
    run
  </Button>
</div>
</div>
<style>
  

  /* The zone MUST have a layout position for nipplejs to work */
  .joystick-zone {
    /*position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;*/
    height: 300px;
    pointer-events: none; /* Let clicks pass through if needed */
  }

  /* Target the joystick children directly to enable pointer events in the touch zone */
  .joystick-zone :global(*) {
    pointer-events: auto;
  }
</style>