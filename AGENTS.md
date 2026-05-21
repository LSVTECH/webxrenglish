# webxrenglish — Agent instructions

## Project overview

Single-page VR English practice app: `index.html` is the entire frontend (A-Frame scene + 2D HUD + inline JS logic). Backend is a Vercel serverless proxy (`api/chat.js`) that forwards requests to Google Gemini.

## Architecture

- **Frontend:** `index.html` — no build step, no npm, no framework. A-Frame 1.5.0 from CDN, inline `<script>` logic.
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

## Procedural texture system

All textures are Canvas-generated at runtime (no external image files). Defined in `buildEnvironment()`:
- `createProceduralTexture(type, params)` — generates a 512×512 canvas for: `marble`, `wood`, `fabric`, `floorTile` (grid), `carpet`, `wallPaint`, `ceilingTile`, `abstractArt`
- `setTexture(entityId, canvas, mapType, repeatX, repeatY)` — applies canvas as Three.js `CanvasTexture` with repeating
- `createBumpFromBase(canvas, strength)` — converts any texture to a grayscale bump map
- `createEnvMap()` — generates a 6-face CubeTexture for reflections (used on AI cube)
- `getThreeObject(entityId)` — retrieves the underlying Three.js mesh from an A-Frame entity

PBR enhancements (bump maps, envMap) are applied in `buildEnvironment()` on scene load. No images are downloaded.

## VR scene layout

Room dimensions: 8m × 5m × 3m (w × d × h). Textures applied procedurally in `buildEnvironment()`.

| Element | Position | Notes |
|---------|----------|-------|
| Camera (user) | `0 1.6 0.3` | Behind reception desk |
| Floor (marble tile) | `0 0.01 -1.5` | 8×5m, bump map, receives shadows |
| Back wall | `0 1.5 1` | 8×3m |
| Left/Right walls | `±4 1.5 -1.5` | 5×3m |
| Ceiling (panel) | `0 3 -1.5` | 8×5m, recessed lights |
| Reception desk | `0 0.52 -0.9` | 5-part: countertop (marble), front (wood), body, trim, edge |
| Clipboard (tasks) | `-0.5 1.05 -0.85` | Tilted -25° X, 20° Y |
| Holographic panel | `0.25 1.5 -1.4` | Tilted -15° X, -10° Y |
| AI cube (guest) | `0 1.6 -1.8` | envMap reflections, bob/rotate anims |
| Evaluation panel | `0 1.55 -1.4` | Hidden until booking confirmed |
| Sofa (2-seat) | `-2.5 0.22 -3` | Fabric texture, 4-box construction |
| Armchair | `2.5 0.22 -3` | Fabric texture, 4-box construction |
| Coffee table | `0 0.42 -3` | Glass top + metal legs |
| Carpet | `0 0.005 -3` | 3.5×2m, speckled pattern |
| Decorative plant | `-2.5 0.65 -3.8` | Pot + spheres |
| Floor lamp | `2.5 1.3 -3.8` | With point light |
| Wall art | `-3.99 1.6 -2` | Abstract painting + frame |
| Reception terminal | `0.5 0.99 -0.55` | Monitor + keyboard |
| Phone | `-0.55 1.0 -0.65` | Base + handset |

## Lighting

| Type | Color | Intensity | Notes |
|------|-------|-----------|-------|
| Ambient | `#c4b5a0` | 0.25 | Base fill |
| Hemisphere | `#f0e8d8` / `#7a6a5a` | 0.4 | Sky-ground gradient |
| Directional | `#fef5e0` | 0.7 | Main sun, casts shadows |
| 3 recessed points | `#fef5e0` | 0.3–0.35 | Ceiling downlights |
| Chandelier point | `#fef0d0` | 0.6 | Above waiting area |
| Floor lamp point | `#fef0d0` | 0.3 | Next to armchair |
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
