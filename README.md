# RailReady Current Affairs

Free, public daily headline feed for the RailReady RRB NTPC learning app.

## How it works
GitHub Actions runs daily at **07:00 IST** (01:30 UTC), plus on demand via **Actions → Daily RailReady news update → Run workflow**. The Python script fetches recent Indian Railways, government schemes, economy, science and Assam/Northeast headlines from Google News RSS and writes `data/news.json`. The feed may be delayed or unavailable. No paid API key is required.

**Important:** Headlines are *not* fact-checked exam notes or verified MCQs. They are reading leads with publisher links. Existing curated practice questions in RailReady remain separate. The app shows the update timestamp and should not imply a fresh update when the feed is stale.

Public JSON: https://raw.githubusercontent.com/bhootiyagaming838-stack/railready-current-affairs/main/data/news.json

The workflow requires repository Actions to be enabled and the `GITHUB_TOKEN` to have write permission. If a run fails with HTTP 403, check Settings → Actions → General → Workflow permissions → Read and write permissions.

GitHub's scheduled runs are not guaranteed to execute at the exact scheduled minute.
