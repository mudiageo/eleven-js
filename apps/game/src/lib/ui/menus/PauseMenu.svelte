<script lang="ts">
  import { matchStore } from '$lib/game/match/match-store.svelte';

  let { onResume } = $props<{ onResume: () => void }>();
</script>

<div class="pause-menu">
  <div class="overlay"></div>
  <div class="content">
    <h1>MATCH PAUSED</h1>

    <div class="stats-panel">
        <div class="team">
            <h2>HOME</h2>
            <div class="stat-line"><span>Score</span><span>{matchStore.homeScore}</span></div>
            <!-- More stats (Possession, Shots) go here later -->
        </div>

        <div class="team">
            <h2>AWAY</h2>
            <div class="stat-line"><span>Score</span><span>{matchStore.awayScore}</span></div>
        </div>
    </div>

    <div class="actions">
      <button onclick={onResume}>RESUME MATCH</button>
      <button onclick={() => alert('Formation screen')}>TEAM MANAGEMENT</button>
      <button onclick={() => window.location.href = '/'}>QUIT MATCH</button>
    </div>
  </div>
</div>

<style>
  .pause-menu {
    position: absolute;
    inset: 0;
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Barlow Condensed', sans-serif;
  }

  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(5px);
  }

  .content {
    position: relative;
    z-index: 101;
    background: #111;
    border: 1px solid #333;
    padding: 2rem;
    border-radius: 8px;
    width: 600px;
    color: white;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  h1 {
    text-align: center;
    color: #f5a623;
    margin: 0;
    font-size: 2.5rem;
  }

  .stats-panel {
    display: flex;
    justify-content: space-between;
    gap: 2rem;
  }

  .team {
    flex: 1;
    background: #222;
    padding: 1rem;
    border-radius: 4px;
  }

  .team h2 {
    margin: 0 0 1rem 0;
    border-bottom: 1px solid #444;
    padding-bottom: 0.5rem;
  }

  .stat-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  button {
    background: #333;
    color: white;
    border: 1px solid #444;
    padding: 1rem;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover {
    background: #f5a623;
    color: black;
  }
</style>
