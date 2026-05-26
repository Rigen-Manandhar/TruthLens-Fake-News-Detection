"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
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
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    // Capture the element that opened the dialog so we can restore focus
    // after it closes — keeps keyboard users oriented.
    previouslyFocusedRef.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const previous = previouslyFocusedRef.current;
      if (previous && typeof previous.focus === "function") {
        // Defer focus restoration to the next tick so React can finish
        // unmounting the dialog DOM before we move focus back.
        queueMicrotask(() => previous.focus());
      }
    };
  }, [open, isLoading, onCancel]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const Icon = iconType === "warn" ? AlertTriangle : HelpCircle;
  const iconBgClass =
    iconType === "warn"
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-900/5 text-gray-700";

  const dialog = (
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
        className="relative w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-white/80 bg-white/95 p-5 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] sm:p-6"
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
            <h3 id={titleId} className="text-base font-semibold text-gray-900">
              {title}
            </h3>
            <p id={messageId} className="text-sm text-gray-600 mt-1">
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
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 bg-gray-900 text-white hover:bg-black"
          >
            {isLoading ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
