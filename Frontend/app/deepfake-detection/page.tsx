"use client";

import { useCallback, useState } from "react";
import DeepfakeDetectionForm from "../components/deepfakeDetection/DeepfakeDetectionForm";
import DeepfakeDetectionResult from "../components/deepfakeDetection/DeepfakeDetectionResult";
import Footer from "../components/Footer";
import type { DeepfakeResponse } from "../components/deepfakeDetection/types";

export default function DeepfakeDetectionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeepfakeResponse | null>(null);

  const handleFileSelect = useCallback(
    (file: File | null) => {
      setSelectedFile(file);
      setError(null);
      setResult(null);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      if (file) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    },
    [previewUrl]
  );

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select an image or video to analyze.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/deepfake/predict", {
        method: "POST",
        body: formData,
        cache: "no-store",
      });

      const json = (await res.json().catch(() => null)) as
        | (DeepfakeResponse & { detail?: string; error?: string })
        | null;

      if (!res.ok) {
        const detail =
          json?.detail ?? json?.error ?? "Analysis failed. Please try again.";
        throw new Error(typeof detail === "string" ? detail : "Analysis failed.");
      }

      if (!json || typeof json.verdict !== "string") {
        throw new Error("Unexpected response from server.");
      }

      setResult(json);
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Something went wrong while analyzing. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  return (
    <div className="page-shell ambient-grid">
      <div className="pointer-events-none absolute -top-14 -left-16 h-64 w-64 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-32 -right-12 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main className="page-main space-y-8 sm:space-y-10">
        <header className="space-y-4 max-w-2xl">
          <div className="space-y-4">
            <h1 className="page-title display-title text-4xl sm:text-[2.9rem] font-bold text-[#17130f] tracking-tight">
              Deepfake Detection
            </h1>
            <p className="text-sm sm:text-base text-(--muted-foreground) max-w-xl">
              Upload an image or short video to assess whether visual manipulation
              signals are present. This tool supports review but does not prove
              authenticity.
            </p>
            <div className="flex items-center gap-3 text-xs text-(--muted-foreground)">
              <span className="h-2 w-2 rounded-full bg-[#12100d]/45" />
              Visual manipulation risk analysis
            </div>
          </div>
        </header>

        <section className="grid items-start gap-6 xl:grid-cols-2">
          <DeepfakeDetectionForm
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            isLoading={isLoading}
            error={error}
            onFileSelect={handleFileSelect}
            onAnalyze={handleAnalyze}
          />

          <div className="space-y-6 xl:flex xl:h-full xl:flex-col">
            <DeepfakeDetectionResult result={result} isLoading={isLoading} />
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
