# Limitations and Methodology

## Project Position

TruthLens is a hybrid misinformation risk assessment and fact-checking support system. It does not claim to prove whether news is true or false.

The main project improvement is the pivot away from treating RoBERTa as the final judge. RoBERTa is now one language-pattern signal inside a wider review workflow.

## Research Basis

- Guo et al. describe automated fact-checking as a workflow involving claim detection, evidence retrieval, and claim verification, not just text classification: https://aclanthology.org/2022.tacl-1.11/
- FEVER uses evidence-based labels such as supports, refutes, and not enough info, which matches the TruthLens choice to expose uncertainty: https://fever.ai/dataset/fever.html
- Fake-news detection research includes knowledge-based, style-based, source-based, and propagation-based signals, supporting the hybrid approach used here: https://www.mdpi.com/2078-2489/13/11/527
- The LIAR dataset paper presents fake-news detection as a challenging problem where metadata can help text classification, not as a solved text-only task: https://aclanthology.org/P17-2067/

## Why Text Classifiers Are Limited

Text classifiers can learn:

- dataset artifacts,
- common writing styles,
- sensational wording,
- topic bias,
- source-specific phrasing,
- and training-set shortcuts.

They cannot independently verify real-world facts. A classifier does not know whether a quote was actually said, whether a number is accurate, or whether a story has changed after publication.

## Hybrid Method

TruthLens combines:

- source credibility context,
- URL eligibility and article extraction checks,
- headline/claim language signal from Model A,
- article language signal from Model B,
- confidence-weighted scoring,
- conflict handling,
- claim hints for manual review,
- optional trusted-source coverage checking,
- and clear uncertainty messaging.

## Evidence Layer

The evidence layer is intentionally lightweight. It extracts 1-3 check-worthy claim hints using simple heuristics such as numbers, dates, named entities, quotes, and factual verbs.

If `NEWS_API_KEY` is configured, the system searches for trusted-source coverage of the top claim hint. Coverage is reported as support for review, not proof.

If no evidence check is available, the system reports `NOT_CHECKED` instead of pretending verification happened.

## Source Credibility Layer

The source database is a transparent seed list. Each source entry includes provenance fields such as rationale, review date, reference URL, and notes.

This layer is useful for source-risk context, but it is not a complete or live authority. Unknown sources stay neutral.

## Final Interpretation

TruthLens should be evaluated as a decision-support workflow:

- useful for triage,
- useful for showing uncertainty,
- useful for explaining model limits,
- not suitable as a final automated truth detector.
