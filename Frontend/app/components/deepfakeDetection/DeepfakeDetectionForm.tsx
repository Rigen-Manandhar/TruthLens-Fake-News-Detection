"use client";

import { useCallback, useRef, useState } from "react";

interface DeepfakeDetectionFormProps {
  selectedFile: File | null;
  previewUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onFileSelect: (file: File | null) => void;
  onAnalyze: () => void;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm";

export default function DeepfakeDetectionForm({
  selectedFile,
  previewUrl,
  isLoading,
  error,
  onFileSelect,
  onAnalyze,
}: DeepfakeDetectionFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isVideo = selectedFile?.type.startsWith("video/") ?? false;

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (!file) return;
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0] ?? null;
      handleFileChange(file);
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      handleFileChange(file);
    },
    [handleFileChange]
  );

  const handleClear = useCallback(() => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onFileSelect]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onAnalyze();
    },
    [onAnalyze]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col rounded-3xl border border-(--line) bg-[#fffdfa]/90 shadow-[0_22px_46px_rgba(24,16,8,0.1)] px-5 sm:px-8 py-6 sm:py-7 overflow-hidden lg:min-h-144"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#12100d] via-(--accent) to-[#e8b074]" />

      <div className="relative flex flex-col h-full">
        <div className="space-y-1.5 mb-4">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-(--muted-foreground-strong) uppercase">
            Upload
          </p>
          <label htmlFor="deepfake-file" className="text-sm font-semibold text-[#17130f]">
            Image or Video
          </label>
          <p className="text-xs text-(--muted-foreground)">
            Upload an image or short video to assess whether visual manipulation signals are present.
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mb-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 transition-colors ${
            isDragOver
              ? "border-[#0e7c66] bg-[#e8f5f1]"
              : "border-(--line) bg-[#f7f1e6]"
          }`}
        >
          {previewUrl ? (
            <div className="w-full flex flex-col items-center gap-3">
              {isVideo ? (
                <video
                  src={previewUrl}
                  controls
                  className="max-h-48 w-auto rounded-xl"
                />
              ) : (
                // Blob URLs from URL.createObjectURL cannot be optimised by next/image; raw <img> is intentional.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 w-auto rounded-xl object-contain"
                />
              )}
              <p className="text-xs text-[#5f5548] truncate max-w-full">
                {selectedFile?.name}
              </p>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-[#7e7263] hover:text-[#17130f]"
              >
                Remove file
              </button>
            </div>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-[#8a7d6d] mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-sm text-[#5f5548] text-center">
                Drag and drop or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-semibold text-[#17130f] hover:text-(--accent)"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-[#8a7d6d] mt-1">
                Images: JPG, PNG, WebP. Videos: MP4, MOV, AVI, MKV, WebM.
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            id="deepfake-file"
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>

        {error && (
          <p className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-auto flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading || !selectedFile}
            className="text-xs font-semibold text-[#7e7263] hover:text-[#17130f] disabled:opacity-50"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={isLoading || !selectedFile}
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-full bg-[#12100d] px-8 text-sm font-semibold text-[#f7f1e6] shadow-[0_12px_24px_rgba(24,16,8,0.22)] transition-all hover:bg-(--accent) disabled:cursor-not-allowed disabled:opacity-60 shrink-0"
          >
            {isLoading ? "Analyzing..." : "Assess Media"}
          </button>
        </div>
      </div>
    </form>
  );
}
