# VisionAid

VisionAid is a smart-cane companion prototype. Dashboard and Monitoring show the
same three-direction simulation, with a scenario picker, pause and resume
controls, and the last sample time and age. Device and Settings are route
placeholders.

Use Node.js 20.19+ or 22.12+ for Vite 8. From this directory, run `npm ci` and
`npm run dev`. Run `npm test` for policy and component tests, and
`npm run build` for type checking and a production bundle.

## Run the demo

1. Open Dashboard or Monitoring. Confirm the **DEMO — SIMULATED DATA** label.
2. Select Normal readings, Left obstruction, Front obstruction, Sensor failure,
   and Stale data. The status banner updates immediately.
3. Return to Normal readings. Pause playback and wait for the sample to expire,
   then resume to get a new sample.

The simulator publishes one sample per second for the selected scenario. Stale
data holds a deliberately expired sample. Pausing lets the last sample age.
The evaluator flags fresh, valid measurements below 50 cm and treats incomplete,
stale, or unavailable data as unknown when it has no fresh obstacle to report.
The status banner announces changes after a brief delay and coalesces rapid
scenario changes.

The hardware handles immediate obstacle warnings independently. Sensor limits
and Bluetooth integration depend on the hardware specification.

## Install and verify offline

1. Run `npm run build`, then `npm run preview`. Open the localhost URL in
   Chrome and wait for **VisionAid is ready to open offline**.
2. Use the browser's install action when available. The Welcome page includes
   instructions for finding it.
3. In Chrome DevTools, use **Application → Service Workers → Offline**. Reload
   `/monitor` on the same origin and confirm the offline banner, demo label,
   and working scenario picker. Uncheck **Offline** to go online again.
4. On a new build, open the app while online and wait for **A VisionAid update
   is ready**. Choose **Update and reload** when ready to restart the simulator.

For an HTTPS static host, publish `dist/` at the origin root and serve the
manifest and service worker with their appropriate content types. Netlify's
history fallback is included in `public/_redirects`. On another host, configure
an equivalent fallback for app routes. Check installation on the presentation
phone using the deployed URL.

The service worker precaches the static app shell and icons. The demo generates
samples on the current device, including offline.

Local production verification covered Chrome's installability check, an offline
reload of Monitoring with a working scenario picker, and a waiting service
worker that activated and reloaded only after the update button was pressed.

## GPS Tracking

Use **GPS Tracking** for foreground device location or a clearly labeled
simulated route. See [GPS Tracking setup, privacy, and Android checks](docs/GPS_TRACKING.md).
