/**
 * Inline script that runs synchronously before the React tree mounts so the
 * `data-theme` attribute on <html> is set before first paint, avoiding any
 * dark/light flash. It reads `localStorage.truthlens.theme` first and falls
 * back to the OS-level `prefers-color-scheme` media query.
 *
 * The string is rendered with `dangerouslySetInnerHTML` from `layout.tsx`.
 */
const themeInitScript = `(() => {
  try {
    var stored = localStorage.getItem('truthlens.theme');
    var resolved;
    if (stored === 'light' || stored === 'dark') {
      resolved = stored;
    } else if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      resolved = 'dark';
    } else {
      resolved = 'light';
    }
    document.documentElement.dataset.theme = resolved;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();`;

export default function ThemeInit() {
  // The inline script is intentionally executed before React hydrates so the
  // user never sees the wrong theme on first paint.
  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />;
}
