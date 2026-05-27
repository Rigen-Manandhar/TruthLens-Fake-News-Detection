"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { fetchExportJob } from "../api";
import {
  cancelAccountDeletion,
  requestAccountDeletion,
  requestUserExport,
} from "../actions";
import type { ExportJob } from "../types";

const EXPORT_POLL_INTERVAL_MS = 4000;

export function usePrivacySettings(loadProfile: () => Promise<void>) {
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [requestingExport, setRequestingExport] = useState(false);
  const [requestingDelete, setRequestingDelete] = useState(false);
  const [cancelingDelete, setCancelingDelete] = useState(false);
  const exportPollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (exportPollRef.current !== null) {
        window.clearTimeout(exportPollRef.current);
      }
    };
  }, []);

  const pollExportJob = useCallback((jobId: string) => {
    if (exportPollRef.current !== null) {
      window.clearTimeout(exportPollRef.current);
    }

    const tick = async () => {
      try {
        const job = await fetchExportJob(jobId);
        setExportJob(job);
        if (job.status === "pending" || job.status === "processing") {
          exportPollRef.current = window.setTimeout(
            () => void tick(),
            EXPORT_POLL_INTERVAL_MS
          );
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load export status."
        );
      }
    };

    void tick();
  }, []);

  const requestExport = useCallback(async () => {
    setRequestingExport(true);
    try {
      const job = await requestUserExport();
      setExportJob({
        jobId: job.jobId,
        status: job.status,
        downloadUrl: null,
        expiresAt: null,
      });
      pollExportJob(job.jobId);
      toast.success("Export requested.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to request export."
      );
    } finally {
      setRequestingExport(false);
    }
  }, [pollExportJob]);

  const submitDeletion = useCallback(async () => {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      toast.error('Type "DELETE" to confirm.');
      return;
    }

    setRequestingDelete(true);
    try {
      await requestAccountDeletion({
        confirmText: deleteConfirm,
        reason: deleteReason,
      });
      setDeleteConfirm("");
      setDeleteReason("");
      setDeleteOpen(false);
      await loadProfile();
      toast.success(
        "Deletion requested. Your account will be removed in 30 days unless cancelled."
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to request deletion."
      );
    } finally {
      setRequestingDelete(false);
    }
  }, [deleteConfirm, deleteReason, loadProfile]);

  const cancelDeletion = useCallback(async () => {
    setCancelingDelete(true);
    try {
      await cancelAccountDeletion();
      await loadProfile();
      toast.success("Deletion cancelled.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel deletion."
      );
    } finally {
      setCancelingDelete(false);
    }
  }, [loadProfile]);

  return {
    exportJob,
    deleteOpen,
    setDeleteOpen,
    deleteConfirm,
    setDeleteConfirm,
    deleteReason,
    setDeleteReason,
    requestingExport,
    requestingDelete,
    cancelingDelete,
    requestExport,
    submitDeletion,
    cancelDeletion,
  };
}
