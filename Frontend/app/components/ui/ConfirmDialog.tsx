"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import FocusTrap from "focus-trap-react";
import Button from "./Button";
import { AlertTriangle, HelpCircle } from "./icons";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  iconType?: "help" | "warn";
  initialFocus?: "confirm" | "cancel";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Yes",
  cancelLabel = "No",
  isLoading = false,
  iconType = "help",
  initialFocus = "cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, isLoading, onCancel]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const Icon = iconType === "warn" ? AlertTriangle : HelpCircle;
  const iconBgClass =
    iconType === "warn"
      ? "bg-amber-100 text-amber-700"
      : "bg-(--surface-pill) text-(--muted-foreground-strong)";

  const initialFocusSelector =
    initialFocus === "confirm"
      ? "[data-confirm-dialog-action='confirm']"
      : "[data-confirm-dialog-action='cancel']";

  const dialog = (
    <FocusTrap
      active={open}
      focusTrapOptions={{
        initialFocus: initialFocusSelector,
        // Restore focus to the element that opened the dialog when it closes.
        returnFocusOnDeactivate: true,
        // Allow clicks outside to bubble to our overlay handler so the user
        // can dismiss by clicking the backdrop.
        allowOutsideClick: true,
        // Esc handling is owned by our keydown listener so we can guard the
        // loading state; let focus-trap delegate it.
        escapeDeactivates: false,
      }}
    >
      <div
        className="fixed inset-0 z-60 flex items-end justify-center overflow-y-auto bg-gray-900/45 backdrop-blur-md px-4 py-4 sm:items-center"
        onClick={() => {
          if (!isLoading) {
            onCancel();
          }
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={messageId}
          aria-busy={isLoading}
          className="relative w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-(--line) bg-(--surface) p-5 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] sm:p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className={`h-10 w-10 rounded-full flex items-center justify-center ${iconBgClass}`}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3
                id={titleId}
                className="text-base font-semibold text-(--foreground-strong)"
              >
                {title}
              </h3>
              <p
                id={messageId}
                className="text-sm text-(--muted-foreground) mt-1"
              >
                {message}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-auto px-4"
              data-confirm-dialog-action="cancel"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 bg-(--ink) text-(--ink-foreground) hover:bg-(--accent)"
              data-confirm-dialog-action="confirm"
            >
              {isLoading ? "Working..." : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </FocusTrap>
  );

  return createPortal(dialog, document.body);
}
