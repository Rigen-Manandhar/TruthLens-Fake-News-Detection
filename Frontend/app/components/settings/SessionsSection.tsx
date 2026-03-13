import Button from "../ui/Button";
import type { AccountProfile, SessionItem } from "./types";
import { formatDate } from "./utils";

type SessionsSectionProps = {
  sessions: SessionItem[];
  profile: AccountProfile | null;
  revokingOthers: boolean;
  revokingSessionId: string | null;
  onRevokeSession: (sessionId: string) => void;
  onRevokeOthers: () => void;
};

export default function SessionsSection({
  sessions,
  profile,
  revokingOthers,
  revokingSessionId,
  onRevokeSession,
  onRevokeOthers,
}: SessionsSectionProps) {
  return (
    <div className="min-w-0 rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] p-5 sm:p-6 space-y-3">
      <h2 className="display-title text-2xl text-[#17130f]">Active sessions</h2>
      {sessions.map((session) => (
        <div
          key={session.sessionId}
          className="rounded-xl border border-[var(--line)] bg-[#fffdf8] px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#17130f] break-words">
              {session.deviceLabel}
              {session.isCurrent ? " (Current)" : ""}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] break-all">
              {session.ipPreview}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] break-words">
              Created: {formatDate(session.createdAt)} | Last seen:{" "}
              {formatDate(session.lastSeenAt)}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onRevokeSession(session.sessionId)}
            disabled={session.isCurrent || revokingSessionId === session.sessionId}
            className="w-full sm:w-auto px-4 h-9"
          >
            {revokingSessionId === session.sessionId ? "..." : "Revoke"}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={onRevokeOthers}
        disabled={revokingOthers || profile?.securitySummary.reauthRequired}
        className="w-full sm:w-auto px-5"
      >
        {revokingOthers ? "Revoking..." : "Revoke all other sessions"}
      </Button>
    </div>
  );
}
