import Button from "../ui/Button";
import Input from "../ui/Input";

type DeleteAccountModalProps = {
  open: boolean;
  deleteConfirm: string;
  deleteReason: string;
  requestingDelete: boolean;
  onDeleteConfirmChange: (value: string) => void;
  onDeleteReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function DeleteAccountModal({
  open,
  deleteConfirm,
  deleteReason,
  requestingDelete,
  onDeleteConfirmChange,
  onDeleteReasonChange,
  onClose,
  onSubmit,
}: DeleteAccountModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center overflow-y-auto bg-black/45 backdrop-blur px-4 py-4">
      <div className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[#fffdf8] p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-[#17130f]">
          Confirm account deletion
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Type DELETE to confirm.
        </p>
        <Input
          label='Type "DELETE"'
          id="deleteConfirm"
          value={deleteConfirm}
          onChange={(e) => onDeleteConfirmChange(e.target.value)}
        />
        <div className="mt-3">
          <label
            htmlFor="deleteReason"
            className="text-sm font-semibold text-[#17130f]"
          >
            Reason (optional)
          </label>
          <textarea
            id="deleteReason"
            value={deleteReason}
            onChange={(e) => onDeleteReasonChange(e.target.value)}
            className="mt-1 min-h-20 w-full rounded-xl border border-[var(--line)] bg-[#fffdf8] px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={requestingDelete}
            className="w-full sm:w-auto px-4 bg-red-700 text-white hover:bg-red-800"
          >
            {requestingDelete ? "Submitting..." : "Request deletion"}
          </Button>
        </div>
      </div>
    </div>
  );
}
