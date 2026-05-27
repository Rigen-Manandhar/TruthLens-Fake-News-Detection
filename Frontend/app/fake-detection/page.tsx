"use client";

import DetectionFeedbackCard from "../components/fakeDetection/DetectionFeedbackCard";
import FakeDetectionForm from "../components/fakeDetection/FakeDetectionForm";
import FakeDetectionResult from "../components/fakeDetection/FakeDetectionResult";
import { useFakeDetectionController } from "../components/fakeDetection/useFakeDetectionController";
import Footer from "../components/Footer";

export default function FakeDetectionPage() {
  const controller = useFakeDetectionController();

  return (
    <div className="page-shell ambient-grid">
      <div className="pointer-events-none absolute -top-14 -left-16 h-64 w-64 rounded-full bg-(--warm)/30 blur-3xl" />
      <div className="pointer-events-none absolute top-32 -right-12 h-72 w-72 rounded-full bg-(--accent)/15 blur-3xl" />

      <main id="main-content" className="page-main space-y-8 sm:space-y-10">
        <header className="space-y-4 max-w-2xl">
          <div className="space-y-4">
            <h1 className="page-title display-title text-4xl sm:text-[2.9rem] font-bold text-(--foreground-strong) tracking-tight">
              Misinformation Risk Assessment
            </h1>
            <p className="text-sm sm:text-base text-(--muted-foreground) max-w-xl">
              Combine source credibility, article extraction, language signals, and evidence hints to assess misinformation risk.
            </p>
            <div className="flex items-center gap-3 text-xs text-(--muted-foreground)">
              <span className="h-2 w-2 rounded-full bg-(--ink)/45" />
              Hybrid evidence and risk analysis
            </div>
          </div>
        </header>

        <section className="grid items-start gap-6 xl:grid-cols-2">
          <FakeDetectionForm
            articleText={controller.articleText}
            sourceUrl={controller.sourceUrl}
            inputMode={controller.inputMode}
            isLoading={controller.isLoading}
            error={controller.error}
            onArticleChange={controller.setArticleText}
            onSourceUrlChange={controller.setSourceUrl}
            onInputModeChange={controller.setInputMode}
            onAnalyze={controller.analyze}
          />

          <div className="space-y-6 xl:flex xl:h-full xl:flex-col">
            <FakeDetectionResult
              level={controller.resultLevel}
              label={controller.resultLabel}
              details={controller.resultDetails}
              finalScore={controller.finalScore}
              steps={controller.steps}
              explanation={controller.explanation}
              analyzedText={controller.analyzedText}
              explanationClass={controller.explanationClass}
              uncertainty={controller.uncertainty}
              parseMetadata={controller.parseMetadata}
              modelOutputs={controller.modelOutputs}
              conflict={controller.conflict}
              fetchMetadata={controller.fetchMetadata}
              evidenceSummary={controller.evidenceSummary}
              explanationSummary={controller.explanationSummary}
              limeModel={controller.limeModel}
              canExplain={controller.canExplain}
              isExplaining={controller.isExplaining}
              isLoading={controller.isLoading}
              onExplain={controller.handleExplain}
            />

            {controller.canShowFeedback && (
              <DetectionFeedbackCard
                selectedValue={controller.feedbackSelection}
                comment={controller.feedbackComment}
                isSubmitting={controller.isSubmittingFeedback}
                isSubmitted={controller.feedbackSubmitted}
                status={controller.feedbackStatus}
                onSelect={controller.setFeedbackSelection}
                onCommentChange={controller.setFeedbackComment}
                onSubmit={controller.submitFeedback}
              />
            )}
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
