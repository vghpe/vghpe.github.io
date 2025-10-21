**Jamble Post Integration**

- Owner: blog integration
- Date: 2025-10-21

**Summary**
- Integrated the new Jamble v2 build into a Hugo post via a dedicated shortcode and asset wiring.
- Fixed control panel visibility (shows in idle, at the bottom) without forcing run state at bootstrap.
- Restored game logic to auto-run when touching the ground.
- Added a small debug overlay line to the Sensation panel.

**Files Changed**
- Shortcode: layouts/shortcodes/jamble.html
  - Loads `static/games/jamble/jamble.js` (defer) and bootstraps with a minimal inline init.
  - Initializes `new Jamble.Game(gameRoot)` and calls `game.start()`.
  - No extra params, no debug container, no forced run state.

- Post content: content/unlisted/2025-10-01-male-nipple.md
  - Switched embed from `{{< jamble start="run" >}}` to `{{< jamble >}}` (idle start, panel visible, run begins on ground contact).

- Game JS: static/games/jamble/jamble.js
  - HUD/Control Panel
    - ControlPanel container is now `position: relative` so it mounts in-flow under the canvas instead of as a fixed overlay. Ref: createContainer() for ControlPanel.
    - HUDManager calls `updateControlPanel()` immediately after wiring the StateManager so the `.visible` class is applied in idle right away.
  - Auto-Run Collider
    - Restored the ground sensor’s unconditional transition to run (on player contact). This keeps the original game logic; the shortcode no longer sets run state.
  - Sensation Debug Line
    - SensationPanel.render() now always renders the debug overlay when an NPC is present (removed `debugMode` requirement).

**How To Embed The Game**
- Use the shortcode in any Hugo Markdown file:
- `{{< jamble >}}`
  - The game starts in idle so the control panel is visible; it flips to run when the player hits the ground.

**Behavior Notes**
- State lifecycle
  - Initial state is `idle` (panel visible at bottom).
  - When the player collides with the bottom “ground” sensor, state becomes `run` (panel hides until idle again).

- Control Panel rendering
  - The panel is injected into the game shell’s parent, styled via injected `<style>` in the Jamble code.
  - Visibility toggles via the StateManager (idle → show, run → hide). We trigger a visibility sync on init.

**Troubleshooting**
- Nothing renders (including control panel)
  - Check the browser console for `🎮 Jamble Game Initializing - Build: v2.0.322`.
  - If your site uses a strict CSP that blocks inline scripts, the inline shortcode bootstrap may not run.
    - Workaround: move initialization to a static JS file, e.g. `static/jamble/jamble-init.js`:
      - `document.addEventListener('DOMContentLoaded',()=>{const el=document.getElementById('jamble-game'); if(!el){console.error('Missing #jamble-game');return;} const game=new Jamble.Game(el,{debug:false}); game.start();});`
    - Then include with: `<script src="{{ "jamble/jamble-init.js" | relURL }}" defer></script>`

- Panel exists but not visible
  - Confirm state is idle in console: `game.stateManager.getCurrentState()`.
  - Temporarily force show to verify placement: `#control-panel{opacity:1!important;visibility:visible!important}`.
  - Check for clipping/overflow on parent wrappers around `#jamble-game`.

- Panel behind other elements
  - Raise z-index if the theme overlays headers: `#control-panel{z-index:1000}`.

**Context From Recent Commits**
- Last two commits in repo (unrelated to the above patch set, which is uncommitted here):
  - `0bfb7fc` — “Fixed but also broken.”
  - `a420055` — “Let's play a game”
  - These appear to be prior work; the current integration changes were applied in the working tree but not committed.

**Follow‑ups / Cleanup (Optional)**
- If multiple Jamble embeds are needed on a single page, we can parameterize the element IDs in the shortcode to avoid collisions.
