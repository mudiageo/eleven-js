import RAPIER from "@dimforge/rapier3d-compat";

let world: RAPIER.World;
let ballBody: RAPIER.RigidBody;
let playerBodies: Map<number, RAPIER.RigidBody> = new Map();

interface PhysicsInitConfig {
  players: { id: number; x: number; z: number }[];
}

async function init(config: PhysicsInitConfig) {
  await RAPIER.init();
  world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

  // Fixed substep count for determinism
  world.timestep = 1 / 60;
  world.numSolverIterations = 8;

  // Ground
  const groundCollider = RAPIER.ColliderDesc.cuboid(34, 0.1, 52.5);
  world.createCollider(groundCollider);

  // Ball
  const ballDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(0, 0.11, 0)
    .setLinearDamping(0.3)
    .setAngularDamping(0.5);
  ballBody = world.createRigidBody(ballDesc);
  world.createCollider(
    RAPIER.ColliderDesc.ball(0.11).setRestitution(0.65).setFriction(0.5),
    ballBody,
  );

  // Players
  for (const player of config.players) {
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      player.x,
      0.925,
      player.z,
    );
    const body = world.createRigidBody(bodyDesc);
    world.createCollider(RAPIER.ColliderDesc.capsule(0.65, 0.35), body);
    playerBodies.set(player.id, body);
  }
}

function tick(playerPositions: Float32Array) {
  // Update kinematic player positions from AI worker output
  let i = 0;
  for (const [id, body] of playerBodies) {
    body.setNextKinematicTranslation({
      x: playerPositions[i],
      y: playerPositions[i + 1],
      z: playerPositions[i + 2],
    });
    i += 3;
  }

  // Apply Magnus effect forces to the ball
  const vel = ballBody.linvel();
  const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
  const angVel = ballBody.angvel();
  const angSpeed = Math.sqrt(angVel.x * angVel.x + angVel.y * angVel.y + angVel.z * angVel.z);

  if (speed > 0.5 && angSpeed > 0.5) {
    const rho = 1.225;
    const Cl = 0.35;
    const A = Math.PI * 0.11 * 0.11;

    const vNorm = { x: vel.x / speed, y: vel.y / speed, z: vel.z / speed };
    const aNorm = { x: angVel.x / angSpeed, y: angVel.y / angSpeed, z: angVel.z / angSpeed };

    // Cross product (w x v)
    const cx = aNorm.y * vNorm.z - aNorm.z * vNorm.y;
    const cy = aNorm.z * vNorm.x - aNorm.x * vNorm.z;
    const cz = aNorm.x * vNorm.y - aNorm.y * vNorm.x;

    const magnitude = 0.5 * rho * Cl * A * speed * speed;

    ballBody.addForce(
      {
        x: cx * magnitude,
        y: cy * magnitude,
        z: cz * magnitude,
      },
      true,
    );
  }

  world.step();

  // Gather and return state
  const state = gatherState();
  self.postMessage({ type: "TICK", state }, { transfer: [state.buffer] });
}

self.onmessage = ({ data }) => {
  if (data.type === 'INIT') {
      init(data.config).catch(console.error);
  }
  if (data.type === "TICK") tick(data.playerPositions);
  if (data.type === "IMPULSE") ballBody.applyImpulse(data.impulse, true);
};

function gatherState(): Float32Array {
  const buf = new Float32Array(4);
  const t = ballBody.translation();
  buf[0] = t.x;
  buf[1] = t.y;
  buf[2] = t.z;
  const linvel = ballBody.linvel();
  buf[3] = Math.sqrt(linvel.x * linvel.x + linvel.y * linvel.y + linvel.z * linvel.z);
  return buf;
}
