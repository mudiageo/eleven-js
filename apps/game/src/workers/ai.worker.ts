import { SelectorNode, SequenceNode } from "$lib/engine/ai/behavior-tree";
import { HasBallCondition, MoveToBallAction, TeamHasBallCondition } from "$lib/engine/ai/nodes";
import type { AIContext } from "$lib/engine/ai/behavior-tree";

interface PlayerData {
  id: number;
  teamId: number;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  speed: number;
  isControlled: boolean;
}

let players: PlayerData[] = [];
let ballPos = { x: 0, z: 0 };
let teamPossession: number | null = null;

// Basic behavior tree per player
const playerTree = new SelectorNode([
  // If team doesn't have ball, move to ball
  new SequenceNode([new MoveToBallAction()]),
]);

function init(initialPlayers: any[]) {
  players = initialPlayers.map((p) => ({
    id: p.id,
    teamId: p.teamId,
    x: p.position.x,
    z: p.position.z,
    targetX: p.position.x,
    targetZ: p.position.z,
    speed: 5.0, // m/s
    isControlled: p.isControlled,
  }));
}

function updateTargets(ballX: number, ballZ: number) {
  ballPos = { x: ballX, z: ballZ };
  for (const p of players) {
    if (p.isControlled) continue;

    const ctx: AIContext = {
      playerId: p.id,
      teamId: p.teamId,
      position: { x: p.x, y: 0, z: p.z },
      ballPosition: { x: ballX, y: 0, z: ballZ },
      hasBall: false,
      teamHasBall: teamPossession === p.teamId,
    };

    playerTree.tick(ctx);

    // Simplistic AI: everyone slowly moves towards the ball
    p.targetX = ballX + (p.teamId === 0 ? -2 : 2);
    p.targetZ = ballZ;
  }
}

function tick(dt: number) {
  const positions = new Float32Array(players.length * 3);

  let i = 0;
  for (const p of players) {
    if (!p.isControlled) {
      const dx = p.targetX - p.x;
      const dz = p.targetZ - p.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.1) {
        const move = Math.min(p.speed * dt, dist);
        p.x += (dx / dist) * move;
        p.z += (dz / dist) * move;
      }
    }

    positions[i] = p.x;
    positions[i + 1] = 0.925; // Y height
    positions[i + 2] = p.z;
    i += 3;
  }

  self.postMessage({ type: "TICK", positions }, { transfer: [positions.buffer] });
}

self.onmessage = ({ data }) => {
  if (data.type === "INIT") init(data.players);
  if (data.type === "UPDATE_TARGETS") updateTargets(data.ballX, data.ballZ);
  if (data.type === "TICK") tick(data.dt);
  if (data.type === "UPDATE_PLAYER") {
    const p = players.find((x) => x.id === data.id);
    if (p) {
      p.x = data.x;
      p.z = data.z;
    }
  }
};
