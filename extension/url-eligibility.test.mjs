import test from "node:test";
import assert from "node:assert/strict";

import { classifyUrlEligibility } from "./url-eligibility.mjs";

test("rejects youtube homepage", () => {
  const result = classifyUrlEligibility("https://youtube.com/");
  assert.equal(result.isSupported, false);
  assert.equal(result.reasonCode, "UNSUPPORTED_HOST");
});

test("rejects root homepage", () => {
  const result = classifyUrlEligibility("https://example.com/");
  assert.equal(result.isSupported, false);
  assert.equal(result.reasonCode, "UNSUPPORTED_PATH");
});

test("accepts article-like path", () => {
  const result = classifyUrlEligibility(
    "https://www.nytimes.com/2026/03/20/world/example-story"
  );
  assert.equal(result.isSupported, true);
  assert.equal(result.reasonCode, "SUPPORTED");
});

test("rejects browser URLs", () => {
  const result = classifyUrlEligibility("chrome://extensions");
  assert.equal(result.isSupported, false);
  assert.equal(result.reasonCode, "UNSUPPORTED_SCHEME");
});
