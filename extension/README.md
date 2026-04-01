# TruthLens Chrome Extension (Popup v1)

TruthLens popup redesigned with a premium editorial UI, finite-state UX flow, progressive result disclosure, and automatic current-tab URL capture while keeping the same API contract.

## Files

- `manifest.json`: Manifest V3 config, popup entry, permissions, host permissions.
- `popup.html`: Semantic popup structure with topbar, scrollable content viewport, sticky action rail.
- `popup.css`: Token-first design system, layout, states, accessibility focus styles, motion.
- `popup-main.js`: Bootstrap/controller for popup behavior.
- `popup-state.js`: Shared popup state and UI mode constants.
- `popup-dom.js`: DOM lookup and required-element guards.
- `popup-render.js`: Rendering and UI state helpers.
- `popup-api.js`: API, storage, and active-tab helpers.
- `assets/icon16.png`, `assets/icon48.png`, `assets/icon128.png`: Extension icons.

## UI Architecture

The popup uses a strict 3-row shell:

1. Top bar (`topbar`) with brand and actions.
2. Scrollable content viewport (`content-scroll`) for hero + state panes.
3. Sticky action rail (`action-rail`) containing CTA and helper microcopy.

State panes:

- `editing-pane`: Input form.
- `loading-pane`: Progress feedback.
- `result-pane`: Verdict + progressive disclosure via `<details>`.
- `error-pane`: Retry/back actions.

## API Contract (Unchanged)

Endpoint:

- `POST {API_BASE_URL}/api/predict`

Payload:

```json
{
  "text": "<articleText>",
  "url": "<currentActiveTabUrl>",
  "input_mode": "auto|headline_only|full_article|headline_plus_article",
  "explanation_mode": "auto"
}
```

The popup now fills `url` automatically from the active browser tab when the extension opens.

Default base URL in `popup-state.js`:

- `http://localhost:3000`

Optional runtime overrides via `chrome.storage.sync`:

- `truthlensApiBaseUrl`
- `truthlensBearerToken`

## Install (Load Unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `extension` folder.
5. Reload the extension after any file changes.

## Zoom QA Checklist

Validate popup behavior at Chrome zoom **90%, 100%, 110%, 125%**:

- Analyze CTA remains visible in editing mode.
- No clipping in topbar, card, or footer rail.
- No double scrollbar on the shell.
- Form fields remain reachable and focus-visible.
- Result and error panes render without layout jumps.

## CORS Requirement

Your API must allow requests from:

- `chrome-extension://<extension-id>`

If CORS is not configured for extension origins, popup requests will fail.

## Known v1 Limitations

- Popup-only flow (no content script scraping).
- Settings icon is visual only.
- Result detail is concise and optimized for extension popup constraints.
