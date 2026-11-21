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
