import type {
  ConflictInfo,
  EvidenceSummary,
  FetchMetadata,
  ModelOutputs,
} from "@/lib/shared/detection-feedback";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Globe,
  MessageSquare,
  MinusCircle,
  Search,
  XCircle,
} from "../ui/icons";

type Status = "pass" | "warn" | "fail" | "skipped";

interface SignalsChecklistProps {
  evidenceSummary?: EvidenceSummary;
  fetchMetadata?: FetchMetadata;
  modelOutputs?: ModelOutputs;
  conflict?: ConflictInfo;
}

interface SignalRow {
  key: string;
  label: string;
  Icon: typeof Globe;
  status: Status;
  context: string;
}

const statusStyles: Record<Status, { className: string; Icon: typeof CheckCircle2; srLabel: string }> = {
  pass: {
    className: "text-emerald-700",
    Icon: CheckCircle2,
    srLabel: "Checked",
  },
  warn: {
    className: "text-amber-700",
    Icon: AlertTriangle,
    srLabel: "Warning",
  },
  fail: {
    className: "text-red-700",
    Icon: XCircle,
    srLabel: "Failed",
  },
  skipped: {
    className: "text-(--muted-foreground)",
    Icon: MinusCircle,
    srLabel: "Skipped",
  },
};

const formatConfidence = (value?: number | null) => {
  if (typeof value !== "number") {
    return null;
  }
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
};

const buildRows = ({
  evidenceSummary,
  fetchMetadata,
  modelOutputs,
}: SignalsChecklistProps): SignalRow[] => {
  const sourceSignal = evidenceSummary?.source_signal;
  const coverageSignal = evidenceSummary?.coverage_signal;

  // 1. Source credibility
  const sourceRow: SignalRow = sourceSignal?.known
    ? {
        key: "source",
        label: "Source credibility",
        Icon: Globe,
        status: "pass",
        context:
          `${sourceSignal.domain ?? "Source"} matched in source database` +
          (sourceSignal.credibility ? ` · ${sourceSignal.credibility}` : "") +
          ". Indicator only.",
      }
    : {
        key: "source",
        label: "Source credibility",
        Icon: Globe,
        status: "skipped",
        context: sourceSignal?.domain
          ? `${sourceSignal.domain} not in source database — no source signal applied.`
          : "No URL provided — source signal skipped.",
      };

  // 2. Article retrieval
  let retrievalRow: SignalRow;
  if (fetchMetadata?.attempted) {
    retrievalRow = fetchMetadata.success
      ? {
          key: "retrieval",
          label: "Article retrieval",
          Icon: Download,
          status: "pass",
          context: "Article text fetched from URL.",
        }
      : {
          key: "retrieval",
          label: "Article retrieval",
          Icon: Download,
          status: "fail",
          context: "Retrieval attempted but did not succeed.",
        };
  } else {
    retrievalRow = {
      key: "retrieval",
      label: "Article retrieval",
      Icon: Download,
      status: "skipped",
      context: "No URL fetch attempted.",
    };
  }

  // 3. Headline analysis
  const modelA = modelOutputs?.model_a;
  const headlineRow: SignalRow = modelA?.ran
    ? {
        key: "headline",
        label: "Headline analysis",
        Icon: MessageSquare,
        status: "pass",
        context: (() => {
          const conf = formatConfidence(modelA.confidence);
          return conf !== null
            ? `Headline scored by Model A (${conf}% confidence). Indicator only.`
            : "Headline scored by Model A. Indicator only.";
        })(),
      }
    : {
        key: "headline",
        label: "Headline analysis",
        Icon: MessageSquare,
        status: "skipped",
        context: "Headline model did not run.",
      };

  // 4. Article analysis
  const modelB = modelOutputs?.model_b;
  const articleRow: SignalRow = modelB?.ran
    ? {
        key: "article",
        label: "Article analysis",
        Icon: MessageSquare,
        status: "pass",
        context: (() => {
          const conf = formatConfidence(modelB.confidence);
          return conf !== null
            ? `Article body scored by Model B (${conf}% confidence). Indicator only.`
            : "Article body scored by Model B. Indicator only.";
        })(),
      }
    : {
        key: "article",
        label: "Article analysis",
        Icon: MessageSquare,
        status: "skipped",
        context: "Article model did not run.",
      };

  // 5. Coverage cross-reference
  const coverageRow: SignalRow = coverageSignal?.checked
    ? {
        key: "coverage",
        label: "Coverage cross-reference",
        Icon: Search,
        status:
          coverageSignal.trusted_match_count > 0 ? "pass" : "warn",
        context: coverageSignal.message,
      }
    : {
        key: "coverage",
        label: "Coverage cross-reference",
        Icon: Search,
        status: "skipped",
        context: coverageSignal?.message ?? "Coverage check not performed.",
      };

  return [sourceRow, retrievalRow, headlineRow, articleRow, coverageRow];
};

export default function SignalsChecklist(props: SignalsChecklistProps) {
  const rows = buildRows(props);

  return (
    <div className="rounded-2xl border border-(--line) bg-[#fffdf8] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--muted-foreground-strong)">
        Signals checked
      </p>
      <ul className="mt-3 divide-y divide-(--line)/60">
        {rows.map(({ key, label, Icon, status, context }) => {
          const style = statusStyles[status];
          const StatusIcon = style.Icon;
          return (
            <li
              key={key}
              className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <Icon
                aria-hidden
                className="mt-0.5 h-4 w-4 shrink-0 text-(--muted-foreground-strong)"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#3f382f]">
                    {label}
                  </span>
                  <span className={`flex items-center gap-1 text-[11px] font-semibold ${style.className}`}>
                    <StatusIcon aria-hidden className="h-3.5 w-3.5" />
                    <span className="sr-only">{style.srLabel}</span>
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[#5f5548]">
                  {context}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      {props.conflict?.is_conflict && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          Models disagreed — result treated as review-needed.
        </p>
      )}
    </div>
  );
}
