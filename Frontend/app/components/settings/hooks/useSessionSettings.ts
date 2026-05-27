"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { fetchSessions } from "../api";
import { revokeOtherSessions, revokeSessionById } from "../actions";
import type { SessionItem } from "../types";

export function useSessionSettings() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const list = await fetchSessions();
      setSessions(list);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load sessions.");
    }
  }, []);

  const revokeSession = useCallback(
    async (sessionId: string) => {
      setRevokingSessionId(sessionId);
      try {
        await revokeSessionById(sessionId);
        await loadSessions();
        toast.success("Session revoked.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to revoke session."
        );
      } finally {
        setRevokingSessionId(null);
      }
    },
    [loadSessions]
  );

  const revokeOthers = useCallback(async () => {
    setRevokingOthers(true);
    try {
      await revokeOtherSessions();
      await loadSessions();
      toast.success("Other sessions revoked.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke sessions."
      );
    } finally {
      setRevokingOthers(false);
    }
  }, [loadSessions]);

  return {
    sessions,
    revokingOthers,
    revokingSessionId,
    loadSessions,
    revokeSession,
    revokeOthers,
  };
}
