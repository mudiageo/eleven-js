# ELEVEN.JS — Step-by-Step Implementation Guide
## Part 2: Stages 5–8 · From Functional to AAA

**How to use this guide:**
- This is a direct continuation of Part 1. Do not start here unless Stages 1–4 are complete and working.
- References like `[Master §X.X]` point to `ELEVEN_JS_MASTER_DOCS.md`.
- By the end of Stage 8, you have a fully AAA game. Each stage is a meaningful quality leap.

---

## STAGE 5: Tactics, Formations, Substitutions & Full Match Management
**Milestone:** You can change formation mid-match, issue tactical instructions, make substitutions, play extra time and penalties in knockout rounds, and the AI adapts its shape intelligently based on the match situation.

**Estimated time:** 2–3 weeks.

---

### Step 5.1 — Full Formation System

Read `[Master §15.1]` for the complete formation definitions. At this stage, implement all named formations: 4-4-2, 4-3-3, 4-2-3-1, 3-5-2, 5-3-2, 4-1-4-1, 4-5-1, 3-4-3, and the 4-3-2-1 Christmas tree.

Each formation is a named array of positional slots with relative coordinates. Store these in a static data file (not in the match store) since they never change. When a team's formation is set, the AI worker maps each player to a slot based on their role — the mapping logic is: find the slot whose `role` matches the player's position, break ties by proximity.

For each formation, also define the attacking and defensive shape variants. The full dynamic adjustment is in `[Master §15.2]` — the formation stretches toward the ball in attack and compresses in defence.

### Step 5.2 — Tactical Instructions System

Read `[Master §15.3]` for the full `TacticsConfig` interface. Implement all tactical settings:

**Team-level instructions:**
- Pressing intensity (off / medium / high / gegenpress)
- Press trigger (always / ball lost / goalkeeper in possession)
- Defensive line height (low / medium / high)
- Marking type (zonal / man-marking / hybrid)
- Offside trap toggle
- Build-up play style (short / long / mixed)
- Attack width (narrow / normal / wide)

**Player-level instructions** (per player, configurable in the pause menu):
- Get in behind, come short, stay wide, cut inside (attacking)
- Track back, hold position, tight man-mark (defensive)

All of these feed into the AI worker. When the AI decides where a player should be, it reads their instructions and adjusts the target position accordingly. For example, `stayWide = true` means the winger never drifts inside even in a narrow build-up phase.

### Step 5.3 — Dynamic Formation AI

Read `[Master §15.2]` and `[Master §8.4]` together. The Team Tactics AI recalculates the team shape every 10 AI ticks based on:

- Ball position (formation stretches toward ball side)
- Score situation (losing late → push up, winning → conserve)
- Pressing trigger (ball is with GK → press hard if set to)
- Match phase (attack / transition / defence)

This is the system that makes the AI feel "smart" even without individual brilliance. A team holding a 1-0 lead in the 80th minute should visually drop into a compact mid-block. Implement this by adjusting the positional targets for all 11 players simultaneously when these conditions are met.

### Step 5.4 — Advanced AI Behavior: Decision Making

Now expand the AI behavior tree to include actual football decisions, not just positioning. Read `[Master §8.2]` and implement the full tree in the AI worker:

**With ball:**
- Can I shoot? → check distance, angle, stamina threshold → if yes, shoot
- Is a defender closing within 1.5m? → try a skill move or dribble direction change
- Is there a better pass option? (utility function: check all teammate angles and spaces) → pass to highest-value option
- Otherwise → hold ball, shield

**Without ball:**
- Am I the designated presser? → close down ball carrier aggressively
- Am I in my defensive line? → hold shape, maintain offside line
- Is my zone empty in the attack? → make a run

The `canShoot` check uses the xG model from `[Master §14.2]` — a shot is worth attempting if its xG exceeds 0.12 from a realistic position and angle.

### Step 5.5 — Dribbling System

Read `[Master §9.3]` for the skill move success model. Implement the dribbling mechanics:

- **Basic dribble:** Player runs with ball, direction controlled by left stick
- **Skill moves:** Right stick flick triggers a skill move. Which move is triggered depends on the stick direction and the player's skill rating
- **Success probability:** Computed from the formula in `[Master §9.3]` — dribbling stat vs defender's defensive awareness, modified by fatigue
- If successful: ball is played past the defender, attacker sprints through
- If unsuccessful: defender wins the ball

Start with 3 skill moves (body feint, step-over, drag-back) and add more from the animation library in `[Master §5.4]` as animations become available in Stage 6.

### Step 5.6 — Stamina System

Read `[Master §9.5]` for the full stamina model. Implement stamina drain:

- Every physics tick, drain stamina based on whether the player is walking, running, or sprinting
- Recovery when walking or standing still
- Fatigue effects: reduce `effectiveStats.sprintSpeed` and `effectiveStats.finishing` as stamina drops below 50

Make stamina visible: a subtle coloured ring under each player (green → yellow → red as stamina drops). This also gives the manager information they need for substitution decisions.

### Step 5.7 — Substitution System

Read `[Master §16.1]` for the substitution manager.

Build the substitution UI as a shadcn-svelte `Sheet` (side panel) accessible from the pause menu. It shows:
- Current players on pitch: name, position, stamina bar, current rating
- Available substitutes: name, position, stats
- Substitutions used / remaining (max 5, shown as dots)

When a substitution is made:
- The outgoing player walks to the nearest touchline (animation: turn and walk)
- The incoming player runs on from the touchline
- The incoming player inherits the tactical slot of the outgoing player
- A `SUBSTITUTION` event is emitted on the event bus

Enforce the 2-window rule from `[Master §16.1]` — substitutions can only be made during dead-ball situations (not while play is live), with the exception of injuries.

### Step 5.8 — Injury System

A player can be injured during a foul or after an aerial collision. Probability is based on foul severity. When a minor injury occurs:
- Player limps for 30 seconds (reduce speed to 60%)
- Manager can substitute them immediately (injury sub does not count as a substitution window)
- Major injury: player must be substituted

Show an injury notification as an event toast in the HUD. Use the event bus `INJURY` event type from `[Master §6.3]`.

### Step 5.9 — Extra Time & Penalty Shootout

Read `[Master §6.4]` for the full state machine including ET and penalties.

Extra time is triggered in knockout matches when the score is level at 90 minutes. Implement:
- ET First Half: 15 minutes
- ET Second Half: 15 minutes
- Golden goal rule: optional toggle (on = first goal wins, off = play full ET)

Penalty shootout (`[Master §13.4]`):
- Alternate penalties: home team first
- 5 kicks each, best of 5
- Sudden death if still level after 5 each
- Human player: aim with left stick, set power with button hold, shoot
- GK: choose dive direction before kick (300ms window)
- AI kicker: uses finishing stat to determine success probability vs GK reaction

Build a dedicated penalty shootout UI state: semi-dark overlay, spotlight on penalty spot, minimalist score tracker (circles: filled = scored, X = missed, empty = not taken).

### Step 5.10 — Camera System

Read `[Master §11]` fully and implement all camera modes:

- **Broadcast** (default): `[Master §11.2]` — smooth follow of ball centroid, FOV adjusts with play width
- **Tele**: Tighter version of broadcast (narrower FOV, closer to play)
- **End-to-End**: Wide pitch view for tactical overview
- **Player Lock**: Camera follows the controlled player specifically
- **Tactical**: Top-down view (useful when setting up free kicks)

Allow cycling through modes with the D-pad or a key. Store the current mode in the match store.

Also implement the replay recorder from `[Master §11.4]`. Start recording match frames into a ring buffer now — even if you do not play them back yet. The instant replay feature is Stage 8, but the recording must start now so you have historical data.

### Step 5.11 — Pause Menu & Tactical Panel

Build the full pause menu UI using shadcn-svelte `Dialog`:

- **Resume** — unpause
- **Tactics** — opens the tactical panel (formation drag-and-drop, team instructions)
- **Substitutions** — opens the sub panel from Step 5.7
- **Camera** — cycle camera mode
- **Settings** — audio volume, control sensitivity
- **Quit to Menu** — save and exit

The tactical panel is an interactive SVG pitch diagram. Players are represented as numbered circles in their formation positions. Dragging a circle to a different position updates the player's tactical slot. Formation preset buttons at the top let you switch formations instantly.

Read `[Master §23.4]` for the full tactical panel design.

### Stage 5 Checklist
- [ ] All 9 formations implemented and switchable mid-match
- [ ] Team tactical instructions all working
- [ ] Dynamic formation shape (attack/defend adjustment)
- [ ] Full AI behavior tree (shoot, dribble, pass, press decisions)
- [ ] Skill moves working (3 minimum)
- [ ] Stamina drain and visual indicators
- [ ] Substitution system with 5-sub / 2-window rule
- [ ] Injuries triggering and forcing substitutions
- [ ] Extra time and penalty shootout
- [ ] All camera modes
- [ ] Replay recorder running (buffer filling)
- [ ] Full pause menu with all panels

**Commit:** `git commit -m "stage-5: full tactics, AI depth, substitutions, ET, penalties, cameras"`

### External Resources for Stage 5
- **eFootball gameplay videos (YouTube):** Watch 20 minutes of eFootball 2024 gameplay. Note how the AI moves off the ball, how the camera tracks play. You are building a mental benchmark.
- **FIFA career mode formation guide:** Any YouTube guide on "best formations FIFA" — useful for tuning AI positioning defaults
- **shadcn-svelte docs:** shadcn-svelte.com — Dialog, Sheet, Tabs components you will use heavily here

---

## STAGE 6: AAA Graphics
**Milestone:** The game looks genuinely stunning. Real player models, physically-based lighting, subsurface scattering skin, post-processing effects, proper stadium. This is where your project stops looking like a prototype.

**Estimated time:** 3–4 weeks. Asset sourcing is the longest part.

**Note:** This stage does not change gameplay. Keep a separate git branch (`graphics-upgrade`) so you can return to the working Stage 5 build if something breaks during the graphics overhaul.

---

### Step 6.1 — Source Your Assets

Before writing any code, gather all your 3D assets. Every asset below is free and legal.

**Player model:**
- Go to **Mixamo** (mixamo.com) — Adobe's free platform for 3D characters and animations
- Download a male footballer-type character as an FBX file
- Also download these animations from Mixamo (search each one, download as FBX with skin): Walking, Running, Sprint, Idle (×2), Kicking, Heading, Slide Tackle, Standing Tackle, Jumping
- You will add more animations from `[Master §5.4]` as the project matures — start with these 10

**Stadium:**
- **Sketchfab** (sketchfab.com) — filter by "free", search "football stadium" or "soccer stadium"
- Look for a model with at least: main stand, pitch visible, some crowd seating
- Download as GLTF/GLB format — check the licence says CC0 or CC BY
- Good search terms: "low poly stadium", "football ground", "soccer arena"

**Ball:**
- Sketchfab: search "football ball", "soccer ball" — filter free, CC0
- Or: build a UV sphere in Three.js (you already have one) and apply a proper ball texture

**Textures:**
- **Poly Haven** (polyhaven.com) — entirely CC0. Download:
  - A grass texture (for pitch material upgrade) — 4K if your machine can handle it
  - An HDRI environment map for sky — download "football stadium", "outdoor", or any bright sky HDRI
  - Stadium concrete texture for stands

**Skin texture:**
- Search Sketchfab for human character packs — many include albedo/normal/roughness texture sets
- Alternatively, Mixamo characters come with basic skin textures

**Ball texture:**
- Search "football texture seamless" on Poly Haven or texturehaven.com

Read `[Master §5.1]` for the full player model spec to know what you are aiming for with your sourced assets. The sourced assets will not match perfectly — that is fine. You are establishing the pipeline.

### Step 6.2 — Convert and Compress Assets

This step is critical for performance. Raw FBX and PNG files are too large.

**FBX to GLB conversion:**
- Install the `gltf-pipeline` tool (npm package, global install)
- Convert every FBX to GLB: `gltf-pipeline -i character.fbx -o player_base.glb --draco.compressionLevel 7`
- Draco compression reduces file size by 70–90%

**Texture compression to KTX2:**
- Install `ktx-software` from khronos.org (free, cross-platform)
- Convert albedo textures: `ktx create --format R8G8B8A8_SRGB --encode uastc texture.png texture.ktx2`
- Convert normal maps: `ktx create --format R8G8B8A8_UNORM --encode uastc normal.png normal.ktx2`
- KTX2 textures are GPU-native — they use 4× less VRAM than PNG

Read `[Master §5.5]` for the full asset loading and caching pipeline. Implement the `AssetManager` class described there — it uses the Cache API to persist loaded assets between page loads (the basis of your offline caching system).

### Step 6.3 — Upgrade the Renderer

Now switch from the basic WebGL renderer to the full rendering setup from `[Master §2.2]`.

**WebGPU detection:** First check if the browser supports WebGPU (`navigator.gpu`). If yes, use Three.js `WebGPURenderer`. If no, fall back to `WebGLRenderer`. This is the exact code in `[Master §2.2]`. Most users in 2024/2025 on Chrome will have WebGPU — it is the default in Chrome 113+.

**Renderer settings:**
- Set pixel ratio: `Math.min(window.devicePixelRatio, 2)` — never exceed 2 on high-DPI screens
- Enable shadow maps: `PCFSoftShadowMap` type
- Set tone mapping: `ACESFilmicToneMapping` — this single setting dramatically improves colour realism
- Set output encoding: `LinearSRGBColorSpace`

### Step 6.4 — Load Real Player Models

Replace the capsule placeholder meshes with your GLB player model.

Use Threlte's `useGltf` hook to load the GLB, then clone the scene for each of the 22 players. Read `[Master §5.5]` for the geometry pool pattern — share one loaded geometry across all instances rather than loading 22 separate files.

Now implement `InstancedMesh` for all 22 players as described in `[Master §25.2]`. This is the single biggest performance win: instead of 22 draw calls, all players are drawn in 1 draw call. You will need to:
- Use one `InstancedMesh` with the player geometry
- Per-instance matrix (position + rotation) updated every frame
- Per-instance custom attribute for kit colour (you will add kit texturing next)

At this point, all 22 players look identical (same model, same colour). That is fine — differentiation comes in Step 6.5.

### Step 6.5 — Kit Shader & Player Customisation

Read `[Master §4.3]` for the kit shader and `[Master §5.2]` for the runtime texture compositor.

The kit compositor runs once at match start for each team:
1. Create an `OffscreenCanvas` (2048×2048)
2. Fill it with the team's primary colour
3. Draw the team badge at the chest position
4. Draw the player's number (use the Canvas 2D text API)
5. Convert to a Three.js `CanvasTexture`
6. Apply to the kit material

The kit material also needs the fabric weave normal map (source from Poly Haven — search "fabric", "jersey", or "cloth" texture). This normal map adds micro-detail that makes kits look woven rather than painted.

Add sweat darkening: as a player's stamina drops below 50, gradually darken their kit in the shoulder/armpit area using a `UniformNode` that reads their current stamina.

### Step 6.6 — Skin Shader: Subsurface Scattering

Read `[Master §4.3]` for the SSS shader. This is the most advanced shader in the project, and it is what makes player faces look real rather than plastic.

The technique used is Pre-Integrated SSS (Jimenez 2010). You need:
- A **SSS Lookup Table** texture — generate this offline using a small script (search "pre-integrated SSS LUT generator" on GitHub — several exist)
- The skin shader code from `[Master §4.3]` — implement this as a custom `ShaderMaterial` or using Three.js `NodeMaterial` (WebGPU) / `onBeforeCompile` hook (WebGL)
- The skin albedo, normal, and ORM textures you sourced from Mixamo

The visual result: skin under direct light is warm, skin in shadow has a slightly reddish-pink undertone (light bouncing through the skin). Compare before/after — the difference is dramatic.

**Blender sidebar (return to later):** If you get Blender during this project, you can bake your own SSS LUT and create a custom skin texture set for any player face you model. See: docs.blender.org → Rendering → Materials → Subsurface Scattering

### Step 6.7 — Pitch Upgrade

Replace the flat green plane with the procedural grass shader from `[Master §4.4]`.

The shader does three things:
1. Stripe pattern: alternating light/dark green strips (mowing pattern) using a `fract()` step function
2. Wear mask: a texture that you update during the match — areas with high player traffic get lighter/browned
3. Wetness: optional rain mode that makes the pitch slightly reflective and affects friction

The wear mask starts as all-zero and you write to it via a render target whenever a sliding tackle or heavy challenge happens in that pitch zone. This creates visible wear marks on the pitch over 90 minutes — a detail that eFootball does not even have.

Source the grass albedo and normal from Poly Haven. Apply the shader as a custom `ShaderMaterial` on the pitch plane.

### Step 6.8 — Stadium Model Integration

Load your sourced stadium GLB. Position it so the pitch sits inside the stadium correctly — the pitch plane you have is your reference.

Stadium LOD from `[Master §4.4]`:
- If the stadium model is complex (>500K triangles), use Three.js `LOD` object with three levels
- LOD0: full model (close camera distances)
- LOD1: reduced poly (exported separately from the original — you may need to simplify in an online tool like Clara.io or Meshmixer)
- LOD2: impostors are advanced — for now, just use LOD0 and LOD1

### Step 6.9 — Lighting Upgrade

Replace the placeholder lights with the full stadium lighting from `[Master §4.2]`.

**Floodlights:**
- 4 `DirectionalLight` objects positioned at the four corners of the stadium at height
- Enable shadow casting: `light.castShadow = true`
- Shadow map size: 2048×2048 (balance quality vs performance)
- Use `PCFSoftShadowMap` for soft shadow edges

**HDRI Environment:**
- Load your downloaded HDRI using Three.js `RGBELoader` + `PMREMGenerator`
- Apply to `scene.environment` (affects all PBR materials) and `scene.background` (visible sky)
- At night, use the night HDRI; at day, use the daylight HDRI

**Cascaded Shadow Maps (CSM):**
Three.js does not have native CSM — install the `three-csm` package. CSM gives you sharp shadows close to the camera and softer shadows in the distance, eliminating shadow acne artefacts. Follow the `three-csm` README setup guide. Read `[Master §4.7]` for the full shadow system spec.

### Step 6.10 — Animation System

Read `[Master §12.1]` for the full animation controller and `[Master §12.3]` for kick synchronisation.

For each player, create a Three.js `AnimationMixer` attached to their model. Load the animations you downloaded from Mixamo and register them with the mixer.

Build the `PlayerAnimationController` from `[Master §12.1]`:
- Layer 0: Locomotion (idle → walk → jog → run → sprint based on velocity magnitude)
- Smooth crossfade between states (0.15s duration) so players do not snap between animations
- Direction blending: the run animation is played with a rotation that matches the player's movement direction

Ball interaction animations (kick, header, tackle) are triggered by gameplay events:
- When a `PASS` or `SHOOT` event fires, play the appropriate kick animation
- When a `HEADER` event fires, play the header animation
- When a `TACKLE` event fires, play the tackle animation

The kick synchronisation from `[Master §12.3]` is important: the ball must visually leave the foot at the exact animation frame where the foot strikes. Use the `contactFrames` table from that section — schedule the physics impulse with a `setTimeout` timed to the contact frame.

### Step 6.11 — Foot IK

Read `[Master §12.2]` for the two-bone IK solver. Implement foot IK so players' feet rest correctly on uneven ground (even though the pitch is flat, this prevents feet from "floating" due to animation root motion).

This is a procedural adjustment applied after the animation mixer updates:
- For each player, raycast down from their ankle position to find the ground height
- Apply the IK solver to adjust the shin and foot bones so the foot lands at the correct ground height

### Step 6.12 — Ball Visual Upgrade

Read `[Master §4.5]` for the full ball shader.

Replace the primitive sphere material with a proper ball material:
- **Panel texture:** A hexagonal seam pattern using a UV-mapped texture (source from Poly Haven or create in a paint program — black panel lines on white)
- **Normal map:** Emphasises the raised seams for parallax depth
- **Spin rotation:** Every frame, rotate the normal map UV coordinates based on the ball's angular velocity (so the seams visually spin when the ball is in flight)
- **Motion blur:** Not a full velocity buffer blur yet — approximate it with a `MeshBasicMaterial` trail using a small particle emitter behind the ball at high speeds

### Step 6.13 — Post-Processing Stack

Read `[Master §4.6]` for the full post-processing stack. Install `postprocessing` from pmndrs.

Add the effects in this exact order (order matters for the final look):

1. **TAA (Temporal Anti-Aliasing)** — eliminates edge shimmer. Much better than MSAA at the same cost.
2. **HBAO (Horizon-Based Ambient Occlusion)** — darkens crevices and contact areas realistically
3. **Bloom** — stadium floodlight glow, ball specular highlight flare
4. **Depth of Field** — very subtle, simulates broadcast camera lens. Keep `bokehScale` low (2–3) or it looks cheap
5. **Chromatic Aberration** — tiny lens colour fringing. Offset values: 0.001 max. Subtle is key.
6. **Film Grain** — cinema texture. `premultiply: true`
7. **Vignette** — darken screen edges, adds focus to the centre
8. **LUT Colour Grading** — the most impactful visual upgrade. Download a free broadcast-style LUT (search "broadcast LUT free download" — many filmmakers release them). Load as a 3D LUT with Three.js

Each effect should be togglable (stored in settings) and the intensity tunable, because some machines cannot run all of them at 60fps.

### Step 6.14 — Crowd System

Read `[Master §4.4]` for the crowd rendering approach.

For now implement the billboard impostor approach:
- Create a sprite sheet with 8 different spectator poses (sitting, standing, arms raised)
- Use `InstancedMesh` with the billboard geometry facing the camera
- Place ~8,000 instances in the stadium seating areas
- The crowd "reacts" to events: on a goal, randomly switch 30% of crowd sprites to the "arms raised" frame

The crowd density system (front rows = detailed, back rows = instanced sprites) from `[Master §4.4]` is the full implementation — build the instanced billboard version first, add the front-row detail meshes later.

### Step 6.15 — Goalkeeper Animations

Now that the animation system is in place, upgrade the goalkeeper from the "snap to position" placeholder to real dive animations.

The `GoalkeeperAI` from `[Master §8.5]` now returns a `SaveAction` type. Map that to an animation:
- `DIVE_HIGH`: Play the high dive animation, set blend weight to full
- `DIVE_LOW`: Play the low dive animation
- `GROUND_SAVE`: Play the sliding ground save
- `STANDING_SAVE`: Play the standing catch

Time the physics ball interception to the exact moment the GK's hands reach the ball position in the animation.

### Step 6.16 — Performance Pass

After all graphics upgrades are in, run the performance check described in `[Master §25]`.

Open Chrome DevTools → Performance tab → record 10 seconds of gameplay → check the frame timing:
- If any frame takes > 18ms (< 55fps), you have a performance problem
- First, check the "Rendering" section — is it GPU-bound (most common) or CPU-bound?
- Apply the adaptive quality system from `[Master §25.6]`: if sustained frames drop below 55fps, auto-reduce in this order: crowd density → shadow cascade count → post-processing effects → LOD bias

Implement the `SharedArrayBuffer` physics transfer from `[Master §25.5]` now if you have not — this eliminates the main thread serialisation overhead of `postMessage`.

### Stage 6 Checklist
- [ ] Real player GLB models loaded and instanced
- [ ] Kit compositor generating unique kit textures per team
- [ ] Sweat darkening on kit material
- [ ] Skin SSS shader on player faces
- [ ] Procedural grass pitch with stripe pattern and wear system
- [ ] Stadium model with LOD
- [ ] HDRI environment map + 4 floodlights with CSM shadows
- [ ] All locomotion animations playing and blending
- [ ] Ball interaction animations synced to physics
- [ ] Foot IK applied
- [ ] Ball visual with panel texture, spin rotation, and motion trail
- [ ] Full post-processing stack (TAA, HBAO, Bloom, DOF, LUT, Vignette)
- [ ] Crowd billboard system with goal reaction
- [ ] Goalkeeper dive animations
- [ ] 60fps on a mid-range machine (or adaptive quality reducing to maintain it)

**Commit:** `git commit -m "stage-6: AAA graphics — PBR, SSS, post-processing, animations, crowd"`

### External Resources for Stage 6
- **Three.js Journey Lessons 30–50** — materials, shaders, post-processing. These lessons are essential for this stage.
- **Shadertoy.com** — search "grass shader", "skin SSS" — read other people's implementations for ideas
- **LearnOpenGL (learnopengl.com)** — the best resource for understanding what PBR, normal maps, and SSS actually do. Read: PBR, Advanced Lighting, Normal Mapping sections.
- **Poly Haven:** polyhaven.com — all HDRIs and textures
- **KTX-Software releases:** github.com/KhronosGroup/KTX-Software/releases
- **Blender sidebar reference:** When you get Blender, start with: blender.org/support/tutorials — "Fundamentals" series. For football: search "Blender football player modelling" on YouTube. Blender is free and cross-platform — even a laptop can run it for basic modelling.

---

## STAGE 7: Offline League, Career Mode & Full Persistence
**Milestone:** You can create a league of 20 teams, simulate a full season, manage a squad over multiple seasons, buy and sell players, and all data persists across browser sessions with no internet required.

**Estimated time:** 2–3 weeks.

---

### Step 7.1 — Set Up Dexie (IndexedDB)

Read `[Master §24.1]` for the full database schema. Install Dexie and create the database class exactly as specified there — all tables defined upfront, even the ones you will not fill until later in this stage.

This is your permanent data layer. Every save in the game goes through Dexie. Test it by creating a dummy record and reading it back before building anything else on top.

Verify that data persists across page refreshes (open DevTools → Application → IndexedDB → ElevenJS to inspect records directly).

### Step 7.2 — Team & Player Data

Read `[Master §24.2]` for the data format. You need a static JSON file (bundled with the game, not fetched from a server) containing:

- At minimum: 4 leagues, each with 8–10 teams, each with 18 players
- Each player needs: name, age, nationality, position, a stats object (20 stats, values 40–99), contract expiry, market value, preferred foot, weak foot rating, skill move rating

Building 3,000+ player records by hand is not feasible. Use one of these sources:
- **SoFIFA.com** — export CSV of player data (this is real EA FC data — do not ship with copyrighted names, use for structure reference only)
- **fm-base.co.uk** — Football Manager database exports (same caveat — use as structural reference)
- **For your actual data:** Use fictional but realistic names. There are player name generators online. Stats you can randomise within ranges based on position (GK: high diving, low finishing; ST: high finishing, low diving)
- Write a small Node.js script to generate the JSON — this is faster than hand-crafting

Load this JSON into Dexie on first launch (check if the `teams` table is empty, if yes, seed from JSON).

### Step 7.3 — League Engine

Read `[Master §21.1]` for the full league simulation engine.

The league engine has two modes:
- **Simulated match:** No graphics. Uses the `simulateMatch` function to instantly compute a result using a Poisson-sampled xG model. Used for AI vs AI matches.
- **Played match:** The full 3D game you have been building. Used when the human team plays.

Build the league structure:
- A `Season` is a round-robin fixture list — every team plays every other team twice (home and away)
- Fixture generation: iterate all team pairs, assign home/away alternating
- Each `Matchday` is a group of simultaneous fixtures
- The user plays their fixture; all others are simulated instantly

Read `[Master §21.2]` for the league table sorting rules — points, then goal difference, then goals scored, then head-to-head. Implement this exactly (it is the UEFA standard).

### Step 7.4 — League UI

Build the league browser screen (`src/routes/league/+page.svelte`):

- **Fixture list** — all matches for the current matchday, showing kick-off time, home team, away team, result or upcoming
- **League table** — sortable table with all standings columns (P, W, D, L, GF, GA, GD, Pts)
- **Top scorers** — ranked list of leading scorers this season
- **Upcoming** badge — your next fixture, with a "Play" button that launches the 3D match
- **Simulate All** button — simulates all non-user fixtures instantly and advances to the next matchday

Use shadcn-svelte `Tabs` to organise: Fixtures | Table | Stats | History

### Step 7.5 — Tournament / Cup Engine

Read `[Master §21.1]` and `[Master §20.3]` for the tournament structure.

A cup is a knockout competition:
- Seed all teams into a bracket
- Each round: winners advance, losers are eliminated
- Tie-breaking: in knockout, play extra time → penalties if level at 90 minutes (Stage 5 system)
- Final: single match at neutral venue (use a different camera angle or stadium variant)

Build a configurable cup: number of teams (any power of 2: 4, 8, 16, 32, 64), seeding method (random or by league position), two-leg or single-leg rounds.

### Step 7.6 — Career Mode: Manager

Read `[Master §20.2]` for the full career mode spec.

Manager career at this stage needs:

**Season structure:**
- Pre-season: Transfer window open, set formation and tactics
- Season: 38 matchdays (or however many in your league), play/simulate each one
- Post-season: Award ceremony, player development, next season begins

**Transfer system:**
- Each team has a budget (set in the data)
- You can list players for sale (AI teams will bid)
- You can bid on listed AI players
- Transfer window opens at the start and midpoint of the season
- Player values fluctuate based on age, form, and remaining contract

**Player development:**
Read `[Master §21.3]` for the stat update formula. At end of each season, all players age by 1 year and stats update based on age curve + season performance rating.

**Board objectives:**
At season start, the board sets 2–3 objectives (finish top 4, win the cup, avoid relegation). Meeting them improves your budget for next season. Failing has consequences (reduced budget, eventually manager sacking — show a game-over state that lets you start with a new club).

### Step 7.7 — Squad Management Screen

Build a dedicated squad screen (`src/routes/squad/+page.svelte`):

- **Pitch view:** Formation graphic with player photos (placeholder silhouettes for now, real faces in Stage 8's asset expansion)
- **Player list:** Filterable by position, sortable by any stat
- **Player detail modal:** Full stats breakdown, contract info, form chart (last 5 match ratings)
- **Training focus:** Set per-player training emphasis (pace, finishing, etc.) — this increases that stat's growth rate slightly next season

Use shadcn-svelte for all UI components. The design should feel like a premium sports management app — clean, data-dense, dark theme.

### Step 7.8 — Save System

Read `[Master §24.3]` for the save manager.

Auto-save: after every match result, every 5 minutes in menus. Show a save indicator (small spinning icon, fades after 1 second).

Manual save: accessible from any menu.

Save export: allow the player to download their save as a JSON file (for backup / transfer to another browser). Import: load a JSON file back in.

Multiple save slots: 3 slots. Show each slot's info on the main menu (team name, current season, most recent match result).

### Step 7.9 — Service Worker (Offline Caching)

Read `[Master §25.6]` and `ELEVEN_JS_IMPLEMENTATION_GUIDE.md` Section 10 for the Service Worker setup.

Register a Service Worker that caches:
- All static JS/CSS/HTML (the app shell)
- All GLB model files
- All KTX2 textures
- All audio files (from Stage 8)

After first visit, the game works with zero internet connection. Test this: in Chrome DevTools → Application → Service Workers → check "Offline", then reload. The game should still load.

Configure SvelteKit's adapter-static output (from `ELEVEN_JS_IMPLEMENTATION_GUIDE.md` Section 3) so the entire game builds to a static folder that can be opened directly from a local file system.

### Stage 7 Checklist
- [ ] Dexie database set up with all tables
- [ ] 4+ leagues, 40+ teams, 700+ players seeded
- [ ] League engine: fixture generation, simulation, table calculation
- [ ] Cup engine: bracket, knockout, neutral final
- [ ] Career mode: pre-season, 38 matchdays, post-season
- [ ] Transfer system: buy, sell, AI bids
- [ ] Player development: age, stats update, retirement
- [ ] Board objectives and consequences
- [ ] Squad management screen (formation + player list + stats)
- [ ] Save system: auto-save, 3 slots, export/import
- [ ] Service Worker: full offline capability

**Commit:** `git commit -m "stage-7: offline league, career mode, transfers, persistence, PWA"`

### External Resources for Stage 7
- **Dexie.js docs:** dexie.org/docs — read "Getting Started" and "Queries"
- **Service Worker cookbook:** developer.chrome.com/docs/workbox — Workbox is a library that simplifies Service Worker caching; consider using it instead of raw SW code
- **Poisson distribution explained:** Wikipedia "Poisson distribution" — understand it before implementing `samplePoisson` in the league engine (it is a 3-line function once you understand it)
- **Football Manager (the game)** — play a couple of hours of FM if you can access it. It is the gold standard for football management UI patterns. Observe how they present data and structure seasons.

---

## STAGE 8: Commentary, Celebrations, Audio & AAA Polish
**Milestone:** The game sounds, feels, and looks indistinguishable from a commercial AAA release. Commentary calls matches with player names. Celebrations animate fully. The crowd roars. Every moment feels cinematic. This is the final stage.

**Estimated time:** 3–5 weeks. Audio production takes the most time.

---

### Step 8.1 — Audio Architecture Setup

Read `[Master §19.1]` for the full Web Audio API graph. Build the audio context and all gain nodes before implementing any specific audio.

The key principle: all audio flows through a master gain node, which lets you have a single global volume control. Sub-graphs for commentary, crowd, match SFX, and music each have their own gain node — this gives you independent volume sliders in settings.

Create `src/lib/engine/audio/audio-manager.ts` as a singleton that initialises the `AudioContext` on first user interaction (browsers require a user gesture before audio plays — hook into the "click to kick off" button).

Read `[Master §19.3]` for the full SFX library. Start by implementing just the ball kick sound — the most frequently heard SFX.

### Step 8.2 — Match SFX

For each sound in the SFX table at `[Master §19.3]`, source an audio file and implement the trigger.

**Where to source SFX (all free, legal):**
- **Freesound.org** — the largest free SFX library. Licence: filter by CC0. Search: "football kick", "crowd roar", "referee whistle", "net swish", "tackle thud"
- **Mixkit.co** — free SFX, no attribution required
- **Sonniss GDC Audio Bundle** — released free annually, contains thousands of professional SFX

Convert all sourced audio to OGG Vorbis format (`ffmpeg -i input.wav -c:a libvorbis -q:a 5 output.ogg`). OGG is smaller than MP3 and natively supported in all browsers.

**Spatial audio:** Ball kicks, headers, and tackles are 3D spatial sounds — they are louder when the action is near the camera and stereo-positioned left/right. Use the Web Audio API `PannerNode` with HRTF panning model as described in `[Master §19.1]`.

**Pitch-based variation:** The same kick sound should not play identically every time. Load 4–6 variants per SFX category and pick randomly. Also pitch-shift by ±5% using the `AudioBufferSourceNode`'s `playbackRate` property — this alone makes SFX feel much more natural.

### Step 8.3 — Crowd Simulation

Read `[Master §19.2]` for the full crowd simulator state machine.

The crowd audio system is layered:
- **Base crowd hum:** A looping ambient crowd noise that plays constantly at low volume
- **Reaction layers:** On events (near miss, goal, yellow card), crossfade in louder, more specific crowd samples
- **Home/away sections:** Pan the crowd slightly left for home supporters, right for away

Crowd state transitions:
- `NEUTRAL` → `EXCITED`: ball enters penalty area
- `EXCITED` → `ROAR (goal)`: goal scored by home team
- `EXCITED` → `GROAN`: shot goes wide or saved
- `NEUTRAL` → `TENSE`: close score with 10 minutes left
- Any → `BOOING`: controversial referee decision

Implement the crowd excitement meter that feeds into the `crowdGain` value. Use `AudioParam.setTargetAtTime()` for smooth volume transitions rather than instant jumps.

The crowd audio reacts to the 3D crowd mesh from Stage 6 — synchronise the crowd standing/cheering animation frames with the audio state.

### Step 8.4 — Commentary: Audio Production

Read `[Master §17]` fully before approaching commentary. This is the most complex audio system.

**Two approaches — choose based on budget:**

**Option A: AI Text-to-Speech (feasible solo, zero cost)**
- Use **ElevenLabs** (elevenlabs.io) — the best TTS for realistic sports commentary voices. Free tier: 10,000 characters/month.
- Script every commentary line from `[Master §17.2]` (all 40+ trigger categories × 5–10 lines each = ~300–500 lines)
- Generate two distinct voices: lead commentator (authoritative, excited) + analyst (calmer, analytical)
- Export as MP3, convert to OGG

**Option B: Record real voices (best quality, takes longer)**
- Write a full commentary script covering all triggers from `[Master §17.2]`
- Find two people willing to voice-act (can be you + a friend)
- Record in a quiet room with any USB microphone (Blue Yeti, HyperX SoloCast)
- Process in Audacity (free): noise reduction, EQ boost at 2–5kHz for clarity, compress to -14 LUFS
- Record player name pronunciations separately: record every player name in your database as an individual clip

**Player name stitching:**
Record (or generate) each player name as a standalone audio file named by player ID. The commentary engine stitches: `"What a goal from"` + `[player_123.ogg]` + `"!"`. The stitching is seamless when the base lines are recorded with a trailing breath/pause.

### Step 8.5 — Commentary Engine

Read `[Master §17.1]` and `[Master §17.3]` for the engine and token system.

Build `src/lib/game/commentary/commentary-engine.ts`:

**Line bank:** A JSON file mapping event types to arrays of line objects. Each line object has: `audioFile`, `text`, `triggers`, optional `condition` (a function that checks match state — e.g. only play "late drama" lines after minute 80).

**Selection algorithm:**
1. Filter lines by trigger type
2. Filter by condition (if any)
3. Exclude lines used in the last 5 minutes (track `lastUsed` timestamp per line)
4. Weight by: context match quality, time since last use
5. Pick from weighted pool

**Token replacement:** Before playing a line's audio, parse its text for tokens like `{SCORER_NAME}` and `{MATCH_MINUTE}`. These are used to log the commentary text (for a subtitle/caption system) and to stitch audio for names.

**Natural timing:** Not every event triggers commentary. Use a `lastSpokenMinute` tracker — if commentary just played within 30 seconds, either skip or queue the next line. Real commentary breathes. Add random delays (1–3 seconds) before speaking so lines never sound instant.

### Step 8.6 — Celebration System: Full Animations

Read `[Master §18]` for the complete celebration system.

Source celebration animations from Mixamo — search "celebration", "dance", "arms wide", "knee slide". You want at minimum 8 of the 18 from `[Master §18.1]`.

Implement the `CelebrationDirector` from `[Master §18.2]`:
- On a goal, the director selects the appropriate celebration based on: match minute, goal type, scorer role, and scorer's assigned celebration
- The celebration plays on the scorer while nearest 3 teammates run toward them and trigger a "team join" animation
- After ~6 seconds, all players walk back to the halfway line

Special cases:
- **Late winner (88th min+):** Override to `LATE_WINNER_FRENZY` — the wildest animation. Score-line flash, camera shake, crowd eruption at maximum
- **Shirt off:** Play the shirt-off animation, then show a yellow card notification (automatic per rules)
- **GK goal:** The GK sprints the full length of the pitch — dramatic camera follows them

### Step 8.7 — Goal Camera Sequence

Read `[Master §11.3]` for the goal celebration camera.

When a goal is scored, the camera enters a scripted sequence:
1. **Net cam** (0.8s): Cut to a close-up of the ball hitting the net, shown from inside the goal looking out
2. **Pull-back** (1.5s): Camera pulls back to reveal scorer beginning celebration
3. **Orbit** (5s): Camera slowly orbits the scorer at eye level while celebration plays
4. **Return** (2s): Cut to broadcast angle for kick-off

Use `@tweenjs/tween.js` for the camera position and look-at interpolations. Do not use Three.js's built-in clock for this — Tween.js gives you easing functions (ease-in-out makes the camera movement feel cinematic rather than mechanical).

### Step 8.8 — Instant Replay

The replay recorder has been running since Stage 5 Step 5.10. Now build the playback:

After a goal, the game automatically plays a 10-second replay of the goal from 2–3 different camera angles before returning to the celebration. The angles cycle through: wide shot → close follow of ball → net cam.

Replay also accessible manually from the pause menu ("Watch Replay" — plays the last major event).

Read `[Master §11.4]` for the replay playback system. Key detail: replay is not a video — it re-simulates the recorded frame data, so it looks real-time but it is actually replaying recorded positions.

### Step 8.9 — Advanced Ball Physics

Now upgrade ball physics to the full model from `[Master §7.2]`.

This has been deliberately left until now because these are refinements — the basic physics is already working. Now add:

**Full Magnus effect:** The `applyMagnusForce` function from `[Master §7.2]`. This is what makes in-swingers curl, knuckle balls wobble, and driven shots dip. After implementing this, free kicks become dramatically more interesting.

**Ground friction variation:** The `computeGroundFriction` function. Areas of high player traffic (tracked by the wear mask from Stage 6.7) now affect how the ball rolls.

**Bounce variation by spin:** Topspin shots bounce forward and stay low; backspin shots skid and stop quickly. Implement the bounce type detection in the collision callback.

### Step 8.10 — Advanced Goalkeeper

Read `[Master §8.5]` and upgrade the GK using the full save prediction:

- Integrate ball trajectory including Magnus force for 0.4 seconds to predict impact point
- Choose save type (dive high/low, standing, ground) based on predicted impact quadrant
- Reaction time delay: GK does not start moving until `(1 - reflexes/100) * 0.3` seconds after the shot is struck — elite GKs react in 0.05s, poor ones take 0.25s
- Post-save distribution: GK chooses between roll to full-back, throw to midfielder, or long punt

### Step 8.11 — VAR System

Read `[Master §13.3]` for the full VAR system.

VAR triggers automatically for:
- Goal: check for offside, handball, or foul in buildup
- Penalty decision: check if contact warranted a penalty
- Red card: check if severity was correct

The VAR sequence:
1. Play is paused for review (freeze action)
2. Show the VAR screen overlay — "VAR REVIEW" text, video lines effect (use CSS animation on SVG lines)
3. Wait 3–8 seconds (randomised)
4. Show verdict: "GOAL CONFIRMED", "GOAL DISALLOWED", "PENALTY AWARDED", etc.
5. React accordingly (re-kickoff, restart, etc.)

The VAR accuracy is tied to the referee profile from `[Master §13.2]` — some referees use VAR more aggressively than others.

### Step 8.12 — Kit Editor

Build the kit editor screen (`src/routes/kit-editor/+page.svelte`). This is a bonus feature that dramatically increases the game's personality and replayability.

The kit editor uses the compositor from Stage 6 Step 6.5. Expose it as a UI:
- Colour pickers for primary/secondary/third colours
- Pattern selector: stripes (horizontal/vertical/diagonal), hoops, solid, gradient, sash, pinstripes
- Badge upload (SVG or PNG)
- Number style selector (font + colour)
- Sponsor text field

Live preview: a 3D player model rotates slowly in the centre of the screen wearing the current kit configuration. Uses Threlte to render a mini scene embedded in the page.

Save custom kits to Dexie. Apply them when playing as that team.

### Step 8.13 — Main Menu Polish

The main menu should be cinematic. Replace the placeholder with:

**Background scene:** A Threlte canvas showing an empty stadium at night, floodlights flickering on one by one. No players — just the pitch, the lights, the atmosphere. Slowly rotating camera. This runs as a live 3D scene, not a video.

**Menu items:** Fade up from the bottom in sequence. Use CSS `animation-delay` for staggered entry.

**Music:** A dramatic orchestral/electronic menu track. Source from:
- **Free Music Archive** (freemusicarchive.org) — filter CC0
- **incompetech.com** (Kevin MacLeod) — CC BY licence, royalty-free
- Alternatively: generate with **Suno.ai** or **Udio** — both can produce stadium-appropriate music

Music fades when transitioning to a match (crossfade over 2 seconds using Web Audio gain automation).

### Step 8.14 — Performance Final Pass

Apply all optimisations from `[Master §25]`:

- **InstancedMesh verified** for all players and crowd (check draw call count in Chrome DevTools → Rendering → Frame Rendering Stats)
- **SharedArrayBuffer** for physics state (zero-copy, eliminates serialisation overhead)
- **KTX2 textures** confirmed for all assets
- **LOD verified** for stadium and players
- **Adaptive quality** system from `[Master §25.6]` tested on a mid-range machine
- **Service Worker** confirmed caching all assets (test in offline mode)
- **Target: 60fps stable** — profile until you hit it

### Step 8.15 — Local Multiplayer

Read `[Master §22]` for the full multiplayer setup. At this point, local multiplayer requires minimal additional work because the input system already supports two gamepads.

**Same-screen 1v1:**
- Gamepad 0 → Player 1 (home team)
- Gamepad 1 → Player 2 (away team)
- Both players use broadcast camera (neither "follows" a specific player — both see the full pitch)

**Split-screen (optional but impressive):**
Read `[Master §22.2]` for the split-screen renderer. This requires rendering the scene twice per frame (two camera positions, two viewports). Only enable this if your frame rate budget allows — split-screen halves your render budget. Add it as a toggle in the multiplayer setup screen.

### Step 8.16 — The Final Quality Bar

Before declaring the game finished, do a structured quality review. Play it for 90 real minutes. Compare it against eFootball and EA FC. For each area, ask: does mine match or exceed it?

**Use this checklist:**

| Feature | Your game | eFootball/EAFC |
|---|---|---|
| Ball physics (spin, bounce, swerve) | | Benchmark |
| Player movement (smoothness, weight) | | Benchmark |
| Goalkeeper saves (variety, realism) | | Benchmark |
| Commentary (frequency, variety) | | Benchmark |
| Crowd atmosphere | | Benchmark |
| Graphics (lighting, player faces) | | Benchmark |
| AI intelligence (passing patterns, press) | | Benchmark |
| Set piece variety | | Benchmark |
| Celebration variety | | Benchmark |

For anything below the benchmark, return to the relevant master guide section and identify what is missing. Most gaps at this stage are content gaps (not enough animation variants, not enough commentary lines, not enough tactical AI variety) rather than structural gaps.

### Stage 8 Checklist
- [ ] Full Web Audio graph with spatial positioning
- [ ] All SFX implemented with pitch variation
- [ ] Crowd simulation with event reactions
- [ ] Commentary engine with 300+ lines and player name stitching
- [ ] Commentary for all 40+ trigger types
- [ ] All 8+ celebrations implemented with team pile-on
- [ ] Late winner frenzy celebration
- [ ] Goal camera sequence (net → pull-back → orbit → return)
- [ ] Instant replay system
- [ ] Full Magnus effect and spin physics
- [ ] Advanced GK AI with reaction time
- [ ] VAR system
- [ ] Kit editor with live 3D preview
- [ ] Cinematic main menu
- [ ] Menu music with crossfade
- [ ] Local multiplayer (same-screen + optional split-screen)
- [ ] 60fps confirmed at final quality settings
- [ ] Service Worker offline confirmed
- [ ] Full quality review vs eFootball/EAFC

**Commit:** `git commit -m "stage-8: commentary, celebrations, audio, VAR, kit editor, final polish — v1.0"`

### External Resources for Stage 8
- **ElevenLabs:** elevenlabs.io — TTS for commentary
- **Audacity:** audacityteam.org — free audio editing, noise reduction, mastering
- **Freesound.org** — SFX library
- **Poly Haven:** polyhaven.com — remaining textures and HDRIs
- **Web Audio API deep dive:** developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API — especially "Advanced techniques"
- **TweenJS docs:** github.com/tweenjs/tween.js — essential for the goal camera sequence

---

## ONGOING: Blender Asset Creation (When You Get Access)

These are the Blender tasks to tackle once you have a capable machine. They upgrade your sourced/placeholder assets to fully custom ones.

**Priority order:**

1. **Custom ball** — easiest Blender project. A UV sphere, UV-unwrap, paint seam panels in texture. 1–2 hours.
2. **Stadium stands** — a modular set of stand pieces (side stand, corner stand) that can be combined. 5–10 hours.
3. **Player face sculpting** — the most complex. Use Blender's sculpt mode to create generic player heads at different skin tones, then customise hair and facial features. 20+ hours per face. Use these to replace the Mixamo character heads.
4. **Custom animations** — if you have access to a phone with an ARKit/ARCore camera (iPhone 12+, most modern Android), you can capture basic motion using apps like **Move.ai** (freemium) or **Rokoko Video** (freemium). Import BVH output into Blender, re-target onto your player rig.
5. **Pitch details** — corner flags, goal net (cloth simulation), penalty spot markings, centre circle

Blender learning path: blender.org → Tutorials → Fundamentals (official). Then: youtube.com, search "Blender game character tutorial beginner".

---

## CONTENT EXPANSION (Post v1.0)

After the game is complete, these are the highest-impact additions:

- **More teams and leagues** — expand the player database. Write a generator script.
- **Player faces** — photograph-realistic faces via a face photo → 3D pipeline (MetaHuman or Ready Player Me SDK)
- **More celebrations** — Mixamo has many. Add 5 more from `[Master §18.1]`'s full list.
- **More commentary lines** — double the bank. Variety is the biggest commentary quality driver.
- **Online multiplayer** — WebRTC peer-to-peer. Read `[Master §26]` Phase 5 roadmap. This is a separate project in itself.
- **Mobile touch controls** — virtual joystick overlay. Threlte renders to a canvas so mobile play works; you just need touch input mapping.
- **More skill moves** — each new Mixamo animation adds one. Target: all 5-star moves from `[Master §5.4]`

---

## SUMMARY: Your Journey

| Stage | What You Built | Key Concept Learned |
|---|---|---|
| 1 | Ball on a pitch | 3D scene, physics, game loop |
| 2 | 22 players, AI positioning | ECS, workers, formation data |
| 3 | Pass, shoot, save | Ball physics, AI decisions, GK |
| 4 | Referee, set pieces, full match | Event system, rules, state machine |
| 5 | Tactics, subs, ET, cameras | Formation AI, input depth, replay |
| 6 | AAA graphics | PBR, SSS, post-processing, animation |
| 7 | League, career, offline | Persistence, simulation, PWA |
| 8 | Commentary, celebrations, polish | Audio, cinematics, AAA quality bar |

Every one of these stages produced a playable, shippable build. Every stage built on the last without requiring rewrites. The architecture you established in Stage 1 — the physics worker, the event bus, the match store — is the same architecture running the full AAA game in Stage 8.

That is what good engineering looks like: not perfection upfront, but a foundation solid enough to build everything on top of.

---

*Eleven.js Implementation Guide — Part 2 of 2*  
*Reference: ELEVEN_JS_MASTER_DOCS.md for all technical specifications*
