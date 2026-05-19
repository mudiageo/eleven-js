# ELEVEN.JS — Step-by-Step Implementation Guide
## Part 1: Stages 1–4 · From Zero to a Referee-Managed Match

**How to use this guide:**
- Every stage ends with a playable build. Do not move to the next stage until yours works.
- References like `[Master §4.2]` point to the exact section in `ELEVEN_JS_MASTER_DOCS.md` for the full technical detail. Read that section when you need depth; follow this guide for what to actually do.
- Each stage deliberately builds on the last. The "bad" version you build in Stage 1 becomes the foundation you improve in Stage 6. Do not over-engineer early stages.
- When you see **🔧 Do This**, that is a concrete task. When you see **📖 Understand This**, read it before proceeding — these are the rare moments where understanding first saves you hours of confusion.

---

## BEFORE YOU START: Environment Setup

This is a one-time step. Do it before Stage 1.

### What you need installed
- **Node.js** — version 20 or later. Download from nodejs.org. After installing, open a terminal and type `node --version` to confirm.
- **pnpm** — a faster alternative to npm. After Node is installed, run `npm install -g pnpm` in your terminal, then confirm with `pnpm --version`.
- **VS Code** — your code editor. Download from code.visualstudio.com.
- **Git** — for saving your progress at each stage. Download from git-scm.com.

### VS Code extensions to install
Open VS Code, go to Extensions (Ctrl+Shift+X), and install:
- **Svelte for VS Code** (by Svelte)
- **Tailwind CSS IntelliSense** (by Tailwind Labs)
- **ESLint**
- **Prettier**
- **Three.js Snippets** (by 0b5vr) — helpful for 3D concepts later

### A word on the browser
Use **Google Chrome** or **Edge** as your development browser throughout this project. Firefox has slower WebGL performance and does not yet support WebGPU. Chrome DevTools will be your most-used debugging tool.

---

## STAGE 1: A Ball on a Pitch
**Milestone:** You open the browser and see a green football pitch. There is a ball. You press a button and the ball moves. The camera follows it.

**What you are building:** The absolute foundation — the render loop, the scene, the camera, one physics object, one input. Everything else in this project sits on top of what you build here.

**Estimated time:** 3–5 days for a complete beginner.

---

### Step 1.1 — Scaffold the Project

Follow the bootstrap commands in `ELEVEN_JS_IMPLEMENTATION_GUIDE.md` (the Implementation Quickstart document, Section 1 "Monorepo Bootstrap"). Run every command listed there up to and including the shadcn-svelte component installs.

When it's done, run `pnpm dev` inside `apps/game`. You should see the default SvelteKit welcome page in your browser at `http://localhost:5173`. That means your environment is working.

**Immediately commit this to git:**
```
git init
git add .
git commit -m "stage-1: project scaffold"
```

Get into the habit of committing at the end of every step. You will thank yourself later.

### Step 1.2 — Understand the Stack Relationship

📖 **Understand This** (takes 5 minutes, saves hours):

Your project has three layers that talk to each other:

1. **SvelteKit** handles everything that is not the game itself — the menus, routing between pages, the HTML shell. Think of it as the wrapper around the game.
2. **Threlte** is a Svelte library that lets you write Three.js code in Svelte's style. Instead of writing JavaScript to add a box to a scene, you write `<T.Mesh>` as if it were HTML. Under the hood it creates the same Three.js object.
3. **Three.js** is the actual 3D engine doing the rendering. Threlte is just a more convenient way to use it inside Svelte.

When you write a Threlte component, you are writing Three.js. The two are inseparable. Read `[Master §2.1]` for the full stack diagram so this relationship is clear before you write a single line.

### Step 1.3 — Create the Match Route

In SvelteKit, a page is created by making a folder and a `+page.svelte` file inside `src/routes/`. Create the file `src/routes/match/+page.svelte`. This will be the page that lives at `http://localhost:5173/match` — the actual game screen.

For now this page needs to do exactly one thing: render a Threlte `<Canvas>` component that fills the entire screen. The `<Canvas>` component comes from `@threlte/core`. Inside it, place a child component called `<MatchScene />` which you will create next.

Look at `ELEVEN_JS_IMPLEMENTATION_GUIDE.md` Section 5 "Core Game Loop Integration" for the exact structure of this page.

### Step 1.4 — Build the Scene: Pitch + Lighting

Create `src/lib/ui/scenes/MatchScene.svelte`. This is where all 3D objects live.

Your scene needs three things at this stage:

**The pitch (ground plane):**
A flat rectangle representing the football pitch. In Three.js this is a `PlaneGeometry`. The pitch is 68 metres wide and 105 metres long — use those exact numbers as your geometry dimensions because the physics system later will use real-world metres. The plane needs to be rotated 90 degrees on the X axis so it lies flat (by default Three.js planes are vertical). Give it a simple green colour for now — no textures yet.

Read `[Master §4.4]` to understand what the final pitch shader will look like. You are not building that yet, but knowing the destination helps you name things correctly now.

**The coordinate system:**
Read `[Master Appendix B]` right now. This tells you where the goals are, which direction is "forward", and how the pitch is centred at the origin. This is critical — if you place things wrong now, you will spend hours debugging player positions later. Print it out or keep it open in a tab.

**Lighting:**
Add an `AmbientLight` and at least one `DirectionalLight` pointing down at the pitch. Without lights, your scene will be completely black. This is temporary — the full floodlight setup is in `[Master §4.2]` and you will build it in Stage 6.

**The camera:**
Add a `PerspectiveCamera` positioned high above and to one side of the pitch, looking at the centre. Roughly: position it at `(0, 22, 52)` looking at `(0, 0, 0)`. This approximates the broadcast TV angle described in `[Master §11.2]`.

When you save and look at the browser, you should see a green rectangle from above. If you see nothing, the most likely causes are: the camera is inside the ground plane (check Y position), or lighting is missing.

### Step 1.5 — Add Rapier Physics and a Ball

📖 **Understand This:**
Rapier is a physics engine that runs in a Web Worker — a separate JavaScript thread from your main page. The reason: physics calculations are expensive. If they run on the main thread, they will freeze your UI. The Worker runs physics in the background and sends results back to the main thread.

For Stage 1, to keep things simple, you will run Rapier directly on the main thread. You will move it to a Worker in Stage 2. This is the correct approach — get it working first, then optimise.

Read `[Master §7.1]` for the full Rapier setup. For Stage 1, your minimal version needs:
- Import and initialise Rapier (`await RAPIER.init()`)
- Create a World with gravity `(0, -9.81, 0)`
- Create a ground collider (a flat box the size of the pitch)
- Create a dynamic ball rigid body with a sphere collider (radius 0.11 metres — regulation football size)
- Set the ball's restitution to 0.65 and friction to 0.5 (from `[Master §7.2]`)

The ball rigid body will be your physics object. You will render it as a separate `<T.Mesh>` sphere in the scene, and every frame you will read the physics body's position and copy it to the mesh's position. This is the core pattern of physics-driven 3D: physics moves the invisible simulation object, you copy those numbers to the visible mesh.

Create the Rapier world in a Svelte `onMount` block so it initialises after the component is ready.

### Step 1.6 — The Game Loop

📖 **Understand This:**
The game loop is the heartbeat of the entire game. Every frame — ideally 60 times per second — it does three things in order: read input, update state (physics, AI), render. If any step takes too long, the frame rate drops.

Read `[Master §6.2]` for the full fixed-step loop. For Stage 1, use Threlte's `useTask` hook instead of building the full loop. `useTask` runs a callback every frame inside the Threlte render cycle. Inside it, you call `world.step()` (the Rapier physics tick) and then copy the ball's physical position to the visual mesh.

This is your game loop for now. It will be replaced with the proper fixed-step loop in Stage 2, but the concept — step physics, copy to visuals, render — never changes.

### Step 1.7 — Basic Input: Kick the Ball

Add keyboard input. When the player presses the spacebar, apply an impulse to the ball's Rapier rigid body. An impulse is an instant force — it makes the ball jump or shoot forward.

For now, hardcode the impulse direction (e.g. always forward along the Z axis). Later the input system will use the proper action mapping from `[Master §10.1]`.

Read `[Master §10.3]` to understand how movement direction will eventually be computed from camera-relative controls. For now ignore that — just get the ball moving on a keypress.

### Step 1.8 — Camera Follow

Make the camera follow the ball. Every frame, move the camera's X position to match the ball's X position (with some smoothing — don't snap it instantly). Keep the Y and Z positions fixed at the broadcast angle.

This is a primitive version of the broadcast camera described in `[Master §11.2]`. You will build the full system in Stage 5 but understanding the interpolated follow now means Stage 5 is just an upgrade, not a rewrite.

Smoothing: instead of `camera.x = ball.x`, use `camera.x = camera.x + (ball.x - camera.x) * 0.05`. This lerp (linear interpolation) creates the smooth follow feel.

### Stage 1 Checklist
Before moving on, confirm:
- [ ] Green pitch visible from broadcast angle
- [ ] A sphere (the ball) sitting on the pitch
- [ ] Ball falls due to gravity when spawned above the pitch
- [ ] Ball bounces when it hits the ground
- [ ] Pressing a key applies a force to the ball
- [ ] Camera smoothly follows ball left and right
- [ ] No console errors

**Commit:** `git commit -m "stage-1: ball on pitch, basic physics, camera follow"`

### External Resources for Stage 1
- **Threlte docs:** threlte.xyz/docs — read the "Getting Started" and "Core" sections
- **Three.js journey course (Bruno Simon):** threejs-journey.com — Lessons 1–10 give you the Three.js fundamentals. The course costs money but is the single best resource for learning Three.js from zero. Worth every penny for a project of this scale.
- **Rapier docs:** rapier.rs/docs — read "Getting started with JavaScript"
- **Svelte 5 runes:** svelte.dev/docs/svelte — read the "Runes" section if reactive state confuses you

---

## STAGE 2: 22 Players on the Pitch
**Milestone:** Both teams are on the pitch in a 4-4-2 formation. Players move toward their tactical positions. You control one player on your team. The camera follows your player.

**What you are building:** The ECS entity system, the AI worker, formation positioning, and player switching. This is the biggest conceptual jump in the project.

**Estimated time:** 1–2 weeks.

---

### Step 2.1 — Move Physics to a Worker

Now that physics works on the main thread, move it to a dedicated Worker as described in `[Master §2.3]` and the worker code in `ELEVEN_JS_IMPLEMENTATION_GUIDE.md` Section 7.

Why now? Because in Stage 2 you will add 22 player collision bodies. That is 23 physics objects. On the main thread that will start to hurt frame rate. In a Worker, physics runs in parallel.

The Worker communicates with the main thread via `postMessage`. Your main thread sends player positions to the Worker; the Worker sends back ball position and collision results. For now, use regular `postMessage` with a structured object. You will upgrade to `SharedArrayBuffer` (zero-copy) in Stage 6 when you hit the performance budget described in `[Master §25.2]`.

Create `src/workers/physics.worker.ts`. Follow the exact structure in `ELEVEN_JS_IMPLEMENTATION_GUIDE.md` Section 7. Set it up in Vite using the `?worker` import suffix: `import PhysicsWorker from '$lib/workers/physics.worker?worker'`.

Test: the ball should behave identically to Stage 1, but physics is now running off-thread.

### Step 2.2 — The Match Store

Create the match store as described in `ELEVEN_JS_IMPLEMENTATION_GUIDE.md` Section 8. This is the single source of truth for all match state — scores, players, ball position, match phase.

Use Svelte 5 runes (`$state`, `$derived`) for reactivity. The HUD and UI components you build in later stages will read from this store automatically whenever it changes. Setting it up correctly now means you never have to refactor it.

The store at this stage needs: `players[]`, `ball`, `homeScore`, `awayScore`, `minute`, `phase`. Everything else from `[Master §14.1]` you add later.

### Step 2.3 — Player Entities

📖 **Understand This:**
Each player is an entity — a thing in the game world with a position, a team, a role, and a set of stats. Read `[Master §6.1]` to understand the ECS-inspired structure. You are not building a full ECS framework — you are building typed TypeScript objects that follow the same pattern.

Create a `Player` type with at minimum: `id`, `teamId`, `position`, `rotation`, `velocity`, `role`, `stamina`, `stats`, `isControlled`. Add more fields from `[Master §6.1]` as you need them — do not add them all upfront.

Create 22 player objects in the match store — 11 per team. For now, all players use a simple capsule mesh (a cylinder with hemisphere caps) as a placeholder. The capsule dimensions from `[Master §7.3]` are your guide: radius 0.35m, height 1.85m.

Read the instanced mesh pattern in `[Master §25.2]`. For now use individual meshes (one per player) because it is simpler. You will switch to `InstancedMesh` in Stage 6 as a performance optimisation.

### Step 2.4 — Formation Positioning

Read `[Master §15.1]` for the full formation system. For Stage 2, implement only one formation: 4-4-2.

The formation slots are defined as relative coordinates `[x, y]` where `x` is 0 (left touchline) to 1 (right touchline) and `y` is 0 (own goal) to 1 (opponent goal). Convert these to world coordinates using the pitch dimensions (68m wide, 105m long, centred at origin).

Place all 11 players on Team A in their 4-4-2 positions on one half, and all 11 players on Team B in mirrored positions on the other half. Players should just spawn at their positions — no movement yet.

### Step 2.5 — The AI Worker

Create `src/workers/ai.worker.ts`. This worker runs the player positioning logic at 100Hz (100 times per second). For Stage 2, "AI" just means: move each player toward their formation position.

The AI worker receives the current match state (player positions, ball position, phase) and returns target velocities for each player. The main thread applies these velocities to move the players.

Read `[Master §8.1]` for the full behavior tree structure. For Stage 2, you only need the simplest possible version: `if (player is far from formation slot) → move toward formation slot`. The full behavior tree is built up gradually over Stages 3, 4, and 5.

### Step 2.6 — Player Movement (AI Controlled)

Each physics tick, for every AI-controlled player:
1. Get their target position from the AI worker
2. Compute the direction vector toward the target
3. Move the player's kinematic body toward it at walking speed (~3 m/s)
4. Rotate the player to face their movement direction

AI players in Stage 2 should look like they are walking to their kick-off positions. They do not interact with the ball yet.

Read `[Master §7.3]` for how player colliders are set up as kinematic bodies. Kinematic means: you tell Rapier where they are, Rapier does not simulate them (players are not ragdolls — they move on your command).

### Step 2.7 — Player Control: Controlling One Player

The human player controls one player on their team. For now, use keyboard arrow keys or WASD to move the controlled player.

Read `[Master §10.1]` for the full input abstraction. At this stage, implement only the movement input — left stick / WASD maps to a movement direction in world space. Do not implement any ball interaction yet.

Read `[Master §10.3]` for camera-relative controls. This is important to implement correctly from the start: pressing "up" should move your player toward the opponent's goal regardless of camera angle, not along the Z axis. Use the camera's forward vector to rotate the input direction.

Add a visual indicator under the controlled player — a small ring or circle on the ground so you can always tell which player is yours. See `ELEVEN_JS_IMPLEMENTATION_GUIDE.md` Section 9 for the selection ring approach.

### Step 2.8 — Player Switching

When the human presses the switch button (Tab key / LB on gamepad), transfer control to the team player nearest the ball. Read `[Master §10.4]` for the full control table. The switching algorithm: find all human team players, pick the one with the smallest distance to the ball, set `isControlled = true` on them and `false` on all others.

### Step 2.9 — Basic Gamepad Support

Read `[Master §10.2]` for the full gamepad implementation. Add the `GamepadManager` at this stage — it uses `navigator.getGamepads()` polled every frame (not event-driven). Map left stick to movement. Map the switch button. You will add the rest of the button bindings in Stage 3.

### Stage 2 Checklist
- [ ] 22 capsule meshes on the pitch in 4-4-2 formation
- [ ] AI players walk to their formation positions
- [ ] Human player moves with keyboard/gamepad
- [ ] Camera follows the human-controlled player
- [ ] Player switching works (Tab/LB)
- [ ] Selection ring visible under controlled player
- [ ] Physics worker running (check DevTools → Performance → Workers)
- [ ] No dropped frames at idle (check with Chrome DevTools Performance tab)

**Commit:** `git commit -m "stage-2: 22 players, formation positioning, player control"`

### External Resources for Stage 2
- **Web Workers explainer:** developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers — read before implementing the AI worker
- **Gamepad API:** developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
- **Three.js Journey Lessons 11–20** — covers transforms, cameras, geometries in more depth

---

## STAGE 3: Real Football — Pass, Shoot, Save
**Milestone:** You can pass to teammates, shoot at goal, and the goalkeeper dives to save or lets it in. The ball behaves physically. This feels like football for the first time.

**Estimated time:** 2–3 weeks. This is the biggest stage.

---

### Step 3.1 — Ball Ownership & Possession System

Before passing or shooting, the game needs to know who has the ball. Implement a possession system:

- Each physics tick, check the distance between the ball and every player's foot position
- If a player is within ~0.8 metres of the ball AND the ball is moving slowly enough (~2 m/s or less), that player "has possession"
- Set `player.ballPossession = true` and `matchStore.ballCarrier = player`
- When a player has possession, the ball follows them slightly ahead of their feet (not physically — you override the ball position)

This is a simplification. The full contact system using foot IK is described in `[Master §12.2]` and built in Stage 6. For now, "magnetic" ball control is fine.

### Step 3.2 — The Ball Striking System

Read `[Master §9.1]` fully before implementing this. The striking system has three inputs: power (how long the button is held), direction (where the player is facing), and accuracy (a randomness factor based on stats).

For Stage 3, implement a simplified version:
- Pass button held → power accumulates (cap at 800ms)
- On button release → ball is launched in the player's facing direction
- Power maps to ball speed (0–24 m/s range for passes)
- Add a small random deviation angle (accuracy spread)

Do not implement the full timing/accuracy model from `[Master §9.1]` yet — implement the structure (power via hold time, direction via facing, deviation via spread) and you will tune the numbers properly in Stage 5.

Apply the impulse via the physics worker's `IMPULSE` message type you set up in Step 2.1.

### Step 3.3 — Pass vs Shoot

Two different buttons, two different outcomes. The core difference is power and trajectory:

- **Pass:** Lower power (0–18 m/s), ball stays near ground, slightly elevated
- **Shoot:** Higher power (12–32 m/s), specific target angle, more spin

Read `[Master §9.1]` for the shot velocity formula. Read `[Master §7.2]` for the Magnus spin physics — implement a basic version where shots have top-spin (which causes them to dip) and passes have no spin for now.

### Step 3.4 — Through Ball

Read `[Master §9.2]` for the through-ball prediction system. Implement a simplified version: when the through-ball button is pressed, raycast in the direction the player is facing and find the first teammate in that corridor. Launch the ball into space ahead of that teammate rather than directly to them.

The interception check (whether a defender can cut it out) is not implemented yet — add it as part of the AI improvement in Stage 4.

### Step 3.5 — AI Player Ball Behaviour (Outfield)

Now the AI needs to actually play football. Expand the AI Worker with the first real behavior tree branches from `[Master §8.2]`:

**Team has the ball (your team):**
- Player nearest ball → go get it
- Other players → move to support positions (spread out, create triangles)
- If you have the ball and a teammate is free → pass (automatic, for non-controlled players)

**Team does not have the ball (opponent or you just lost it):**
- Nearest player to ball → press/chase
- Others → drop back toward defensive positions

This does not need to be smart yet. It just needs to be vaguely football-shaped. The full behavior tree from `[Master §8.2]` is your north star — implement each branch one at a time.

### Step 3.6 — Goalkeeper

The goalkeeper is a special player. Read `[Master §8.5]` for the GK AI.

For Stage 3, implement:
- GK stays on or near the goal line by default
- When the ball is in the penalty area and heading toward goal → GK moves to intercept
- Save decision: compute where the ball will cross the goal line (simple linear projection — no Magnus yet). Move the GK body to that point.
- If GK reaches the point before the ball → "save" (ball is stopped/deflected)
- If ball gets there first → goal

The dive animation is a placeholder for now (just snap the GK to position). Real dive animations come in Stage 6.

Read `[Master §13.4]` — the goal coordinates are X: -3.66 to +3.66, Y: 0 to 2.44 (from Appendix B). Your GK interception must stay within these bounds.

### Step 3.7 — Goal Detection

When the ball fully crosses the goal line (Z > 52.5 or Z < -52.5) within the goal post X/Y bounds, it is a goal.

On goal:
- Increment the correct team's score in the match store
- Stop all player movement briefly (1 second pause)
- Reset ball to centre circle
- Reset players to kick-off positions

The full celebration and commentary system is Stage 8. For now, just log "GOAL!" to the console and update the score.

### Step 3.8 — Ball Out of Play

Detect when the ball crosses any touchline or goal line outside the goal:
- Side touchlines (X > 34 or X < -34): throw-in
- End lines (Z > 52.5 or Z < -52.5) outside goal: corner or goal kick

For now, simply reset the ball to the approximate restart position and give possession to the correct team. Full set pieces are Stage 4.

Emit these events via the event bus from `[Master §6.3]`. Even if nothing listens to them yet, emitting events now means you can add listeners later without changing the detection logic.

### Step 3.9 — Basic HUD

Create the HUD layer described in `[Master §23.1]`. For Stage 3, it needs:
- Score display (home score : away score)
- Match clock (counting up from 0:00)
- Team names

Use the ScoreBar component structure from `ELEVEN_JS_IMPLEMENTATION_GUIDE.md` Section 9. Style it with Tailwind — position it fixed at the top of the screen, semi-transparent dark background, white text. This is not the final HUD design (that is Stage 8) but the structure should match the master guide's component hierarchy.

### Stage 3 Checklist
- [ ] Ball possession system working (player picks up ball when nearby)
- [ ] Pass launches ball at a teammate
- [ ] Shoot launches ball at goal with more power
- [ ] Through ball sends ball into space
- [ ] AI teammates pass to each other when you are not in control
- [ ] AI team defends and presses when you have the ball
- [ ] Goalkeeper moves to save shots
- [ ] Goals are detected and score updates
- [ ] Ball out of play is detected and restarted
- [ ] HUD shows score and clock

**Commit:** `git commit -m "stage-3: passing, shooting, goalkeeper, goal detection, HUD"`

### External Resources for Stage 3
- **Three.js Journey Lessons 20–30** — raycasting, object interaction
- **Rapier impulse docs:** rapier.rs — "Forces and Impulses" section
- **Football tactics basics:** Read about the 4-4-2 shape on Wikipedia — understanding real football positioning helps you tune the AI

---

## STAGE 4: Referee, Fouls, Set Pieces & Full Match Flow
**Milestone:** The referee blows for fouls, shows cards, awards free kicks and corners. There is a half-time break. The match has proper flow — it feels like a real game being officiated.

**Estimated time:** 1–2 weeks.

---

### Step 4.1 — The Event Bus

If you have not already built the event bus from `[Master §6.3]`, build it now. Every match event (foul, goal, card, corner, substitution) flows through this bus. Systems subscribe to events and react — the referee system emits a foul event, the commentary system (Stage 8) listens for it, the HUD shows a toast notification.

Build the `TypedEventBus` exactly as specified in `[Master §6.3]`. The full list of event types is there. You will not use most of them until later stages, but defining them all now means you never have to go back and change the type definition.

Test it by emitting a `GOAL` event manually and logging it in a listener.

### Step 4.2 — Foul Detection

Read `[Master §13.1]` fully. The foul detection system runs every physics tick and checks every pair of players from opposing teams who are colliding.

For each collision, it evaluates:
- Relative velocity (fast collision = more likely a foul)
- Whether the tackle came from behind
- Whether it was a late tackle (after the ball was already played)
- Whether studs were raised (foot contact height)

For Stage 4, implement the collision detection and the `assessFoul` function that returns `NONE`, `FOUL`, `YELLOW`, or `RED`. Do not implement the full referee personality system yet (`[Master §13.2]`) — just use a neutral referee with fixed thresholds.

When a foul is detected, emit a `FOUL` event on the event bus.

### Step 4.3 — Referee Response

When a `FOUL` event is received:
1. Stop play (freeze all players)
2. Show a visual indicator at the foul location (a simple circle or marker is enough for now)
3. Award the free kick or penalty to the fouled team
4. Update foul statistics in the match store

For cards:
- `YELLOW` severity → emit a `CARD` event with type 'yellow', show a yellow card sprite above the player's head
- `RED` severity → emit a `CARD` event with type 'red', remove the player from the pitch (set them inactive)
- Second yellow in the same match → automatic red (track per-player yellow count)

Add yellow card count and red card status to the Player type.

### Step 4.4 — Free Kicks

Read `[Master §13.4]` for the full free kick setup.

For Stage 4, implement the setup phase only:
- Ball placed at foul location
- Defensive wall auto-positioned 9.15 metres from ball in direction of goal (wall count: 2–5 players based on danger)
- Attacking players position themselves around the wall

The actual free kick is taken the same way as a regular shot (Step 3.2). What changes is: the ball starts stationary, possession given to fouled team, whistle blown.

For now, manual wall jumping (players can leap over the wall on a button press) is not implemented — just make the wall stand still. Add the wall-breaking techniques described in `[Master §13.4]` in Stage 5.

### Step 4.5 — Corners

When the ball goes out over the end line and the last touch was a defender, it is a corner.

Corner setup:
- Ball placed at the correct corner flag position (`[Master Appendix B]` has pitch coordinates)
- Both teams reposition — defenders fill the box, attackers take up positions for delivery
- The corner kick is taken as a cross (lofted pass with curve)

For Stage 4, the AI corner routine is simple: the nearest attacker runs to the near post, one more runs to the far post, the corner is delivered toward one of them. The full set-piece routine system from `[Master §13.4]` (with 3–5 pre-designed patterns) is Stage 5.

### Step 4.6 — Penalties

Read `[Master §13.4]` for the penalty system.

A penalty is awarded when:
- A foul occurs inside the penalty area (X: -16.5 to +16.5, Z: within 16.5m of goal line) — `[Master Appendix B]` has the exact coordinates
- Or a handball in the box (simplified: if a shot hits a player's arm hitbox)

Penalty setup:
- Ball on penalty spot (11m from goal line, at centre)
- GK on goal line
- All other players outside the box
- Taker walks up and shoots

The penalty shootout for extra time is Stage 5. For now just implement the in-match penalty correctly.

### Step 4.7 — Throw-Ins

When the ball goes out over a touchline, the team that did not touch it last takes a throw-in.

For AI-controlled throw-ins: nearest player walks to the touchline, ball is thrown to the nearest available teammate. Human-controlled throw-ins: the closest player to the ball runs to the touchline, you aim with the left stick, press throw.

This is the simplest set piece. Use it as a warm-up before the more complex ones.

### Step 4.8 — Goal Kicks

When the ball goes out over the end line and the last touch was an attacker, it is a goal kick.

GK places ball on the 6-yard box line and kicks long. For Stage 4, the AI always aims for the centre-backs or strikers depending on tactic. Human-controlled: same input as a regular pass/shot but from the goal area.

### Step 4.9 — Match Clock & Added Time

The match clock counts from 0 to 90 minutes. Map real seconds to in-game minutes at a ratio you can tune (recommended: 1 real second = 1 game minute for testing, adjust to taste for actual play — FIFA typically runs 6 real minutes per half).

Added time: at the end of each half, compute additional time based on events that occurred. Read `[Master §14.1]` for the `computeAddedTime` formula. The referee "board" showing added time is a simple HUD element — a yellow/green badge showing "+N" minutes.

### Step 4.10 — Half-Time and Full-Time

Read `[Master §6.4]` for the full match state machine.

**Half-time:**
- Clock reaches 45:00 (+ added time) → emit `HALF_TIME` event
- Brief pause (15 seconds real time or skip button)
- Teams swap ends (mirror all position targets)
- Teams kick off the second half

**Full-time:**
- Clock reaches 90:00 (+ added time) → emit `FULL_TIME` event
- Show final score screen
- Options: play again, return to menu

The extra time and penalty shootout logic is Stage 5 (for cup knockout matches).

### Step 4.11 — Match Statistics

Expand the match store to track all stats from `[Master §14.2]`: shots, shots on target, corners, fouls, cards, possession. Possession is tracked as a running percentage — count which team's player last touched the ball, accumulate those counts, divide to get percentage.

Display a basic stats panel in the half-time and full-time screen — just a table with two columns (home / away) and rows for each stat. Use a shadcn-svelte `Table` component.

### Step 4.12 — Offside Detection

Read `[Master §7.4]` for the full offside algorithm.

Offside detection runs every frame during an attacking pass. At the exact moment a pass is played:
1. Compute the offside line (second-last defender's position)
2. Check every attacker's position
3. If any attacker is past the offside line AND past the ball → offside

When offside is detected:
- Blow whistle after ball reaches the attacker (VAR-style: play on until confirmed)
- Give free kick to defending team at the position of the offside player
- Show offside lines on screen (the VAR blue lines effect) — a simple 2D SVG overlay

### Stage 4 Checklist
- [ ] Fouls detected and whistle blown
- [ ] Yellow and red cards shown and tracked
- [ ] Free kicks awarded and set up
- [ ] Corners awarded and set up
- [ ] Penalties awarded and taken
- [ ] Throw-ins and goal kicks working
- [ ] Half-time: teams swap ends, second half starts
- [ ] Full-time: score screen shown
- [ ] Added time calculated and displayed
- [ ] Offside detection working
- [ ] Match stats tracked (possession, shots, fouls, etc.)
- [ ] Stats screen shown at half-time and full-time

**Commit:** `git commit -m "stage-4: fouls, referee, set pieces, half-time, full-time, stats"`

### External Resources for Stage 4
- **Laws of the Game (IFAB):** theifab.com/laws — the official football rulebook. Read Law 12 (Fouls), Law 14 (Penalty Kick), Law 15–17 (Throw-in, Goal Kick, Corner). This is your spec doc for the referee system.
- **Offside law visualised:** YouTube search "offside rule explained VAR" — watch a few videos. The geometry is subtle.

---

## INTERLUDE: What You Have Built

Pause here. By the end of Stage 4 you have:

- A physically simulated football with Magnus spin and realistic bounce
- 22 AI players moving in formation, pressing, supporting, passing
- A human-controlled player with keyboard and gamepad support
- A goalkeeper who dives to save shots
- A complete referee system: fouls, cards, all set pieces
- A full 90-minute match with half-time, added time, and full-time
- A match statistics system

This is already more than many browser games ever achieve. The next four stages take this foundation and elevate it to AAA. The work gets more creative and less structural from here.

---

*Continue in Part 2: Stages 5–8 — Tactics, AAA Graphics, League Engine, and Full Polish*
