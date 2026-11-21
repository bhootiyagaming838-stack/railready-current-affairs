# RailReady Floot Android APK — free personal installation

This native Android container opens the existing **https://railready-ntpc.floot.app/** website inside Android System WebView. It keeps the **Floot** design you preferred, rather than switching to the separate GitHub Pages study interface.

- **Completely free for personal use:** no paid Floot build and no Google Play developer account required.
- **Installable `.apk` package** for your Samsung Galaxy S25. Supported Android 7+; Android System WebView must be installed and working.
- **Network-required app:** content is served by Floot when online. Automatic news and updates are handled by the existing website. This is not an offline-native rewrite.
- **Data stored on device** by WebView is separate from the Chrome website's own local storage. The initial APK won't automatically import old browser history or bookmarks.
- No sign-in, ads, push notifications, location, microphone, camera or contacts permissions have been added.
- External website links open in the phone's browser.
- Debug-signed APK is for **personal sideloading**, not Google Play distribution. The first released build is retained to avoid changes to the debug signing certificate between runners.

## Download and install
Build workflow: https://github.com/bhootiyagaming838-stack/railready-current-affairs/actions/workflows/build-floot-apk.yml

Once the workflow succeeds, download:
https://github.com/bhootiyagaming838-stack/railready-current-affairs/releases/download/railready-floot-android-v1/RailReady-Floot.apk

On your Samsung: open the APK link in Chrome, download the APK, open it in **My Files → Downloads**, approve **Install unknown apps** for that source if prompted, and install. You do not need to disable Play Protect. Android may display a warning because it is a privately built APK rather than a Play Store app.

The first installation uses about the same network/data as visiting the Floot site. Future Floot website edits normally appear automatically when the APK next loads that URL; no APK rebuild is needed.

The separate full-study GitHub Pages edition remains available independently.
