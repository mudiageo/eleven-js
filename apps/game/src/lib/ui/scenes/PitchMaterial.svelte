<script lang="ts">
  import { T } from '@threlte/core';

  // High detail PBR pitch
</script>

<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
  <T.PlaneGeometry args={[68, 105]} />
  <T.MeshStandardMaterial
    color="#2d5a1b"
    roughness={0.9}
    metalness={0.0}
  />
</T.Mesh>

<!-- Pitch lines -->
<T.Group position.y={0.01}>
    <T.Mesh rotation.x={-Math.PI / 2}>
      <T.PlaneGeometry args={[68, 0.1]} />
      <T.MeshBasicMaterial color="white" />
    </T.Mesh>

    <T.Mesh rotation.x={-Math.PI / 2}>
      <T.RingGeometry args={[9.05, 9.15, 64]} />
      <T.MeshBasicMaterial color="white" />
    </T.Mesh>

    <!-- Outer bounds -->
    <T.Mesh rotation.x={-Math.PI / 2} position={[0, 0, 52.5]}>
        <T.PlaneGeometry args={[68, 0.1]} />
        <T.MeshBasicMaterial color="white" />
    </T.Mesh>
    <T.Mesh rotation.x={-Math.PI / 2} position={[0, 0, -52.5]}>
        <T.PlaneGeometry args={[68, 0.1]} />
        <T.MeshBasicMaterial color="white" />
    </T.Mesh>
    <T.Mesh rotation.x={-Math.PI / 2} position={[34, 0, 0]}>
        <T.PlaneGeometry args={[0.1, 105]} />
        <T.MeshBasicMaterial color="white" />
    </T.Mesh>
    <T.Mesh rotation.x={-Math.PI / 2} position={[-34, 0, 0]}>
        <T.PlaneGeometry args={[0.1, 105]} />
        <T.MeshBasicMaterial color="white" />
    </T.Mesh>
</T.Group>

<!-- Goals -->
<T.Group position={[0, 1.22, 52.5]}>
  <T.Mesh castShadow receiveShadow>
    <T.BoxGeometry args={[7.32, 2.44, 1]} />
    <T.MeshStandardMaterial color="#eeeeee" wireframe />
  </T.Mesh>
</T.Group>

<T.Group position={[0, 1.22, -52.5]}>
  <T.Mesh castShadow receiveShadow>
    <T.BoxGeometry args={[7.32, 2.44, 1]} />
    <T.MeshStandardMaterial color="#eeeeee" wireframe />
  </T.Mesh>
</T.Group>
