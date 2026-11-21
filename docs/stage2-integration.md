# RailReady stage-2 integration checklist

**Status (2026-11-22):** Staged in GitHub; NOT live in Floot app. No user progress or current content should be erased.

## Stage A — Maths and Reasoning (highest priority)
1. Read `data/quant-reasoning-bank.json` (246 original questions, 127 Maths + 119 Reasoning) and `data/study-lessons.json` (28 notes) from the GitHub raw URL. Prefer a backend proxy, with last-successful local cache and visible refresh errors.
2. Add bottom navigation **Learn** or a well-marked Study entry. Show Mathematics and Reasoning cards with topic selection, concise rules, worked examples and 'Practice this topic'.
3. Extend practice selection to include each new section, with `kind: Original practice` and skill-level filters. Preserve existing GA and dated current affairs feeds.
4. Typecheck and test: lesson display, topic filter, 4-option answers, explanations, refresh, mobile 412px display, and offline fallback.

## Stage B — Full CBT-1 mock
1. Combine 40 General Awareness + 30 Maths + 30 Reasoning questions from distinct banks. Respect the official 100-question/90-minute/+1/−⅓ format, source: RRB NTPC Graduate CEN 05/2024.
2. Adapt the existing Floot mock flow rather than replacing it: full/mock type flag; timer 90 min vs mini 27 min; navigator, skipped/answered states, warning on early submission; section score breakdown and wrong-answer review.
3. Use `src/studyEngine.ts` helpers `createCBT1Mock` and `scoreCBT1`. Test section counts and score for all-correct, all-wrong, mixed, skipped, and timer expiry.
4. Do **not** call a mixed 30-question GA mini mock a full CBT-1 exam.

## Stage C — Spaced revision + progress backup
1. Use `reviewCard` and `dueQuestions` from `src/studyEngine.ts`: revise after 1, 3, 7, 14, 30 days with reset to 1 day on an incorrect answer. Mark bookmarks or mistakes as cards.
2. Show the count and 'Review due today' entry in Progress, with familiar question/answer UI.
3. Provide **Export progress JSON** and **Import progress JSON** controls using the validation utilities in `src/studyEngine.ts`. Allow the user to explicitly select the file and confirm before replacing current progress.
4. Avoid storing user data in a public GitHub repository. Backup stays on the device in a file unless the user explicitly chooses where to save it.

## Stage D — verified PYQ library
1. Use `data/pyq-source-index.json` as a source navigation index; link to official RRB response/answer-key notices, and clearly mark any third-party paper compilations.
2. **No actual transcribed PYQ is currently verified.** Do not label any of the 246 original questions, the 104 original GA questions, or date-based news questions as PYQs.
3. Add shift-specific questions only after verifying exact question text, options and correct answers from a reliable paper and answer key. Include source, paper date, stage and shift metadata. Obtain rights/permission for any bulk reproduction as appropriate.

## Publication and testing
The live Floot project is `6109a120-e850-491a-b5f8-ac94d7244976`, published at https://railready-ntpc.floot.app. Floot's free build-action quota blocked editing during 2026-11-22. Do not state that this staged GitHub content is already present in the live app. After build access is available, import and integrate, run tests, create a checkpoint, publish, and verify production bank + pages. Keep the daily GitHub news automation running separately.
