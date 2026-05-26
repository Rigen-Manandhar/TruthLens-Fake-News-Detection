# Requirements Document

## Introduction

This feature is a UI/UX improvement pass across the TruthLens monorepo, specifically the Next.js 16 web application (`Frontend/`) and the Chrome extension popup (`extension/`). The goal is to bring the two surfaces into a unified visual language, make the misinformation risk assessment results easier to read at a glance, expose user preferences that already exist in the data model, and improve a handful of moments that currently confuse new users (empty state, loading feedback, mobile scroll, hidden bearer-token setup).

The work is **front-end only**. It MUST NOT change the FastAPI backend in `Backend/`, MUST NOT change the response shape of `POST /api/predict` or `POST /predict`, and MUST preserve the product framing of "misinformation risk assessment, not automated truth detection".

To allow review before merge, all implementation work MUST be performed on a dedicated git branch (e.g., `feature/ui-ux-improvements`) so the user can inspect and approve changes before they reach `main`.

This document captures the **what** for each improvement. Implementation specifics (exact components to refactor, exact class names, etc.) are deferred to the design phase.

## Glossary

- **Web App**: The Next.js 16 application under `Frontend/`, served at routes such as `/fake-detection`, `/settings`, `/login`.
- **Extension**: The Chrome extension popup under `extension/`, with UI in `popup.html` / `popup.css` and behavior in `popup-main.js`, `popup-render.js`, `popup-state.js`.
- **Detection Page**: The web route `/fake-detection`, rendered by `Frontend/app/fake-detection/page.tsx`, containing the input form (`FakeDetectionForm`) and the result panel (`FakeDetectionResult`).
- **Result Panel**: The right-hand panel on the Detection Page, rendered by `Frontend/app/components/fakeDetection/FakeDetectionResult.tsx`.
- **Settings Page**: The web route `/settings`, rendered by `Frontend/app/settings/page.tsx` using the `useSettingsController` hook.
- **Auth Pages**: The web routes `/login`, `/signup`, `/forgot-password`, `/reset-password` and their components under `Frontend/app/components/Auth/`.
- **Verdict**: The high-level label returned by the prediction API. One of `LIKELY REAL`, `SUSPICIOUS`, or a hedged value mapped to display labels `Lower Risk`, `Higher Risk`, or `Needs Review`.
- **Risk Level**: The `risk_level` string field on the predict response (e.g., `Lower Risk`, `Higher Risk`, `Needs Review`, `Too short`).
- **Credibility Level**: The frontend-internal tri-state `high | mixed | low` derived from the verdict, used to drive result-panel styling.
- **LIME Explanation**: Per-token weight data returned in the predict response (`explanation`, `lime_input_text`, `explanation_summary`, `lime_model`) that highlights which words pushed the result toward FAKE or REAL.
- **Language Signals**: The user-facing name for the LIME-driven word-level explanation feature on the Detection Page and in the extension.
- **Input Mode**: The user preference / form selection controlling how submitted text is interpreted. One of `auto`, `headline_only`, `full_article`, `headline_plus_article`. Persisted on the user record as `preferences.detectionInputMode` and normalized via `lib/shared/settings.ts#normalizePreferences`.
- **Explanation Mode**: The user preference controlling whether LIME is requested with each prediction. One of `auto` (request when triggered) or `none` (suppress). Persisted on the user record as `preferences.detectionExplanationMode`.
- **Bearer Token**: The extension token issued by the Web App's Settings → Extension Token card. The Extension stores it in extension storage and sends it on `POST /api/feedback/detections` so feedback is associated with the user account.
- **Warm Palette**: The Web App's existing color system in `Frontend/app/globals.css`, anchored by `--background: #efe9dc`, `--foreground: #12100d`, `--accent: #0e7c66` (teal), and `--warm: #e8b074` (gold).
- **Cool Palette**: The Extension popup's existing color system in `extension/popup.css`, anchored by `--bg-canvas: #f4f7fb`, `--ink-strong: #0f172a`, and the `--brand-a: #2f63e8` / `--brand-b: #0896bf` blue gradient.
- **CSS Variables**: The custom properties declared in `Frontend/app/globals.css` `:root` (e.g., `--background`, `--foreground`, `--surface-strong`, `--line`, `--accent`, `--accent-soft`, `--muted-foreground`, `--warm`).
- **Pill Button**: The Web App's `rounded-full` button style with the dark-ink default and teal-accent hover, used by the primary `Button` component.
- **Progressive Disclosure**: Pattern of showing the most important information first and hiding secondary details behind an accordion / `<details>` element until the user opts in.
- **Predict Endpoint**: `POST /api/predict` in the Web App (`Frontend/app/api/predict/route.ts`), proxied to the Backend's `POST /predict`. Both the Web App and the Extension consume this endpoint.

## Requirements

---

### Group A: Cross-Cutting Design System

---

### Requirement 1: Unified Design Language Across Surfaces

**User Story:** As a user who moves between the Web App and the Extension, I want both surfaces to look like the same product, so that I trust the Extension as a legitimate companion to the Web App and don't get visually disoriented when I switch contexts.

#### Acceptance Criteria

1. THE Extension SHALL adopt the Warm Palette as its primary color system, replacing the Cool Palette currently declared in `extension/popup.css`.
2. THE Extension SHALL use color values that match the Web App's `--background`, `--foreground`, `--accent`, `--warm`, `--line`, and `--muted-foreground` tokens for equivalent surfaces (canvas background, primary ink, accent, warm highlight, dividers, secondary text).
3. THE Extension SHALL render its primary call-to-action ("Assess Risk") as a Pill Button styled to match the Web App's primary button (dark-ink fill, teal-accent hover, `rounded-full` shape).
4. THE Extension SHALL preserve the existing 400×600 popup dimensions and the existing three-row grid layout (topbar, scroll content, action rail).
5. THE Extension SHALL preserve the existing pane state machine (editing, loading, result, error) without changes to which pane is shown when.
6. WHEN the Extension renders verdict tone classes (`tone-ok`, `tone-warn`, `tone-bad`), THE Extension SHALL use color values consistent with the Web App's verdict styling (per Requirement 7), not the current cool blue/emerald/red set.
7. THE Web App SHALL continue to render with the Warm Palette and SHALL NOT regress any existing route's visual style as a result of these changes.

---

### Requirement 2: CSS Variable Consistency Cleanup

**User Story:** As a frontend developer maintaining TruthLens, I want components to consume CSS Variables instead of hardcoded color literals, so that future theming work (such as a dark mode) does not require touching dozens of unrelated files.

#### Acceptance Criteria

1. WHERE a component currently uses the hardcoded literal `#17130f`, THE Web App SHALL replace it with `var(--foreground)`.
2. WHERE a component currently uses the hardcoded literal `#fffdfa` or `#fffdf8`, THE Web App SHALL replace it with `var(--surface)` or an equivalent CSS Variable that resolves to the same warm off-white.
3. WHERE a component currently uses the hardcoded literal `#f7f1e6`, THE Web App SHALL replace it with `var(--surface-strong)`.
4. WHERE a component currently uses the hardcoded literal `#5f5548`, THE Web App SHALL replace it with `var(--muted-foreground)`.
5. WHERE a component currently uses an inline literal that has no existing CSS Variable equivalent, THE Web App SHALL either introduce a new CSS Variable in `Frontend/app/globals.css` `:root` and consume it, or document why a literal is retained (e.g., one-off illustration color).
6. THE Web App SHALL produce a visually equivalent result after the cleanup as before (no intentional color drift).
7. IF a refactor changes a rendered color by more than a perceptible amount, THEN THE refactor SHALL either be reverted or treated as an intentional color update with a corresponding entry in the design notes.

---

### Requirement 3: Accessibility Preservation

**User Story:** As a user who relies on keyboard navigation, screen readers, or visible focus indicators, I want the visual refresh to leave my existing accessibility affordances intact, so that I can keep using TruthLens with the assistive tools I already use.

#### Acceptance Criteria

1. THE Web App SHALL preserve all existing visible focus rings on interactive controls (buttons, inputs, selects, summary elements, links).
2. THE Extension SHALL preserve the existing `:focus-visible` ring styling (currently `box-shadow: 0 0 0 3px var(--focus-ring)`) on buttons, selects, textareas, inputs, and `summary` elements, with the ring color updated to match the Warm Palette accent.
3. THE Web App SHALL preserve all existing ARIA attributes (`aria-label`, `aria-live`, `aria-expanded`, `aria-haspopup`, `role`) on components that are visually refreshed.
4. THE Extension SHALL preserve all existing ARIA attributes on its panes, summary chips, hero result summary, and feedback section.
5. WHEN a user navigates the Detection Page or the Extension popup using only the keyboard, THE Web App and THE Extension SHALL allow the user to reach every interactive control in a logical tab order without dead ends.
6. THE Web App SHALL maintain a contrast ratio of at least 4.5:1 between body text and its background for all refreshed surfaces, as defined by WCAG 2.1 AA for normal text.
7. THE Web App SHALL maintain a contrast ratio of at least 3:1 between large text or non-text UI elements (icon buttons, chip borders) and adjacent surfaces.

---

### Requirement 4: Product Framing Preservation

**User Story:** As the product owner, I want every refreshed surface to keep describing the system as a misinformation risk assessment, so that we don't create the impression that TruthLens is an automated truth oracle.

#### Acceptance Criteria

1. THE Web App SHALL NOT introduce copy that describes the system as proving truth, fact-checking, or detecting fake news with certainty.
2. THE Extension SHALL NOT introduce copy that describes the system as proving truth, fact-checking, or detecting fake news with certainty.
3. WHERE result-panel copy uses words like "verdict", "result", or "assessment", THE Web App SHALL retain the existing hedged language ("the available signals show...", "this is not a guarantee").
4. THE Web App SHALL retain the existing disclaimer text "TruthLens supports review. It does not replace human fact-checking or prove truth." on the Detection Page in some form, even if visually de-emphasized per Requirement 6.
5. THE Extension SHALL retain an equivalent disclaimer in its result pane.

---

### Requirement 5: Frontend Validation Gates

**User Story:** As a maintainer, I want all UI/UX changes to pass the project's standard frontend checks, so that the dedicated branch is in a mergeable state before review.

#### Acceptance Criteria

1. WHEN the implementation work for this feature is complete, THE Web App SHALL pass `npm run lint` from the `Frontend/` directory with no new errors.
2. WHEN the implementation work for this feature is complete, THE Web App SHALL pass `npm run build` from the `Frontend/` directory with no new errors or type failures.
3. THE Extension SHALL load successfully as an unpacked extension in Chrome from the `extension/` directory after the changes, with no console errors thrown during popup open in the editing pane.
4. THE Web App and THE Extension SHALL continue to consume the existing Predict Endpoint contract without any change to request or response shape.

---

### Group B: Detection Page Improvements

---

### Requirement 6: Progressive Disclosure of Result Panel Content

**User Story:** As a user who just submitted content on the Detection Page, I want the most important information (the verdict, the risk level, and a one-sentence interpretation) to be visible immediately without scrolling, so that I can decide whether the content is worth deeper investigation in two seconds rather than twenty.

#### Acceptance Criteria

1. WHEN a prediction has completed and the Result Panel is visible on the Detection Page, THE Result Panel SHALL render the following items above the fold without requiring vertical scroll on a 1280×800 viewport: the verdict chip, the risk-level chip, the one-sentence level interpretation (e.g., "The available signals show lower misinformation risk..."), and a persistent "Language signals" call-to-action button.
2. WHEN a prediction has completed, THE Result Panel SHALL render the "What we checked" content (source credibility, article retrieval, language analysis, claim cross-reference) inside an accordion that is collapsed by default.
3. WHEN the user opens the "What we checked" accordion on the Result Panel, THE Result Panel SHALL show the same content currently rendered (the four check cards, where applicable for the prediction).
4. WHEN a prediction has completed, THE Result Panel SHALL render the "What this result means" disclaimer with reduced visual weight (smaller type, lower contrast surface, or a subtle border) compared to the verdict block, while remaining legible at WCAG 2.1 AA contrast.
5. WHEN a prediction has completed and `canExplain` is true, THE Result Panel SHALL display the "Language signals" call-to-action as a persistent button positioned directly under the verdict block, not inside the inner scroll area.
6. WHEN the user clicks the persistent "Language signals" button, THE Result Panel SHALL invoke the existing `onExplain` handler with no change to the request or response contract.
7. WHEN LIME content has been generated, THE Result Panel SHALL render the language signal indicator chips and the highlighted text inline below the call-to-action.
8. THE Result Panel SHALL preserve the existing uncertainty callout behavior (rendering a reason chip and reason message when `uncertainty.reason_code` is set).

---

### Requirement 7: Result Color-Coding Tone

**User Story:** As a user reading a result, I want the colors to reflect a hedged risk assessment rather than a pass/fail signal, so that I don't over-trust a "Lower Risk" result as a green check of truthfulness.

#### Acceptance Criteria

1. WHEN the credibility level is `high` (display label "Lower Risk"), THE Web App SHALL render the verdict chip and Result Panel accent in a neutral blue or soft teal tone derived from the Warm Palette accent, not strong emerald.
2. WHEN the credibility level is `low` (display label "Higher Risk"), THE Web App SHALL render the verdict chip and Result Panel accent in a red tone consistent with the existing red signal.
3. WHEN the credibility level is `mixed` (display label "Needs Review"), THE Web App SHALL render the verdict chip and Result Panel accent in a soft amber or sand tone that does not read as alarming and that is visually distinct from the "Higher Risk" red.
4. THE Web App SHALL apply the same updated tone palette to the LIME-derived "Real indicators" and "Fake indicators" chip groups so that the "Real indicators" group does not use strong emerald.
5. THE Extension SHALL render `tone-ok`, `tone-warn`, and `tone-bad` summary chips and result badges using the same tone definitions as the Web App (per criteria 1, 2, and 3) so the two surfaces are color-consistent.
6. WHEN any verdict tone is rendered, THE Web App SHALL maintain a contrast ratio of at least 4.5:1 between the chip text and the chip background.
7. THE Web App SHALL NOT change the verdict-to-credibility-level mapping in `Frontend/app/fake-detection/page.tsx` `mapVerdictToLevel` as part of this color-tone change.

---

### Requirement 8: Empty State Onboarding Hint

**User Story:** As a first-time visitor to the Detection Page who has not yet submitted anything, I want a short, visual hint of what to do, so that I understand the input flow without reading a paragraph of placeholder copy.

#### Acceptance Criteria

1. WHILE the Detection Page has not yet returned a prediction (i.e., `hasResult` is false), THE Result Panel SHALL render an onboarding hint composed of three steps in order: "Paste text", "Add URL", "Assess Risk".
2. THE onboarding hint SHALL display a small icon adjacent to each step.
3. THE onboarding hint SHALL replace the current dashed-border scrollable placeholder box on the Result Panel.
4. WHEN a prediction is in progress (loading state), THE Result Panel SHALL not render the onboarding hint.
5. WHEN a prediction has completed, THE Result Panel SHALL not render the onboarding hint.
6. THE onboarding hint SHALL NOT introduce horizontal scroll on viewports of 320px width and above.

---

### Requirement 9: Loading State Feedback

**User Story:** As a user who has just clicked "Assess Risk", I want to see that the system is making progress through distinct phases, so that I don't think the page has frozen during a multi-second prediction.

#### Acceptance Criteria

1. WHEN `isLoading` is true on the Detection Page, THE Detection Page SHALL render a loading indicator that is more informative than a disabled button, in the form of either (a) a step indicator showing labeled phases such as "Fetching source", "Analyzing language", and "Generating explanation", or (b) an indeterminate or animated progress bar visually attached to the form card.
2. WHEN `isLoading` is true and a step indicator is used, THE step indicator SHALL display at least two distinguishable steps, each with a short label.
3. WHEN `isLoading` becomes false, THE Detection Page SHALL hide the loading indicator within one render cycle.
4. THE loading indicator SHALL be at least as informative as the Extension's existing spinner-in-card loading pane.
5. THE loading indicator SHALL NOT block keyboard focus from leaving the form area.
6. IF the prediction returns an error, THEN THE Detection Page SHALL hide the loading indicator and surface the existing error message via the existing error path.

---

### Requirement 10: Mobile Result Visibility After Submission

**User Story:** As a mobile user who just tapped "Assess Risk", I want the result to be visible without manually scrolling past the form, so that I see the answer to the question I just asked.

#### Acceptance Criteria

1. WHEN a prediction completes on a viewport narrower than the `xl` Tailwind breakpoint (1280px), THE Detection Page SHALL bring the Result Panel into view automatically.
2. THE Detection Page SHALL implement criterion 1 by either (a) auto-scrolling the page so the Result Panel's top is at or near the viewport top, or (b) reordering the stack so the Result Panel renders above the form on viewports narrower than `xl` after a result is available.
3. WHEN the user has not yet submitted a prediction on a narrow viewport, THE Detection Page SHALL render the form first in the stacking order.
4. WHEN the user submits a second prediction on a narrow viewport, THE Detection Page SHALL re-bring the Result Panel into view following the same rule as criterion 1.
5. THE Detection Page SHALL NOT auto-scroll on viewports at or wider than the `xl` breakpoint, where the form and the Result Panel are already side-by-side.
6. IF the user has scrolled away from the Result Panel manually after a result was shown, THEN THE Detection Page SHALL NOT fight the user by re-scrolling on subsequent re-renders that are not triggered by a new submission.

---

### Group C: Settings Improvements

---

### Requirement 11: Detection Preferences Card on Settings Page

**User Story:** As a logged-in user, I want to set my default Input Mode and Explanation Mode for the Detection Page from my Settings, so that I don't have to re-pick "Headline only" or turn off LIME on every visit.

#### Acceptance Criteria

1. THE Settings Page SHALL render a "Detection preferences" card alongside the existing Profile, Password, and Extension Token sections.
2. THE Detection preferences card SHALL allow the user to view and edit `preferences.detectionInputMode` with the four valid values `auto`, `headline_only`, `full_article`, `headline_plus_article`.
3. THE Detection preferences card SHALL allow the user to view and edit `preferences.detectionExplanationMode` with the two valid values `auto` and `none`.
4. WHEN the user opens the Settings Page, THE Detection preferences card SHALL show the current preference values fetched from `GET /api/users/me`, normalized via `lib/shared/settings.ts#normalizePreferences`.
5. WHEN the user changes a preference value and confirms the change, THE Settings Page SHALL persist the change by calling the existing user-preferences update path on `/api/users/me` with the same payload conventions used by the existing Profile section.
6. WHEN the persistence call succeeds, THE Settings Page SHALL show a success toast or inline status using the same pattern as the existing Profile section save flow.
7. IF the persistence call fails, THEN THE Settings Page SHALL show an error message and SHALL NOT silently revert the user's selection without explanation.
8. THE Detection preferences card SHALL fit into the existing `useSettingsController` hook pattern rather than introducing a parallel controller.
9. THE Detection preferences card SHALL describe each preference in plain language so a user understands what "Headline only" or "Explanation mode: none" actually changes on the Detection Page.
10. THE Web App SHALL NOT change the response shape of `GET /api/users/me` or any user-preferences endpoint as part of this requirement.

---

### Group D: Auth Pages

---

### Requirement 12: Replace Generic Marketing Copy on Auth Pages

**User Story:** As a new visitor on `/login`, `/signup`, `/forgot-password`, or `/reset-password`, I want the marketing column to tell me what TruthLens actually does for misinformation risk assessment, so that I sign up for the right reason instead of wondering what a generic "Personalized" card means.

#### Acceptance Criteria

1. THE Auth Pages SHALL replace the current generic marketing cards (e.g., "Personalized", "Verified", "Start smart") with copy specific to misinformation risk assessment.
2. THE Auth Pages SHALL include at least three distinct value statements drawn from the actual product feature set, such as: per-result signal disclosure ("Each result shows which signals ran and why"), source credibility from a curated database, and word-level Language Signals explanations.
3. THE Auth Pages SHALL preserve the existing visual layout (left marketing column + right form column on wide viewports, single-column stack on narrow viewports).
4. THE Auth Pages SHALL preserve the existing visual language and the Warm Palette so the auth experience does not feel disconnected from the rest of the Web App.
5. THE Auth Pages SHALL NOT introduce copy that overstates the system's capabilities (e.g., must not say "always knows what's true" or equivalent).
6. THE Auth Pages SHALL keep all existing form fields, submit buttons, OAuth buttons, and validation behavior unchanged.

---

### Group E: Extension Improvements

---

### Requirement 13: Extension Visual Style Alignment

**User Story:** As a user installing the Extension after using the Web App, I want the popup to feel like the same product, so that I'm confident the Extension is the official companion and not a third-party tool.

(Note: this requirement is the visible counterpart to Requirement 1's design-system rules, focused on Extension-specific elements.)

#### Acceptance Criteria

1. THE Extension SHALL render its hero / topbar with the Warm Palette canvas and ink colors instead of the current cool blue gradient backdrop.
2. THE Extension SHALL render the Action Rail's primary "Assess Risk" button as a Pill Button using the Warm Palette accent, replacing the current cool blue-to-cyan gradient.
3. THE Extension SHALL keep the existing icon and the existing `loading` class behavior on the primary button so the spinner-on-loading transition still works.
4. THE Extension SHALL render its `result-disclaimer` block in a tone consistent with the Web App's reduced-emphasis disclaimer (per Requirement 6, criterion 4).
5. THE Extension SHALL keep the existing `details` accordions for "What we checked" and "Analysis details" closed by default after a result, matching the Web App's progressive-disclosure behavior.
6. THE Extension SHALL keep the existing 400×600 popup dimensions.

---

### Requirement 14: Bearer Token Discoverability for First-Time Extension Users

**User Story:** As a new Extension user who just installed the popup, I want to be told up front that I should connect my account to send feedback, so that my "Prediction was right" / "Prediction was wrong" submissions don't silently fail because I never expanded "Connection settings".

#### Acceptance Criteria

1. WHEN the Extension popup opens for the first time after install, THE Extension SHALL render a one-time setup prompt that invites the user to connect their account for feedback.
2. THE one-time setup prompt SHALL include a primary action that links into or opens the existing connection settings (the area currently inside the `<details>` Connection settings block) so the user can paste a Bearer Token.
3. THE one-time setup prompt SHALL include a dismiss action that closes the prompt without setting a Bearer Token.
4. WHEN the user dismisses the one-time setup prompt, THE Extension SHALL persist the dismissed state in extension storage so the prompt does not reappear on subsequent popup opens.
5. WHEN the user successfully saves a Bearer Token via the connection settings, THE Extension SHALL persist a "configured" state in extension storage so the prompt does not reappear on subsequent popup opens.
6. WHILE the prompt is visible, THE Extension SHALL NOT block the user from using the regular analysis flow (entering text, picking input mode, clicking Assess Risk).
7. WHERE the Bearer Token is not configured, THE Extension SHALL retain its existing behavior of showing the in-result `feedback-token-notice` so users who dismissed the prompt still get inline guidance at feedback time.
8. THE one-time setup prompt SHALL use copy that frames the integration as optional ("connect your account for feedback") rather than required for risk assessment.

---

### Group F: Process / Non-Functional

---

### Requirement 15: Dedicated Implementation Branch

**User Story:** As the project owner, I want every change for this UI/UX pass to live on a dedicated git branch, so that I can review the full diff and approve only if I like it before anything reaches `main`.

#### Acceptance Criteria

1. THE implementation work for this feature SHALL be performed on a dedicated git branch named `feature/ui-ux-improvements` (or a comparable feature-prefixed branch name agreed with the user).
2. THE implementation work SHALL NOT push commits directly to `main` or any other shared protected branch.
3. WHEN the implementation work is ready for review, THE branch SHALL be left in a state that passes Requirement 5's lint and build gates.
4. THE branch SHALL only be merged to `main` after the user has reviewed and explicitly approved the changes.
5. WHERE the implementation needs to install or upgrade dependencies, THE branch SHALL include the corresponding `package.json` and `package-lock.json` changes.

---

### Requirement 16: Predict Endpoint Contract Stability

**User Story:** As a maintainer of both the Web App and the Extension, I want the `/api/predict` and `/predict` request and response shapes to remain unchanged, so that one client doesn't break the other and so the FastAPI backend stays untouched.

#### Acceptance Criteria

1. THE Web App SHALL NOT change the request shape sent to `POST /api/predict`.
2. THE Web App SHALL NOT change the response shape returned from `POST /api/predict`.
3. THE Extension SHALL NOT change the request shape sent to the Predict Endpoint.
4. THE Extension SHALL NOT change the response shape it consumes from the Predict Endpoint.
5. WHERE a UI change requires data the response does not currently expose, THE feature SHALL either (a) drop that UI ambition for this pass, or (b) trigger an explicit follow-up requirements review before any backend or contract change is made.

---

### Requirement 17: Backend Out of Scope

**User Story:** As the maintainer of the FastAPI service, I want this feature to leave the `Backend/` directory untouched, so that ML inference, source credibility data, and evidence-summary logic are not perturbed by what is fundamentally a UI change.

#### Acceptance Criteria

1. THE feature SHALL NOT modify any file under `Backend/`.
2. THE feature SHALL NOT modify model assets in `Backend/model/model_a/` or `Backend/model/model_b/`.
3. THE feature SHALL NOT modify the source credibility dataset at `Backend/app/data/source_credibility.json`.
4. IF a Web App or Extension change appears to require a backend update, THEN THE feature SHALL stop and surface the conflict for an explicit scope decision before any backend file is edited.

---
