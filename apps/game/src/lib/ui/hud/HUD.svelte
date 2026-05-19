<script lang="ts">
  import { matchStore } from '$lib/game/match/match-store.svelte';
</script>

<div class="hud">
  <div class="scoreboard">
    <div class="team home">HOME</div>
    <div class="score">{matchStore.homeScore} - {matchStore.awayScore}</div>
    <div class="team away">AWAY</div>
    <div class="time">{Math.floor(matchStore.minute)}'</div>
  </div>
</div>

<style>
  .hud {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 10;
  }

  .scoreboard {
    display: flex;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 24px;
    align-items: center;
    gap: 15px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .score {
    font-weight: bold;
    color: #f5a623;
  }

  .time {
    color: #00ff88;
    margin-left: 10px;
  }
</style>
