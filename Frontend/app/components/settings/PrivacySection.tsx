import Button from "../ui/Button";
import type { AccountProfile, ExportJob } from "./types";
import { formatDate } from "./utils";

type PrivacySectionProps = {
  profile: AccountProfile | null;
  exportJob: ExportJob | null;
  requestingExport: boolean;
  requestingDelete: boolean;
  cancelingDelete: boolean;
  onRequestExport: () => void;
  onOpenDeleteModal: () => void;
  onCancelDeletion: () => void;
};

export default function PrivacySection({
  profile,
  exportJob,
  requestingExport,
  requestingDelete,
  cancelingDelete,
  onRequestExport,
  onOpenDeleteModal,
  onCancelDeletion,
}: PrivacySectionProps) {
  const deleting = Boolean(profile?.deletionStatus.scheduledDeletionAt);

  return (
    <div className="min-w-0 rounded-3xl bg-[#fffdfa]/90 border border-(--line) p-5 sm:p-6 space-y-3">
      <h2 className="display-title text-2xl text-[#17130f]">Privacy & data</h2>
      <div className="rounded-xl border border-(--line) bg-[#fffdf8] px-3 py-3">
        <p className="text-sm font-semibold text-[#17130f]">Export my data</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            onClick={onRequestExport}
            disabled={requestingExport}
            className="w-full sm:w-auto px-5 h-9"
          >
            {requestingExport ? "Preparing..." : "Request export"}
          </Button>
          {exportJob?.downloadUrl && (
            <a
              href={exportJob.downloadUrl}
              className="text-xs font-semibold text-[#17130f] hover:text-(--accent) break-all"
            >
              Download JSON
            </a>
          )}
        </div>
        {exportJob && (
          <p className="text-xs text-(--muted-foreground) mt-2">
            Status: {exportJob.status}
            {exportJob.expiresAt ? ` - Expires ${formatDate(exportJob.expiresAt)}` : ""}
          </p>
        )}
        <p className="text-xs text-(--muted-foreground) mt-2">
          Deletion requests are soft-deleted first, then permanently removed after
          30 days.
        </p>
      </div>
      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3">
        <p className="text-sm font-semibold text-red-800">Danger zone</p>
        {deleting ? (
          <>
            <p className="text-xs text-red-700 mt-1 break-words">
              Scheduled for{" "}
              {formatDate(profile?.deletionStatus.scheduledDeletionAt ?? null)}
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancelDeletion}
              disabled={cancelingDelete}
              className="w-full sm:w-auto px-4 h-9 mt-2"
            >
              {cancelingDelete ? "Cancelling..." : "Cancel deletion request"}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            onClick={onOpenDeleteModal}
            disabled={requestingDelete}
            className="w-full sm:w-auto px-4 h-9 mt-2 bg-red-700 text-white hover:bg-red-800"
          >
            Request account deletion
          </Button>
        )}
      </div>
      <div className="text-xs font-semibold text-(--muted-foreground) flex flex-wrap gap-3">
        <a href="/privacy" className="hover:text-[#17130f]">
          Privacy
        </a>
        <a href="/terms" className="hover:text-[#17130f]">
          Terms
        </a>
        <a
          href="mailto:support@truthlens.app"
          className="hover:text-[#17130f] break-all"
        >
          Contact
        </a>
        <a
          href="mailto:support@truthlens.app?subject=TruthLens%20Issue%20Report"
          className="hover:text-[#17130f] break-all"
        >
          Report issue
        </a>
      </div>
    </div>
  );
}
