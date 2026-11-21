VisionAid — Senior Engineering Execution Guide
Project: VisionAid — Seeing Beyond Sight
Document type: Technical delivery plan + developer runbook
Version: 1.0
Prepared: 21 November 2026
Pitch deadline: Friday, 27 November 2026
Status: Planned — implementation and hardware integration not yet verified
Primary software owner: PWA developer
Audience: Software developer, hardware team, project lead, testers, pitching team

0. Executive decision
Deliver an accessible, installable, mobile-first VisionAid PWA with a convincing, explicitly labeled live simulation by 26 November. On 27 November, demonstrate that stable build. Pursue real Bluetooth telemetry only after the hardware team provides a compatible BLE-capable device, a documented GATT protocol, and test access. Do not let hardware uncertainty block the software demo.
Definition of success for the 27 November pitch
- [ ] A public HTTPS URL works on the selected presentation phone and laptop.
- [ ] An accessible, responsive Vue dashboard shows front / left / right readings.
- [ ] Demo Mode is conspicuously labeled on every telemetry screen.
- [ ] Obstacles, disconnected states, invalid readings, and stale data are visibly distinguishable.
- [ ] Simulated measurements update without relying on physical hardware.
- [ ] App can be installed where the test browser/device supports PWA installation.
- [ ] A tested offline app shell opens after its initial online load; it never claims offline cloud monitoring.
- [ ] A Bluetooth connection screen exists with honest unsupported/unavailable/error states.
- [ ] At least one end-to-end demo scenario can be repeated reliably during the pitch.
- [ ] The team can clearly explain what is working, simulated, hardware-dependent, and future scope.
Stretch goal only: Receive real front/left/right readings over a verified Web Bluetooth GATT connection. Do not present this as complete unless validated on the presentation device.
Non-negotiable safety boundary
VisionAid is a demonstration prototype. A web page is not a safety-critical obstacle warning controller. Immediate audible/tactile warning must remain on the standalone hardware; browsers may suspend PWA execution, Bluetooth may disconnect, sensors may fail, and speech synthesis may be unreliable in the background. This prototype must not be advertised or used as a proven mobility safety device without supervised testing and appropriate validation. The PWA must never display “path clear” merely because telemetry is absent.
1. Source of truth, scope, and ownership
Product basis
Based on the shared Canva pitch deck, VisionAid is an affordable, attachable smart-cane concept for visually impaired people in Liberia. The deck discusses a three-direction obstacle detection prototype, potential caretaker PWA connectivity, affordable local repairability, and future enhancements. The Arduino code provided has three ultrasonic sensors, a button, a buzzer and red/green LEDs.

Naming: Use VisionAid (as written in the pitch deck) in the UI and repository. Confirm with the team whether the public-facing name should instead be “Version Aid”; do not silently publish two names.

Canonical references:
- Project deck: https://www.canva.com/design/DAGiAebUT7c/BRPep904OZ4caC6oABQ5rg/edit
- Arduino source: the sketch provided by the hardware team in the project chat; request a versioned copy in the repository.
Responsibility matrix
Workstream	Primary owner	PWA developer's responsibility	Dependency
Ultrasonic sensors, wiring, buzzer, power	Hardware team	Understand behavior; document software assumptions	Verified hardware demo
Arduino firmware	Hardware team, with coordination	Define data contract and help test parsing; edit only if expressly agreed	Firmware access
Vue application	PWA developer	Build, test, document, deploy	None: simulator first
PWA installation and offline shell	PWA developer	Manifest, service worker, installation tests	HTTPS hosting + icons
BLE device integration	PWA developer	Browser support detection, GATT connection, parsing, error handling	BLE-capable peripheral + UUIDs
Caretaker backend and accounts	Later / team decision	Technical design only for pitch	Product/privacy decisions
Pitch demo and claims	Project lead + developer	Stable URL, script, screenshots, honest feature states	Team coordination


Scope control: MVP / stretch / out of scope
Priority	Feature	Delivery rule
P0	Welcome, dashboard, monitoring, device connection, accessibility settings	Ship as a coherent interactive frontend
P0	Simulator with reproducible scenarios	Must work without Arduino or internet after app-shell caching
P0	Responsive accessibility, install/offline states, HTTPS deployment	Test on target phone
P1	Real BLE telemetry	Build only when GATT specification and test device are supplied
P1	Basic local event history	Optional; store on-device only if useful and clearly labeled
P2	Caretaker accounts and cloud sync	After pitch unless core features are already stable
P2	Push notifications	Requires separate permission, infrastructure, support testing
OUT	GPS location, emergency dispatch, automatic fall detection, continuous background monitoring	Not supported by the current code/specification
OUT	“Guaranteed obstacle avoidance” or medical/safety certification claims	Cannot be claimed


2. Architecture and engineering principles
Proposed stack
Layer	Choice	Reason
Frontend	Vue 3 + TypeScript + Vite	Familiar, fast, readable, typed data boundaries
Styling	Tailwind CSS or scoped CSS	Choose one; do not spend deadline time overengineering a design system
Routes	Vue Router	Mobile navigation and direct URLs
State	Pinia	Centralized device and connection state
PWA	vite-plugin-pwa	Manifest and service worker integration
Tests	Vitest + Vue Test Utils; Playwright when feasible	Logic, component, and user-flow checks
Device integration	Browser Web Bluetooth when compatible	Direct BLE GATT, not generic Bluetooth Classic serial
Hosting	Netlify or equivalent HTTPS static host	Public pitch URL, deploy preview, SSL
Backend	Not required for pitch MVP	Avoid unnecessary complexity and privacy risk


Logical system diagram
            THREE ULTRASONIC SENSORS
               Front / Left / Right
                       |
                       v
              ARDUINO / FIRMWARE
                  /          \
                 v            v
       Local buzzer/LED    Optional BLE peripheral
      (works on its own)       |
                               | GATT characteristic notifications
                               v
                 +-----------------------------+
                 | VISIONAID WEB APP           |
                 | Data source adapter         |
                 |  - Simulator (guaranteed)   |
                 |  - BLE (conditional)        |
                 | Validation + freshness      |
                 | State management            |
                 | Accessible visual dashboard |
                 +-----------------------------+
                               |
                       Optional future API
                               v
                  Caretaker platform / DB
                  (separate later milestone)
Engineering design rules
1. Build simulator-first. Every UI screen consumes one normalized device-state model, regardless of the data source.
2. Use an adapter boundary. UI components never call navigator.bluetooth directly.
3. No false safety assurance. Missing, invalid, stale, or disconnected data means unknown / not reporting, never “safe.”
4. No invented telemetry. Hardware battery level, GPS and cloud status are hidden or explicitly labeled unsupported until delivered.
5. Accessibility is functional. Screen reader labels, readable contrast, keyboard access and explicit text status are required, not optional polish.
6. No background dependency. The PWA must not promise continuous live monitoring while closed or suspended.
7. Prefer boring reliability. No new backend, auth, animations, or subscriptions until the pitch acceptance criteria pass.
8. Ship by evidence. A task is done only after a reproducible test and a committed change.
3. Contracts: what data the PWA needs
3.1 Canonical frontend type
The values below describe the PWA's internal model. They are not a claim that the existing Arduino transmits JSON or supports BLE.
export type SensorDirection = 'front' | 'left' | 'right'
export type ConnectionStatus =
  | 'demo'
  | 'unsupported'
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'

export interface SensorReading {
  direction: SensorDirection
  distanceCm: number | null // null = missing/invalid; never convert to zero
  status: 'valid' | 'invalid' | 'stale'
}

export interface DeviceSnapshot {
  source: 'simulator' | 'bluetooth'
  connectionStatus: ConnectionStatus
  readings: Record<SensorDirection, SensorReading>
  receivedAt: number // Date.now() when app receives the sample
  deviceId?: string
  batteryPercent?: number // only if real hardware supplies it
}
3.2 Demo payload example
{
  "source": "simulator",
  "connectionStatus": "demo",
  "readings": {
    "front": { "direction": "front", "distanceCm": 85, "status": "valid" },
    "left":  { "direction": "left",  "distanceCm": 42, "status": "valid" },
    "right": { "direction": "right", "distanceCm": 120, "status": "valid" }
  },
  "receivedAt": 1795250000000
}
The example timestamp is illustrative; runtime code must generate timestamps using Date.now(), not a fixed value.
3.3 Parsing and alert policy
- Sensor measurements are expressed in centimeters.
- The existing Arduino code uses 50 cm as the alarm threshold; configure this as a named value in the UI, but treat the firmware's physical buzzer rules as the hardware source of truth.
- distanceCm === null, non-finite numbers, negative distances and out-of-range sensor values are invalid, not “clear.”
- Determine what distance range is realistic from the actual installed sensor model; do not invent a universal upper bound.
- If valid, fresh data from any direction is below 50 cm, show an obstacle alert with direction(s).
- If all three values are valid, fresh, and at/above 50 cm, show no obstacle detected in the current sensor readings (not “safe to walk”).
- If data is missing, partly invalid, or stale and no valid reading is below threshold, show readings incomplete / status unknown.
- Set an initial stale threshold of 3 seconds as an app-level demonstration assumption; confirm actual send interval with hardware team and adjust. It is not a sensor safety guarantee.
- Announce state transitions using a rate limit; do not speak or re-alert on every 200 ms reading.
- Allow user-controlled speech testing; do not rely on speech synthesis as the only alert path.
3.4 Device integration handshake — hardware team must answer
- [ ] Exact board model (Arduino Mega 2560? ESP32? other?)
- [ ] Bluetooth module exact part number and firmware; does it expose BLE GATT?
- [ ] Service UUID and notify characteristic UUID, if BLE
- [ ] Encoding of a telemetry packet: UTF-8 JSON, delimited text, binary struct, etc.
- [ ] Units, measurement range, timing/frequency, no-echo/failure representation
- [ ] Device advertisement name; pairing or authorization method
- [ ] Whether multiple sensor samples arrive together or separately
- [ ] Expected disconnect behavior and reconnect steps
- [ ] Availability of a real test unit before 25 November
- [ ] Which Android phone/browser will be used at the pitch
Critical compatibility note: An ordinary Arduino Mega does not include BLE. HC-05/HC-06-style Bluetooth Classic serial is not the same as Web Bluetooth GATT. No GATT UUID means no truthful working Web Bluetooth integration. If the peripheral is Classic-only, either use an added compatible BLE bridge/module (hardware decision), a separately built native bridge, or demonstrate simulator mode. Do not promise a browser connection to incompatible hardware.

Recommended data packet proposal (hardware must approve)
{"seq":17,"front_cm":85,"left_cm":42,"right_cm":120,"sensor_ok":true}
Protocol recommendation, not existing behavior. Specify whether null indicates missing echo, whether sequence increments, and whether partial sensor errors are represented separately. UUIDs must be provided by hardware, never fabricated in implementation.
4. Project bootstrap (Ubuntu + VS Code)
Preconditions
- Ubuntu with terminal and VS Code.
- Node.js 20.19+ or 22.12+ meets the current Vite 8 minimum requirement (check exact node -v; the user's previously observed v20.20.2 satisfies that minimum).
- npm available, Git configured, network for initial packages.
- Target Chrome/Chromium-based Android device for BLE testing; verify capability on the actual device and browser.
Commands — run in order
# 1. Verify prerequisites
node -v
npm -v
git --version

# 2. Scaffold the Vue + TypeScript project
npm create vite@latest visionaid-pwa -- --template vue-ts
cd visionaid-pwa
npm install

# 3. Add core app dependencies
npm install vue-router pinia
npm install -D vite-plugin-pwa vitest @vue/test-utils jsdom

# 4. Initialize source control (if not already initialized)
git init
git add .
git commit -m "chore: initialize VisionAid Vue PWA"

# 5. Start local development
npm run dev
Choose a single CSS approach. If the Google Stitch output is mostly plain CSS, port it into scoped Vue styles instead of introducing Tailwind on day one. If using Tailwind, follow the current official Vite integration guide for the installed major version; do not mix outdated Tailwind v3 configuration with newer instructions.

Immediate project scripts
Configure package.json scripts to include the existing dev, build, and preview, plus (after testing dependencies are installed):
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
Ensure vue-tsc is present in the scaffold before using this build script. Keep scaffolded scripts if already correct; do not remove useful existing ones.
Target folder structure
visionaid-pwa/
├── public/
│   ├── icons/                     # actual 192 / 512 / maskable app icons
│   └── favicon.svg
├── src/
│   ├── app/                       # router, app initialization
│   ├── assets/
│   ├── components/
│   │   ├── AppShell.vue
│   │   ├── ConnectionBadge.vue
│   │   ├── SensorCard.vue
│   │   ├── ObstacleAlert.vue
│   │   └── SourceBadge.vue
│   ├── views/
│   │   ├── WelcomeView.vue
│   │   ├── DashboardView.vue
│   │   ├── MonitoringView.vue
│   │   ├── DeviceView.vue
│   │   └── SettingsView.vue
│   ├── domain/
│   │   ├── device.ts
│   │   ├── validateReading.ts
│   │   └── evaluateObstacle.ts
│   ├── data-sources/
│   │   ├── types.ts
│   │   ├── simulator.ts
│   │   └── bluetooth.ts           # stub until BLE contract confirmed
│   ├── stores/
│   │   └── device.ts
│   ├── composables/
│   │   └── useAnnouncements.ts
│   ├── styles/
│   │   └── tokens.css
│   ├── App.vue
│   └── main.ts
├── tests/
│   ├── evaluateObstacle.test.ts
│   └── device-store.test.ts
├── docs/
│   ├── HARDWARE_PROTOCOL.md
│   ├── TEST_PLAN.md
│   ├── PITCH_DEMO.md
│   └── DECISIONS.md
├── .env.example                    # never commit secrets
├── vite.config.ts
└── README.md
Keep folders small; do not create an empty enterprise folder tree merely for appearances. Create modules when their first implementation is added.
5. Implement the UI as a real application, not screenshots
Required routes
Route	Purpose	Minimum behavior
/	Welcome	Explains prototype and navigation
/dashboard	Home / overview	Three readings, source badge, latest status, obstacle banner
/monitor	Live monitoring	Updating simulator readings, last update time, stale/invalid handling
/device	Connection	Connect action, supported browser detection, errors, disconnect
/settings	Accessibility	Larger text, high contrast, voice test, clear labels


Component specification
- AppShell — semantic main landmark, skip-to-content, responsive bottom tabs / sidebar, visible active route, never icon-only navigation.
- SensorCard — direction, numeric value (or —), cm unit, freshness, accessible name, readable at 200% zoom.
- SourceBadge — always show “DEMO — SIMULATED DATA” or “LIVE DEVICE”; never show green Connected for simulated data.
- ObstacleAlert — warning, unknown, or no-obstacle-detected text, not color alone; announce only important transitions.
- ConnectionBadge — unsupported, disconnected, connecting, connected, error (and demo, as separate source label).
- SimulatorControls — developer/demo controls to choose the scenario; can be in a clear demo panel.
Five deterministic pitch scenarios
1. Normal readings: 85 / 95 / 120 cm → “No obstacle detected in current readings.”
2. Left obstruction: 85 / 35 / 120 cm → “Obstacle detected: left, 35 cm.”
3. Front obstruction: 25 / 90 / 100 cm → “Obstacle detected: front, 25 cm.”
4. Sensor failure: front missing/invalid → “Sensor reading unavailable; status unknown.”
5. Disconnected or stale source: last update older than configured threshold → “Data not updating.”
For a polished pitch, allow the presenter to select each scenario without awkward timing. Do not have the page silently alternate between “live” and “simulated.”
6. PWA implementation requirements
Required mechanics
1. Configure vite-plugin-pwa in vite.config.ts.
2. Add a manifest with name, short_name, start_url, display: standalone, theme_color, background_color, and valid icons.
3. Include correctly sized, real PNG app icons (192×192 and 512×512; include suitable maskable artwork).
4. Precache the app shell. Prefer conservative caching for static build assets.
5. Do not persist or cache fabricated “live” API responses or pretend an old sample is current.
6. Implement an update-available prompt; avoid silently replacing the active application during a demo or monitoring session.
7. Test installability on the actual device and an HTTPS deployment. A desktop browser not displaying an install button does not necessarily prove the PWA is broken.
8. Show offline state and last known sample age clearly. Browser offline status and device BLE status are separate concepts.
Illustrative Vite PWA configuration
Use this only after installing the plugin and creating the referenced icon files:
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'VisionAid — Seeing Beyond Sight',
        short_name: 'VisionAid',
        description: 'VisionAid smart cane companion — demonstration prototype',
        theme_color: '#0F172A',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
Verification: npm run build && npm run preview and test the production preview; dev-server behavior alone does not prove offline service-worker behavior. Deployment must serve manifest.webmanifest with a compatible content type and use HTTPS.
7. Device data-source abstraction and BLE integration
Recommended adapter contract
import type { DeviceSnapshot } from '../domain/device'

export interface DeviceDataSource {
  readonly kind: 'simulator' | 'bluetooth'
  connect(): Promise<void>
  disconnect(): Promise<void>
  subscribe(onSnapshot: (snapshot: DeviceSnapshot) => void): () => void
}
Design: The simulator produces normalized DeviceSnapshot values. The BLE source decodes the hardware bytes and produces the same type. Components do not care where readings came from. Always unsubscribe and clear resources on teardown.
BLE implementation gate
Begin real BLE work only when all conditions below hold:
- [ ] Confirm the peripheral is BLE GATT capable (not merely HC-05 Classic serial).
- [ ] Test in a supported browser on the target phone.
- [ ] Obtain the precise service / characteristic UUIDs and binary/text packet contract.
- [ ] Confirm user gesture can initiate browser chooser (requestDevice).
- [ ] Confirm measurements arrive in characteristic notifications or a documented read flow.
- [ ] Agree how invalid measurement, disconnect and timing are represented.
BLE state machine
unsupported -------> show browser/platform limitation

disconnected --> connecting --> connected --> receiving readings
       ^              |              |
       |              v              v
       +------------- error <--- disconnected event
Implementation requirements:
- Detect navigator.bluetooth before offering the connect button.
- Invoke requestDevice() directly from a user gesture in a secure context; use appropriate filters and optionalServices with the real UUIDs.
- Request permission; never attempt invisible forced pairing.
- Connect to GATT service and subscribe to the documented telemetry characteristic.
- Decode bytes carefully, validate ranges, preserve source identity, and timestamp reception.
- On gattserverdisconnected, mark the data unavailable/stale and notify the user.
- Cleanly detach event listeners and handle permission cancellations without alarming errors.
- Do not store identifiers or readings in cloud storage without an actual user need and consent.
- No false promise of BLE reading or voice alerts while the browser/PWA is closed.
Fallback: If BLE hardware is not ready, keep the Connect button in a clearly labeled “hardware integration pending” state; demonstrate simulator mode. USB serial from a laptop is a potential separate diagnostic tool, not a transparent replacement for mobile Web Bluetooth.
8. Accessibility design and test obligations
Design target: WCAG 2.2 AA where applicable, with additional usability tests for visually impaired users. Passing automated tests alone does not establish accessibility or safe navigation.
Minimum accessible behaviors
- [ ] Every page has a clear heading and main landmark.
- [ ] Keyboard navigation covers all controls, with visible focus indicator.
- [ ] All buttons have clear visible text or explicit accessible names.
- [ ] Text scales to 200% without losing critical functions or requiring horizontal scrolling in ordinary content.
- [ ] Contrast meets at least 4.5:1 for normal-size text (exceptions apply per WCAG).
- [ ] Sensor state is expressed in words; never rely only on red/green.
- [ ] Tap targets are comfortably large (target 44–48 CSS px where practical; follow WCAG minimum criteria).
- [ ] aria-live announcements are reserved for meaningful state transitions; do not announce every high-frequency sensor sample.
- [ ] Voice output is user-invoked and optional; it cannot replace hardware buzzer/vibration.
- [ ] Test on Android TalkBack and with keyboard navigation.
- [ ] Support reduced motion, and avoid flashing or unnecessary motion.
- [ ] Installation and Bluetooth permission instructions are readable using assistive technology.
Suggested alert announcement policy
Announce once when switching from no obstacle to obstacle, or when dominant direction materially changes. Coalesce repeated measurements; give priority to a currently closer object. Provide a Test Voice button that demonstrates speech independently of actual BLE connectivity. If speechSynthesis is unavailable, show a visible explanation rather than claiming success.
9. Quality gates and test plan
Unit tests (Vitest)
Test ID	Input / action	Required outcome
U-01	Front=25, others valid 85/90	Obstacle alert: front
U-02	Left=35, others 85/90	Obstacle alert: left
U-03	All values 80+ and valid/fresh	No obstacle detected in current readings
U-04	null, negative, NaN, or timed-out sample	Status unknown / error; not a safe state
U-05	Sample age > staleness threshold	Stale badge, no current-reading claim
U-06	Sensor reading changes direction rapidly	Announcement rate limit prevents repetitive speech
U-07	Switch source simulator → BLE pending	No simulated reading mislabeled as live


Component / integration tests
Test ID	Action	Required outcome
C-01	Open dashboard	All three sensor cards and source banner appear
C-02	Change simulator scenario	Alert text, distances, and timestamps update
C-03	No Web Bluetooth support	Helpful unsupported message, no broken button
C-04	Simulate disconnection	Connection state and freshness update accurately
C-05	Navigate using only keyboard	All primary views and controls operable
C-06	Enable large text/high contrast	UI remains usable and preferences are applied


Pitch-day manual checks
- [ ] Android phone is the one tested; note exact browser/version.
- [ ] Portrait width ~360–430 px and desktop view both work.
- [ ] User can load the deployed HTTPS URL and navigate.
- [ ] Simulator scenarios 1–5 work in sequence.
- [ ] Offline shell opens after a complete online preload; the UI clearly states offline limitations.
- [ ] App installation tested where supported; fallback shortcut instructions are ready.
- [ ] Page reload and deep-link routes return the app (configure SPA fallback on host if required).
- [ ] No JavaScript runtime errors or unresolved failed builds.
- [ ] TalkBack labels and button order are verified.
- [ ] A backup local recording or screenshots exist if network or hardware fails.
Definition of done for every engineering task
A feature is done only when:
1. It meets the written acceptance behavior.
2. It passes npm run build and relevant tests.
3. Empty/loading/error/disconnected states are handled.
4. It works on a small phone viewport.
5. There are no misleading “live” or “safe” claims.
6. It is committed with an explanatory message.
7. The README or decision log is updated when functionality or assumptions change.
10. Day-by-day delivery plan — November 21–27
Time horizon: Six calendar days of implementation (21–26 November) plus pitch on 27 November 2026. This is an aggressive schedule; only P0 scope is committed.
Date	Main goal	Evidence / exit gate	Decision
Sat 21 Nov	Repo setup, UI route skeleton, simulator data type, hardware questions	Project builds; 5 routes exist; team receives BLE checklist	Freeze P0 feature list
Sun 22 Nov	Dashboard cards, navigation, warning states	All 5 simulator scenarios render correctly	No backend scope
Mon 23 Nov	Device connection screen, responsive UI, accessible forms	Unsupported/pending states work; keyboard pass	Confirm phone/browser
Tue 24 Nov	PWA manifest, icons, offline shell, deployment	HTTPS URL, manifest, offline test, mobile install check	Start BLE only if hardware ready
Wed 25 Nov	Polish, unit tests, accessibility, optional BLE smoke test	Build + tests pass; 5 scenarios and TalkBack checked	Cut unverified hardware features
Thu 26 Nov	Full rehearsal, bug fixes only, release lock	Deployed stable tag, demo script, backup evidence	Feature freeze
Fri 27 Nov	Pitch demonstration	Stable build and honest capability labels	No risky last-minute changes


Daily execution rhythm (suggested)
1. Start with one 10-minute written plan: no more than three deliverables.
2. Implement one vertical slice (data → state → view → test).
3. Run build and relevant tests; commit working state.
4. Record blockers and requests to hardware team.
5. End with a working deploy or a repeatable localhost demo.
Triage when time is short
Cut in this order: fancy charts → complex animations → optional history → caretaker page → cloud backend → real BLE (if hardware blocked). Never cut accurate source labels, basic error handling, main dashboard, or accessible primary navigation.
11. Hardware team coordination message
Copy and send:
Hi team, I'm implementing the VisionAid mobile PWA for the 27 November pitch. To connect real sensor data, please confirm by 24 November: (1) exact board and Bluetooth module, (2) whether Bluetooth is BLE GATT or Classic, (3) service and telemetry characteristic UUIDs if BLE, (4) an example transmitted packet with units and fault behavior, (5) expected update interval, and (6) when a test device will be available. Meanwhile I'll prepare an explicitly labeled simulator so our software demo remains reliable. The hardware must keep its own obstacle alerts operational independently of the PWA.

If the answers do not arrive, proceed with the simulation. Do not allow code generation tools to invent UUIDs.
12. Release, Git, and deployment rules
Branches and commits
- main: working release; don't leave broken code there.
- Short-lived working branches are optional for a solo developer; regular commits are mandatory.
- Commit messages: feat: add sensor cards, fix: handle stale readings, test: cover invalid telemetry, docs: record BLE blockers.
- Add docs/DECISIONS.md with date, decision, reason, and impact. Preserve a copy of the pitch build.
Deployment
1. npm run test.
2. npm run build.
3. npm run preview and verify the production build locally.
4. Deploy the built dist/ to Netlify (or equivalent); enable HTTPS and SPA route fallback where needed.
5. Test on the same Android phone intended for pitch, using the deployed origin.
6. Verify source badge, offline scope, installation path, and simulated alerts.
7. Tag the final tested commit, e.g. pitch-2026-11-27.
Do not: deploy secrets to the browser, claim caretaker notification delivery without infrastructure, or auto-switch Demo Mode into Live Mode on reconnect.
13. Risks, decisions, and contingency table
Risk	Likelihood	Impact	Mitigation / fallback
BLE module is Classic-only	Unknown	High	Simulator; hardware supplies BLE-capable peripheral later
Web Bluetooth unsupported on pitch browser	Medium	High	Test target Android browser early; retain demo mode
Hardware not ready before 25 Nov	High/unknown	High	No critical-path dependency; fake only in labeled demo mode
Intermittent internet or hosting	Medium	Medium	Tested offline shell, preloaded devices, backup recording
Unreliable ultrasonic readings or timeouts	Unknown	High	Validate and mark unknown; hardware retains local warning system
PWA background limitations	High	High	Never promise continuous background safety alerts
Accessibility regressions from Stitch UI	Medium	High	Semantic components, zoom/TalkBack/keyboard checklist
Scope creep into auth, maps, subscriptions	High	High	P0 gate + feature freeze on 26 Nov
Laptop resources or slow network	Medium	Medium	Keep stack lean, avoid Docker/backend until needed


14. Pitch demo script (3–4 minutes)
0:00–0:25 — Problem and solution. “VisionAid explores an affordable cane attachment for visually impaired users in Liberia. The hardware can detect nearby objects, and this PWA provides companion monitoring.”

0:25–0:50 — Clarify prototype status. Show the app's Demo — Simulated Data banner and explain that the hardware produces its own alert independent of the app.

0:50–1:50 — Live walkthrough. Open dashboard and switch between normal, left, front, sensor-error, and stale/disconnected scenarios. Read the explicit direction and distance.

1:50–2:30 — Accessibility and app delivery. Show high contrast / larger text, navigation, screen reader-friendly status text, and install/offline support if already tested.

2:30–3:10 — Technical architecture. Explain the three sensors → Arduino → BLE (planned/conditional) → PWA diagram. If live BLE is genuinely connected, demonstrate it and explicitly distinguish from simulator mode.

3:10–4:00 — Next milestone. Explain hardware integration, supervised field testing, privacy-first caretaker features and locally maintainable design. Never overstate validated safety capabilities.
Backup plan
If the live demonstration fails: show screenshots or a short pre-recorded walkthrough of the same tested application build. Clearly identify the recording as a recording, not live data. Provide the stable URL afterward.
15. Instructions for Codex or another coding assistant
Use AI as a pair programmer, not as a source of fabricated functionality. The assistant must inspect the repository before altering it; explain work in beginner-friendly terms; modify only a small vertical slice; run verification; and report exactly what passed and what is blocked.
Initial prompt — paste into Codex at the repository root
You are the senior frontend/PWA engineer helping me build VisionAid,
a Vue 3 + TypeScript Progressive Web App for a smart-cane prototype.

Please read VisionAid_Senior_Engineering_Execution_Guide.md fully
and inspect the existing repo before changing files.

Hard constraints:
- Pitch date: November 27, 2026.
- I own coding only; the hardware team owns assembly and firmware.
- Do not invent BLE UUIDs, hardware capabilities, or real sensor data.
- Never label simulated readings as live or connected.
- The hardware must handle its local obstacle alert independently.
- Never present invalid/stale/missing readings as safe.
- No backend, auth, GPS, caretaker sync, or push in phase one.
- Target mobile-first, semantic accessible Vue components.
- Teach me the logic behind each implementation, briefly.

First task ONLY:
1. Review current project structure and package versions.
2. Create/verify Vue Router routes for welcome, dashboard,
   monitor, device, and settings.
3. Define the typed device model and a deterministic simulator
   with five scenarios specified in the guide.
4. Build one accessible SensorCard and SourceBadge component.
5. Add unit tests for the pure obstacle evaluation function,
   especially invalid and stale cases.
6. Run tests and build, fix failures, and summarize exact results.
7. List the next small task, but do not implement it yet.

Before creating/rewriting files, explain what exists and avoid
removing working code or overwriting my design assets.
Second-task prompt (after first task is verified)
Continue VisionAid from the guide. Build a cohesive mobile-first
DashboardView and MonitoringView using the existing simulator,
SensorCard, SourceBadge, and validated obstacle evaluator.
Include clear demo data labels, stale/error states, keyboard/reader
accessibility, responsive layouts, and scenario switching. Add tests.
Do not implement Bluetooth or backend until the hardware spec is ready.
Run build/tests and explain what I should understand from the code.
Third-task prompt (PWA)
Make the existing VisionAid Vue app installable and offline-capable.
Use vite-plugin-pwa according to its current documented API.
Check app icons, manifest fields, update flow, HTTPS deployment needs,
production preview, and realistic offline states. Do NOT cache
simulated readings as live or imply BLE background connectivity.
Provide actual verification evidence, not an installation claim
based solely on config files.
Suggested learning checkpoints
Before merging each feature, be able to explain: (a) where data originates, (b) how state changes, (c) how the UI renders, (d) what happens when data is wrong, (e) how the feature is tested. If you cannot explain these, ask the assistant to demonstrate with the smallest relevant code example.
16. External technical references (reviewed 21 November 2026)
- Vite official guide — https://vite.dev/guide/
- Vite releases / requirements — https://vite.dev/releases
- Vite PWA Vue guide — https://vite-pwa-org.netlify.app/frameworks/vue
- Vite PWA production deployment — https://vite-pwa-org.netlify.app/deployment/
- MDN Web Bluetooth API — https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
- MDN requestDevice requirements — https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice
- W3C WCAG 2.2 understanding — https://www.w3.org/WAI/WCAG22/Understanding/
- W3C WCAG 2.2 target size explanation — https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
Check docs against the actual installed package versions. Software and browser capabilities evolve. If a requirement is uncertain, test it on the target environment and update this guide rather than guessing.

17. Daily project log (fill in while executing)
### YYYY-MM-DD
- Goal:
- Completed (with tests / screenshots):
- Commit:
- Demo URL / verification environment:
- Blockers:
- Questions for hardware team:
- Decision / cut-scope:
- Next task:
Final engineering instruction
A reliable, accessible, honestly labeled simulator with a working PWA deployment is a better 27 November deliverable than an attractive dashboard pretending to read hardware. Build that foundation first, integrate genuine BLE only with a verified protocol, and treat supervised user safety testing as a separate future project stage.