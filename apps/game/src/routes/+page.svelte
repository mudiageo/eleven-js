<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<div class="menu">
  <h1>ELEVEN.JS</h1>
  <button onclick={() => goto('/match/1')}>Play Match</button>
</div>

<style>
  :global(body) {
    margin: 0;
    background: #0a0a0f;
    color: white;
    font-family: 'Barlow Condensed', sans-serif;
  }
  .menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }
  button {
    margin-top: 2rem;
    padding: 1rem 2rem;
    font-size: 1.5rem;
    background: #f5a623;
    color: black;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
</style>
