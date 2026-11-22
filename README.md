# RailReady

**RRB NTPC Graduate exam preparation and daily practice**

RailReady is an independent study project providing subject-wise practice, timed mock examinations, revision tools, and automatically updated learning material. This repository maintains its public study data, scheduled content-generation workflows, a browser-based study application, and desktop/mobile wrappers for the original Floot application.

## Applications

| Edition | Access | Description |
| --- | --- | --- |
| Original Floot application | [Open RailReady](https://railready-ntpc.floot.app/) | Original interface and existing Floot-hosted learning features. |
| Complete Study web application | [Launch web app](https://bhootiyagaming838-stack.github.io/railready-current-affairs/) | Subject lessons, question banks, CBT-1 mock tests, revision, and local progress backup. |
| Daily MCQ practice | [Open daily quiz](https://bhootiyagaming838-stack.github.io/railready-current-affairs/daily.html) | A new dated set of 60 original Mathematics and Reasoning questions, subject to successful scheduled publication. |
| World GK & RRB-pattern GA | [Study World GK](https://bhootiyagaming838-stack.github.io/railready-current-affairs/world-gk.html) | 79 original world-science/geography/computer/international questions, 61 sequence questions across 21 international series, 8 further dated current-affairs GK questions, first/second/second-last/last notes, and a balanced 40-question GA drill. |
| Android application | [Download APK](https://github.com/bhootiyagaming838-stack/railready-current-affairs/releases/tag/railready-floot-android-v1) | Personal-use WebView wrapper for the original Floot application. |
| Windows application | [Download Windows release](https://github.com/bhootiyagaming838-stack/railready-current-affairs/releases/tag/railready-floot-windows-v1) | Portable desktop wrapper for the original Floot application. See [desktop documentation](desktop/README.md) for build details and the newer daily-quiz integration. |

The Floot application and the GitHub Pages application are separate deployments. Improvements to the GitHub Pages edition do not automatically change the Floot interface.

## Study features

The Complete Study web edition includes:

- **319 original practice questions:** 73 General Awareness, 127 Mathematics, and 119 Reasoning.
- **28 topic lessons:** 14 Mathematics and 14 Reasoning lessons with key concepts, worked examples, and revision tips.
- **CBT-1 practice mock:** 100 questions across General Awareness (40), Mathematics (30), and Reasoning (30), with a 90-minute timer and a marking scheme of +1 for a correct response and −⅓ for an incorrect response.
- **Practice and review:** Subject filters, shorter quizzes, explanations, bookmarks, error review, and spaced repetition.
- **Progress management:** Local study history, daily targets, and JSON backup and restore.
- **Current affairs:** Source-linked news headlines and a separate index of previous-year paper resources.

The exam format is modelled on the [RRB NTPC Graduate CEN 05/2024 notification](https://rrbahmedabad.gov.in/wp-content/uploads/2024/09/CEN-05-2024-NTPC-Graduate_a11y.pdf). RailReady is not affiliated with or endorsed by the Railway Recruitment Boards.

## Automatic daily updates

Two GitHub Actions workflows maintain the public study data.

| Workflow | Planned schedule (IST) | Output |
| --- | --- | --- |
| [Daily current affairs](https://github.com/bhootiyagaming838-stack/railready-current-affairs/actions/workflows/daily-current-affairs.yml) | Approximately 7:00 AM | Source-linked headline feed in `data/news.json`. |
| [Daily MCQ generation](https://github.com/bhootiyagaming838-stack/railready-current-affairs/actions/workflows/daily-mcqs.yml) | Approximately 7:15 AM | 60 original MCQs in `data/daily-mcqs.json`, with a dated archive in `data/daily-history/`. |

The daily MCQ generator produces **30 Mathematics and 30 Reasoning questions**, each with four answer options and an explanation. Questions are generated deterministically for a given date and checked before publication. A regression test simulates 45 consecutive dates and checks 2,700 generated questions for answer correctness and repetition within the preceding 14 days.

The existing Floot application's News quiz consumes the `data/news.json.questions` field, which is currently supplied with the daily MCQ set for compatibility. Its existing **Headline quiz** label has not yet been updated in the Floot interface. Original headlines remain in `data/news.json.notes`.

Scheduled GitHub Actions workflows may run late or fail. Publication status and the date displayed in the quiz should be checked before treating a set as current. These workflows do not use a paid AI API.

## Content accuracy and provenance

- Original practice questions are **not represented as verified RRB previous-year questions (PYQs)**.
- The [PYQ source index](data/pyq-source-index.json) provides references to official notices and clearly identified third-party paper collections; it is not a collection of verified transcribed PYQs.
- Daily generated MCQs cover computational and logical practice. They are **not automatically verified factual current-affairs questions**.
- Current-affairs headlines are leads for further reading, not independently fact-checked exam notes. Refer to the linked publisher and official notices when verifying claims.

## Repository structure

| Path | Purpose |
| --- | --- |
| `index.html`, `app.js`, `app.css` | Complete Study web application. |
| `world-gk.html`, `world-gk.js`, `data/world-gk.json` | International General Awareness, historical first/last notes, RRB-pattern drills, and original multiple-choice questions. |
| `daily.html`, `daily.js` | Daily quiz interface, answer review, and browser-local session state. |
| `data/general-awareness-bank.json` | Original General Awareness practice questions. |
| `data/quant-reasoning-bank.json` | Original Mathematics and Reasoning practice questions. |
| `data/study-lessons.json` | Structured lesson content. |
| `data/daily-mcqs.json`, `data/daily-history/` | Latest and archived daily MCQ sets. |
| `data/news.json` | Source-linked news headlines and compatibility question feed. |
| `scripts/` | Data generation, validation, and regression tests. |
| `android/` | Android WebView wrapper for the Floot application. |
| `desktop/` | Electron-based Windows wrapper for the Floot application. |
| `.github/workflows/` | Scheduled generation, validation, publication, and application builds. |

## Development and verification

The study and daily quiz interfaces use static HTML, CSS, and JavaScript. The scheduled data-generation scripts use Python's standard library.

From the repository root, run:

```bash
python scripts/validate_study_content.py
python scripts/validate_daily_mcqs.py
python scripts/verify_daily_answers.py
python scripts/test_daily_future.py
node scripts/test_static_app.cjs
node scripts/test_daily_quiz.cjs
```

The daily-question checks verify option integrity, answer calculations, dated archives, and Floot feed compatibility. The interface smoke tests exercise quiz navigation, answer feedback, results, and saved sessions. GitHub Actions publishes the web edition via the [deployment workflow](https://github.com/bhootiyagaming838-stack/railready-current-affairs/actions/workflows/deploy-study-app.yml).

## Installation and data storage

The Android APK and Windows executable open the existing Floot application rather than packaging the complete GitHub Pages edition. Both require an internet connection and continued availability of the hosted site.

Desktop and Android builds are distributed for personal use. Windows executables are unsigned and may trigger Microsoft Defender SmartScreen warnings; Android builds may require permission to install an APK from the chosen source. Download builds from the project's own GitHub releases or workflow artifacts and keep operating-system security protections enabled.

Study progress is stored locally in each application's browser or WebView storage. Progress does **not** synchronize automatically between the Floot website, the Complete Study site, Android, and Windows. The Complete Study application supports a local JSON export/import workflow.

Additional deployment instructions are available in [web publication documentation](docs/publish-complete-study-app.md), [Android documentation](android/README.md), and [Windows documentation](desktop/README.md).

## Maintenance

The project uses free hosting and automation services subject to their providers' availability, quotas, and usage policies. Review workflow logs when scheduled updates do not appear, and verify exam-specific information against official Railway Recruitment Board notices.
