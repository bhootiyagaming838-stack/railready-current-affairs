## 🆕 Automatic daily 60-MCQ practice

- **Daily quiz:** https://bhootiyagaming838-stack.github.io/railready-current-affairs/daily.html
- Every day the free GitHub Actions workflow generates **60 new original exam-style MCQs: 30 Mathematics + 30 Reasoning**, each with four answer options, a computed answer key and an explanation. Questions are kept stable within each day and archived by date.
- **Schedule:** about **7:15 AM IST** (`01:45 UTC`), but GitHub can delay or skip schedules. Use [Generate RailReady 60 Daily MCQs](https://github.com/bhootiyagaming838-stack/railready-current-affairs/actions/workflows/daily-mcqs.yml) to check its run status.
- The workflow also updates `data/news.json.questions` so the **existing Floot RailReady app, PC app and Android APK** can fetch the 60 daily questions from **News → Headline quiz** without rebuilding. **The Floot button still says "Headline quiz" because its free build quota prevented changing the UI.** This is temporary; questions are Maths and Reasoning, not headline categorization.
- Original news headlines are preserved in `data/news.json.notes`, and the old headline exercises in `headlineReadingQuestions` for a future UI upgrade.
- The daily practice page has an offline last-successful-cache and stores practice results locally in the browser. It does not automatically merge scores with Floot browser storage.
- Every run validates exact answer keys and performs a 45-day regression simulation covering **2,700 questions** with no identical question within the preceding 14 days.
- **No paid API, OpenAI API key, or subscription is needed.** These are original algorithmic Maths and Reasoning questions, **not verified PYQs or factual current-affairs MCQs**.

---

# RailReady Complete Study — Free Web App

**The complete-study edition is now built and tested in this repository.** It is not yet publicly deployed because the repository owner must enable GitHub Pages once.

**Enable it:** [Settings → Pages](https://github.com/bhootiyagaming838-stack/railready-current-affairs/settings/pages) → **Build and deployment → Source: GitHub Actions**, then [Run the Deploy RailReady Complete Study App workflow](https://github.com/bhootiyagaming838-stack/railready-current-affairs/actions/workflows/deploy-study-app.yml).

**After a successful deployment:** https://bhootiyagaming838-stack.github.io/railready-current-affairs/

**Full instructions:** [Publish and install on Samsung](docs/publish-complete-study-app.md).

**What is built:** 319 original practice MCQs (73 GA + 127 Maths + 119 Reasoning), 28 Maths and Reasoning lessons, timed 100-question CBT-1 simulator (40/30/30 split, 90 minutes, +1 / −⅓), short practice, spaced revision, bookmarks, wrong-answer review, progress backup/restore, news and PYQ source links. None of the original questions is labelled a verified PYQ.

**Automated tests:** [RailReady study app CI](https://github.com/bhootiyagaming838-stack/railready-current-affairs/actions/workflows/test-study-app.yml) has passed. [First deployment run](https://github.com/bhootiyagaming838-stack/railready-current-affairs/actions/runs/44941855840) passed the app syntax and data checks but failed at Pages configuration because Pages was disabled.

**Earlier live Floot app:** https://railready-ntpc.floot.app — still runs its previous version; no change was published to Floot because the free daily build-action limit has been reached. The two domains do not share browser-saved progress.

---

# RailReady Current Affairs

Free, public daily headline feed for the RailReady RRB NTPC learning app.

## How it works
GitHub Actions runs daily at **07:00 IST** (01:30 UTC), plus on demand via **Actions → Daily RailReady news update → Run workflow**. The Python script fetches recent Indian Railways, government schemes, economy, science national affairs, and awards/sports headlines from Google News RSS and writes `data/news.json`. The feed may be delayed or unavailable. No paid API key is required.

**Important:** Headlines are *not* fact-checked exam notes. Automatically generated headline-category quizzes are not verified factual current-affairs MCQs. They are reading leads with publisher links. Existing curated practice questions in RailReady remain separate. The app shows the update timestamp and should not imply a fresh update when the feed is stale.

Public JSON: https://raw.githubusercontent.com/bhootiyagaming838-stack/railready-current-affairs/main/data/news.json

The workflow requires repository Actions to be enabled and the `GITHUB_TOKEN` to have write permission. If a run fails with HTTP 403, check Settings → Actions → General → Workflow permissions → Read and write permissions.

GitHub's scheduled runs are not guaranteed to execute at the exact scheduled minute.

## Next RailReady study-app upgrade — staged, not yet live

These files are prepared in GitHub for the next Floot project build:

- `data/quant-reasoning-bank.json` — **246 original practice MCQs** (127 Mathematics, 119 Reasoning), with four options and explanations. None is represented as a verified PYQ.
- `data/study-lessons.json` — **28 concise learning lessons** (14 Maths, 14 Reasoning), each with rules, worked examples and common traps.
- `data/pyq-source-index.json` — official RRB notices, verified exam-pattern metadata and clearly marked third-party paper collections. **No individual question has yet been transcribed and verified as a PYQ.**
- `src/studyEngine.ts` — source-ready helpers for a 100-question CBT-1 mock, 90-minute test mode, 40/30/30 section allocation, +1/−⅓ scoring, local spaced revision, and JSON backup/restore.
- `scripts/validate_study_content.py` and its GitHub Actions workflow — automatic validation of the prepared question bank, lessons and labels.

**Deployment status:** These new study materials are currently stored in GitHub and have **not** been connected or published to the Floot-hosted RailReady app (`https://railready-ntpc.floot.app`). Floot's free daily build-action limit blocked editing and publishing during the current session. When project build access is available, the next step is to import the staged files, build the Maths/Reasoning learning UI and full CBT-1 mock, test it, then publish. The existing live RailReady app remains unchanged.
