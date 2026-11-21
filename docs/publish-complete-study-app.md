# Publish the free RailReady Complete Study app

**Status:** App files and data are in this public GitHub repository. Test workflow **Test RailReady Study App** passes. A deployment workflow is installed, but the first deployment stops at `actions/configure-pages` because **GitHub Pages has not yet been enabled** for this repository. The Floot-hosted app at https://railready-ntpc.floot.app is a separate older version.

## One-time setup (repository owner only)

1. Visit https://github.com/bhootiyagaming838-stack/railready-current-affairs/settings/pages
2. Find **Build and deployment → Source**.
3. Select **GitHub Actions**, then save if prompted. You do not need to add a custom domain, credit card, or API key.
4. Visit https://github.com/bhootiyagaming838-stack/railready-current-affairs/actions/workflows/deploy-study-app.yml
5. Select **Run workflow** → **main** → **Run workflow**. Wait for a green check.
6. Open https://bhootiyagaming838-stack.github.io/railready-current-affairs/

If the workflow fails, open its run to see the error. The initial failure in the current repository was **Get Pages site failed: Not Found** at the `actions/configure-pages@v5` step. This is expected until the owner enables GitHub Pages.

## Samsung Galaxy S25 installation
Open the final GitHub Pages URL in Chrome. Use the browser's menu and choose **Add to Home screen** or **Install app** if available. This installs a web app (PWA), **not an APK**. The app caches downloaded study files for offline use and checks for new published data when online.

## What the free edition includes

- 73 original GA questions, 127 original Maths questions, 119 original Reasoning questions (319 original MCQs in total).
- 28 Maths/Reasoning learning notes with rules, examples and shortcuts.
- 100-question, 90-minute CBT-1 simulation, 40 GA + 30 Maths + 30 Reasoning; +1 / −⅓ scoring, skipped questions, timer, navigation, explanations and topic breakdown.
- 30-question timed mixed mini mock and 5/20-question practice modes.
- Bookmarking, wrong-answer review, spaced repetition after 1/3/7/14/30 days, daily goals and progress dashboard.
- Local JSON export and import of progress.
- Automatic GitHub current-affairs headline feed with source links; not fact-checked question generation.
- PYQ *source index* with official links and third-party labels. **No individually verified and transcribed PYQs have been added yet.**
- Offline-enabled web app; caching activates after the initial download.

Progress saved under the old Floot domain is not automatically shared across domains. Do not clear old site data until you have a backup/migration method.

## Verification
- `python scripts/validate_study_content.py` checks original Maths/Reasoning answer options and metadata.
- `node scripts/test_static_app.cjs` performs a rendering/interaction smoke test.
- The GitHub Actions **Test RailReady Study App** workflow runs on changes and should show a green check.

## Daily maintenance
The existing **Daily RailReady news update** workflow runs automatically around 7:00 AM IST, but GitHub Actions may delay scheduled jobs. New headlines appear on the web app after the workflow publishes them to `data/news.json`. This is not guaranteed AI question generation, which would require fact checking.
