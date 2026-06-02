function getExtensionChrome() {
  return globalThis.chrome ?? null;
}

export function getActiveTab() {
  return new Promise((resolve) => {
    const extChrome = getExtensionChrome();
    if (!extChrome?.tabs?.query) {
      resolve(null);
      return;
    }

    extChrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (extChrome.runtime?.lastError) {
        resolve(null);
        return;
      }

      resolve(Array.isArray(tabs) ? tabs[0] ?? null : null);
    });
  });
}

export function readChromeStorage(keys) {
  return new Promise((resolve) => {
    const extChrome = getExtensionChrome();
    if (!extChrome?.storage?.sync) {
      resolve({});
      return;
    }

    extChrome.storage.sync.get(keys, (values) => {
      resolve(values || {});
    });
  });
}

export function writeChromeStorage(values) {
  return new Promise((resolve) => {
    const extChrome = getExtensionChrome();
    if (!extChrome?.storage?.sync) {
      resolve(false);
      return;
    }

    extChrome.storage.sync.set(values, () => {
      resolve(!extChrome.runtime || !extChrome.runtime.lastError);
    });
  });
}

function endpointFor(apiBaseUrl, pathname) {
  return `${apiBaseUrl.replace(/\/$/, "")}${pathname}`;
}

export async function callPredict(apiBaseUrl, payload) {
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch(endpointFor(apiBaseUrl, "/api/predict"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...payload,
      explanation_mode: "auto",
    }),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      typeof json?.detail === "string" && json.detail.trim()
        ? json.detail.trim()
        : "Prediction request failed.";
    throw new Error(detail);
  }

  return json || {};
}
