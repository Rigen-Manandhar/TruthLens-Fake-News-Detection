"use client";

import { useSyncExternalStore } from "react";

interface MailLinkProps {
  user: string;
  domain: string;
  subject?: string;
  className?: string;
}

const buildObfuscated = (user: string, domain: string) =>
  `${user} [at] ${domain.replace(/\./g, " [dot] ")}`;

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Renders the email address in a harvest-resistant `[at]` / `[dot]` form on
 * server output, then upgrades to a real `mailto:` link after hydration so
 * humans get a clickable target while bots scraping static HTML do not.
 */
export default function MailLink({
  user,
  domain,
  subject,
  className = "",
}: MailLinkProps) {
  // useSyncExternalStore returns false on the server (preserving SSR output)
  // and true on the client after hydration — without the React 19 lint
  // rule against calling setState inside useEffect.
  const hydrated = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const address = `${user}@${domain}`;
  const href = subject
    ? `mailto:${address}?subject=${encodeURIComponent(subject)}`
    : `mailto:${address}`;
  const obfuscated = buildObfuscated(user, domain);

  if (!hydrated) {
    return (
      <span className={className} data-mail-link>
        {obfuscated}
        <noscript> ({address})</noscript>
      </span>
    );
  }

  return (
    <a href={href} className={className} data-mail-link>
      {address}
    </a>
  );
}
