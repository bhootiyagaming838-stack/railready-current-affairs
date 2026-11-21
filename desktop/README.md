# RailReady NTPC — Free Windows PC edition

This is an actual Windows desktop executable, built with Electron, which displays the **original Floot RailReady website** https://railready-ntpc.floot.app/ in its own window.

## Downloads
The GitHub Actions workflow builds a single **Windows portable .exe**, without paid services:
https://github.com/bhootiyagaming838-stack/railready-current-affairs/actions/workflows/build-floot-pc.yml

After its first successful release:
https://github.com/bhootiyagaming838-stack/railready-current-affairs/releases/download/railready-floot-windows-v2/RailReady-Floot-Windows.exe

## Install on Windows 10/11
1. Download `RailReady-Floot-Windows.exe`.
2. Open it from Downloads (it is portable, so no installation wizard is needed).
3. To keep it, move it to a folder, right-click and select **Show more options → Send to → Desktop (create shortcut)**.
4. Use **RailReady → Daily MCQs** or Ctrl+D to open the automatically updated 60-question daily Maths and Reasoning quiz inside the same window. This daily quiz is served from GitHub Pages and runs without any paid AI service.

It needs internet to load Floot, and it uses its own Chromium local storage, separate from your browser and Android app.

The executable is **unsigned** because software signing certificates cost money. Windows SmartScreen may warn you that the publisher is unknown. Verify that you downloaded the EXE from your own GitHub repository. Don't disable security protections globally.

### Security
- Restricts app navigation to https://railready-ntpc.floot.app/
- Opens other HTTPS links in your normal browser
- Node integration disabled; context isolation, sandbox and web security enabled
- Denies OS permission requests
- No automatic updates, background services, account permissions or paid APIs

This is a wrapper for the existing Floot app, not a native offline reconstruction. Continued availability depends on the Floot-hosted website.
