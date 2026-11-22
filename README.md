# GOVAI V1.4 – Government AI Services

A mobile-friendly, white and minimal prototype for helping users prepare for selected Zambian business and government-related services.

## New in V1.4: conversational guided demos (wizard.js)
The home screen is blank: just the greeting and "Ask anything". Tap the box and three suggestions pop up: **Register a business**, **Register a TPIN**, **Create a business profile** (you can also type or say them).

Each demo runs **inside the chat**: 10 short questions, one chat message at a time. Answer by typing, tapping a quick-reply button, or speaking.
- Ask "what does that mean?", "what is an NRC?", "why do you need this?", "give me an example", "how much does it cost?" at any point. It explains, then asks the question again.
- Commands: **back, repeat, skip, cancel, start over, read answers, change phone** (any answer), **create**.
- After question 10 you get a review list, then a demo result card in the chat: business-name registration, TPIN, or business profile. The card has Read aloud, Print / save PDF and Start again.

Voice: 🔊 (top bar) turns the spoken read-out on or off. 🎤 (chat box) starts hands-free mode: it listens, sends what you say, reads the reply, then listens again. Say "stop listening" to end it. Voice input needs the browser Speech Recognition API (Chrome on Android/desktop, including the installed PWA). It is generally not available in the Android APK WebView; typing, tapping and read-out still work there.

All numbers are random and not real. Nothing is sent anywhere. Chats are stored in this browser only.

## Important prototype limitations
- This is an independent prototype. It is not an official Government of Zambia website and is not endorsed by PACRA, ZRA or another agency.
- PACRA and ZRA functions provide preparation guidance only. There is no live government-system integration, name-availability check, application submission, TPIN issuance or approval.
- The Business Starter Pack creates planning guidance, not guaranteed financial outcomes.
- Conversation history is stored in the current browser/device using localStorage. It does not synchronise between devices. Clearing browser data can remove it. Private browsing or storage restrictions may prevent saving.

## Run locally
Open `index.html` in a browser for a basic preview. For service-worker/PWA behaviour, serve the folder over HTTPS or localhost.

## Publish with GitHub Pages
1. Create a GitHub repository named `govai`.
2. Extract this ZIP and upload the contents of this folder (not the outer ZIP folder) to the repository root.
3. Commit to the `main` branch.
4. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source.
5. The included `deploy.yml` workflow publishes the root website. After the workflow succeeds, open the Pages URL shown in repository Settings → Pages.

## Build an Android APK using GitHub Actions
1. Upload the project to a GitHub repository and push to `main`.
2. Open **Actions** and run **Build GOVAI Android APK**, or push a change to the repository.
3. Wait for the workflow to finish.
4. Open the completed workflow run and download the `GOVAI-debug-APK` artifact.
5. Extract the artifact and install the debug APK on an Android device. Android may ask you to allow installation from that source.

The workflow creates the Capacitor Android project during CI. You do not need to commit generated `android/` or `www/` folders.

## Build Android locally (optional)
Requires Node.js 22, Java 21, Android SDK and Gradle-compatible Android tooling:
```bash
npm install
mkdir -p www
cp index.html style.css app.js manifest.webmanifest sw.js www/
cp -r assets www/
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```
APK output: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Project files
- `index.html`, `style.css`, `app.js`: website interface and prototype logic
- `manifest.webmanifest`, `sw.js`: PWA metadata and offline cache
- `.github/workflows/deploy.yml`: GitHub Pages deployment
- `.github/workflows/build-apk.yml`: Android debug APK build
- `capacitor.config.json`, `package.json`: Capacitor configuration

## Production work still required
Before handling real public applications or personal information, add a secure backend, approved agency integrations, authentication and role-based access, data-protection impact assessment, privacy notice, consent flows, audit logs, encryption, backups, monitoring, rate limiting, incident response, accessibility testing and formal agency authorisation. Never put private API keys in browser JavaScript.
