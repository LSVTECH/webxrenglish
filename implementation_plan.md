# Implement Reliable Text-to-Speech Proxy for Pico 4 Ultra

## Goal Description
Implement a 100% reliable, high-quality Text-to-Speech (TTS) solution for the Pico 4 Ultra browser and other platforms where native browser SpeechSynthesis fails. We will replace the unreliable client-side Google Translate TTS scraper with a Vercel serverless proxy (`/api/synthesize.js`) that queries the official Google Cloud Text-to-Speech API. To save API key tokens in the long run, desktop browsers will continue to use the free browser-native `window.speechSynthesis` where it works, falling back to `/api/synthesize` only when necessary or on standalone headsets (Pico 4 Ultra).

## Proposed Changes

---

### Backend Components

#### [NEW] [synthesize.js](file:///c:/Users/Usuario/Documents/Github/webxrenglish/api/synthesize.js)
Create a new serverless API endpoint `api/synthesize.js` to process TTS requests.
- Accepts `POST` requests with a JSON body containing `{ text, voiceName, ssmlGender }`.
- Forwards requests to the Google Cloud Text-to-Speech API: `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`.
- Configures the synthesis payload with `en-US` language code, the requested voice name (e.g. `en-US-Neural2-F`, `en-US-Neural2-D`), and `MP3` audio output encoding.
- Returns the base64-encoded audio content to the client.
- **Strict Rule**: Contains absolutely no JavaScript comments.

#### [MODIFY] [vercel.json](file:///c:/Users/Usuario/Documents/Github/webxrenglish/vercel.json)
Update the Vercel routing configuration to expose the synthesis endpoint.
- Add route for `/api/synthesize` pointing to `/api/synthesize.js`.

---

### Frontend Components

#### [MODIFY] [index.html](file:///c:/Users/Usuario/Documents/Github/webxrenglish/index.html)
Update the speech playback system to use the new synthesis proxy:
- Implement a helper to map `currentGuestProfile` name to premium Google TTS voices:
  - James Sterling (Male) -> `en-US-Neural2-D`, `MALE`
  - Sophia Vance (Female) -> `en-US-Neural2-F`, `FEMALE`
  - David Kim (Male) -> `en-US-Neural2-J`, `MALE`
  - Elena Rostova (Female) -> `en-US-Neural2-H`, `FEMALE`
- Modify `speakViaAudio(text)`:
  - Send a `POST` request to `/api/synthesize` with the text and matching voice configurations.
  - Convert the returned base64 string into a data URL (`data:audio/mp3;base64,...`) or Blob URL.
  - Play the audio using the standard browser `Audio` element, maintaining existing playback state management.
- **Strict Rule**: No comments will be added to the JavaScript code blocks.

---

## Verification Plan

### Automated / API Verification
1. Run local server and send a mock `POST` request to `/api/synthesize` using `curl` or Postman.
2. Confirm the API returns a valid JSON response containing `audioContent` as a base64 string.
3. Validate routing in `vercel.json` by checking preview deployments.

### Manual Verification
1. Test on a desktop browser. Verify that the simulation runs with native speech synthesis.
2. Force the fallback path or test on a standalone headset. Verify that the AI guest speaks with high-quality character-specific voices matching their gender and personality.
3. Confirm that completing the interaction flow triggers the evaluation panel without audio playback errors.
