# webxrenglish — Agent instructions

## Project overview

Single-page VR English practice app: `index.html` is the entire frontend (A-Frame scene + 2D HUD + inline JS logic). Backend is a Vercel serverless proxy (`api/chat.js`) that forwards requests to Google Gemini.

## Architecture

- **Frontend:** `index.html` — no build step, no npm, no framework. A-Frame 1.5.0 from CDN, inline `<script>` logic. No physics engine — wall collision uses custom `position-clamp` component on the rig.
- **Backend:** `api/chat.js` — Vercel serverless function (ES module). Proxies POST requests to `gemini-2.5-flash-lite` model.
- **Deployment:** Vercel. `vercel.json` routes `/api/chat` → `api/chat.js`. `cleanUrls: true`.
- **No test suite, no typecheck, no lint.**

## API key

Set `GOOGLE_API_KEY` as Vercel environment variable. The proxy sends it via `X-Goog-Api-Key` header, never as query param.

## Application flow

1. Page loads → `initApp()` selects a random guest profile (4 personalities).
2. User holds **M key**, clicks button, or VR controller trigger → mic opens (SpeechRecognition).
3. Spoken text sent to Gemini via `/api/chat` with a system prompt defining the guest persona + JSON output schema.
4. Gemini returns `{ guestResponse, detectedMissions, currentValues }`.
5. `updateMissionsAndUI()` updates VR clipboard checkboxes, 2D HUD checklist, plays success chime.
6. When all 6 missions are complete → `triggerEvaluation()` sends full chat history to Gemini for scoring (5 criteria, 1–10).

## Guest personalities (role reversal)

The user is the receptionist; AI is the guest. Four profiles randomly selected on init/reset:
- **Polite** (James Sterling, Suite, 2 guests, 3 nights)
- **Impatient** (Sophia Vance, Single Room, 1 guest, 2 nights) — no stage directions in dialogue
- **Indecisive** (David Kim, Family Room, 4 guests, 5 nights) — asks receptionist for recommendations
- **Demanding/VIP** (Elena Rostova, Double Room, 3 guests, 4 nights) — asks about amenities before confirming

Defined in `GUEST_PROFILES` array in `index.html`.

## Mission tracking

6 tasks detected semantically by Gemini from the receptionist's questions:
`greeted → nameObtained → guestsConfirmed → roomTypeSelected → nightsCountAsked → bookingConfirmed`

Each mission toggles a success chime (Web Audio API, no external files). UI updates in VR clipboard (`#clipboardPanel`) and 2D HUD tasks (`#taskGreet`, etc.).

## Gemini response schema

AI must return valid JSON:
```json
{
  "guestResponse": "spoken reply",
  "detectedMissions": { /* 6 booleans */ },
  "currentValues": {
    "guestName": null | string,
    "guestsCount": null | number,
    "roomType": null | string,
    "nights": null | number,
    "roomNumberAssigned": null | string
  }
}
```

`responseMimeType: "application/json"` is set on the request payload.

## Evaluation

When `bookingConfirmed === true`, a 2-second timeout triggers `triggerEvaluation()`, which sends the full `chatHistory` to Gemini with a rubric prompt. Returns scores 1–10 for: Communication, Logical Order, Professionalism, Precision, Fluency + overall, summary, mistakes, recommendations.

Renderer on 3D panel (`#evaluationPanel`) and injected into 2D HUD. Reset button spawns in the HUD; clicking it calls `resetSimulation()`.

## Speech APIs

| API | Key detail |
|-----|-----------|
| SpeechRecognition | Initialized with cross-browser prefixed detection (`webkit`, `moz`, `ms`) |
| SpeechSynthesis | Async voice loading via `ensureTtsVoicesLoaded()` before first speak |

Mic permission is requested on user interaction (button/key/trigger press), not on page load. Error messages are browser-specific (Firefox, Safari, Chrome/Edge).

## Environment

Scene is a hotel lobby loaded from `Models/TODOprueba.glb` (~112MB, 161 nodes, 135 meshes) offset to `(5.16, 0, 10.23)` — places the L-shaped reception desk at `(0, 0.04, -0.9)` (same world position as the old procedural desk, keeping UI element positions valid).

`buildEnvironment()` now only generates the cube-map envMap for AI cube reflections (all textures come from the GLB).

## VR scene layout

Room is the full GLB hotel lobby. Key A-Frame elements:

| Element | Position | Notes |
|---------|----------|-------|
| Rig (player) | `-0.5 0 -1.0` | Behind L-shaped desk (receptionist area). Camera local `(0 1.6 0.3)` = eye `(-0.5 1.6 -0.7)`. position-clamp keeps X in `[-1.5, 8.5]`, Z in `[-1.2, 3.0]` |
| GLB scene | `5.16 0 10.23` | Offset so desk lands at original world Z=-0.9 |
| Clipboard (tasks) | `-0.65 1.40 -0.65` | Tilted -30° X, 25° Y |
| Holographic panel | `0 1.55 -1.1` | Tilted -10° X, 0° Y |
| AI cube (guest) | `-0.5 1.6 -0.5` | In front of desk (guest side), envMap reflections, bob/rotate anims |
| Evaluation panel | `0 1.55 -1.1` | Hidden until booking confirmed, same pos as holographic panel |

## Lighting

| Type | Color | Intensity | Notes |
|------|-------|-----------|-------|
| Ambient | `#c4b5a0` | 0.25 | Base fill |
| Hemisphere | `#f0e8d8` / `#7a6a5a` | 0.4 | Sky-ground gradient |
| Directional | `#fef5e0` | 0.7 | Main sun, casts shadows |
| 3 recessed points | `#fef5e0` | 0.3–0.35 | Ceiling downlights |
| Chandelier point | `#fef0d0` | 0.6 | Above waiting area |
| Floor lamp point | `#fef0d0` | 0.3 | Next to armchair (in GLB) |
| Cube light (dynamic) | `#818cf8` | 1.5 | Changes color with AI state |

## Ambient audio

`initAmbientAudio()` starts on first mic action. Uses Web Audio API exclusively:
- **HVAC rumble:** Pink noise → low-pass filter (350 Hz) → gain 0.012, looping
- **Distant footsteps:** Random noise bursts every 6–18 seconds, low-passed

No external audio files.

## Style conventions

- Colors: dark indigo background (`#030712`), purple accent (`#6366f1`), pink accent (`#ec4899`), cyan accent (`#06b6d4`).
- Fonts: `Outfit` for body, `Space Grotesk` for headings/title.
- All UI text in English.
- No comments in JS (project convention from prior work).
