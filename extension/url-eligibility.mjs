const UNSUPPORTED_HOST_SUFFIXES = [
  "youtube.com",
  "google.com",
  "gmail.com",
  "facebook.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "tiktok.com",
  "linkedin.com",
  "reddit.com",
  "pinterest.com",
  "mail.yahoo.com",
  "docs.google.com",
  "drive.google.com",
];

const UNSUPPORTED_EXACT_PATHS = new Set([
  "/",
  "/feed",
  "/shorts",
  "/search",
  "/results",
  "/explore",
  "/home",
  "/channel",
  "/login",
  "/signin",
  "/signup",
  "/settings",
  "/profile",
  "/account",
]);

const UNSUPPORTED_PREFIXES = [
  "/feed/",
  "/search/",
  "/results/",
  "/explore/",
  "/home/",
  "/channel/",
  "/login/",
  "/signin/",
  "/signup/",
  "/settings/",
  "/profile/",
  "/account/",
];

const UNSUPPORTED_SPECIAL_PREFIXES = ["/watch", "/@"];

function normalizePath(pathname) {
  let normalized = String(pathname || "").trim();
  if (!normalized) {
    return "/";
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || "/";
}

function isUnsupportedHost(hostname) {
  let host = String(hostname || "").trim().toLowerCase();
  if (!host) {
    return false;
  }

  if (host.startsWith("www.")) {
    host = host.slice(4);
  }

  return UNSUPPORTED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}

function looksLikeArticlePath(pathname) {
  const normalized = normalizePath(pathname);
  if (normalized === "/") {
    return false;
  }

  if (UNSUPPORTED_EXACT_PATHS.has(normalized)) {
    return false;
  }

  if (UNSUPPORTED_SPECIAL_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return false;
  }

  if (UNSUPPORTED_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return false;
  }

  const segments = normalized.split("/").filter(Boolean);
  if (segments.length >= 2) {
    return true;
  }

  const segment = segments[0] || "";
  return segment.length >= 16 && (segment.includes("-") || segment.includes("_"));
}

export function classifyUrlEligibility(url) {
  const candidate = String(url || "").trim();
  if (!candidate) {
    return {
      isSupported: false,
      normalizedUrl: "",
      reasonCode: "MISSING_URL",
      reasonMessage: "Open a regular web page to include its URL in the analysis.",
    };
  }

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      isSupported: false,
      normalizedUrl: "",
      reasonCode: "INVALID_URL",
      reasonMessage: "The current page URL is invalid, so it will be ignored.",
    };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return {
      isSupported: false,
      normalizedUrl: "",
      reasonCode: "UNSUPPORTED_SCHEME",
      reasonMessage: "Only regular web pages can be analyzed automatically.",
    };
  }

  if (!parsed.hostname) {
    return {
      isSupported: false,
      normalizedUrl: "",
      reasonCode: "INVALID_HOST",
      reasonMessage: "The current page URL has no valid hostname.",
    };
  }

  const normalizedUrl = parsed.toString();
  if (isUnsupportedHost(parsed.hostname)) {
    return {
      isSupported: false,
      normalizedUrl,
      reasonCode: "UNSUPPORTED_HOST",
      reasonMessage:
        "This site is treated as a non-article platform, so its URL will be ignored.",
    };
  }

  if (!looksLikeArticlePath(parsed.pathname)) {
    return {
      isSupported: false,
      normalizedUrl,
      reasonCode: "UNSUPPORTED_PATH",
      reasonMessage:
        "This page does not look like an article page, so its URL will be ignored.",
    };
  }

  return {
    isSupported: true,
    normalizedUrl,
    reasonCode: "SUPPORTED",
    reasonMessage: "Current page URL will be included in the analysis.",
  };
}
