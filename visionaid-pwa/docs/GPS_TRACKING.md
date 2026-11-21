# GPS Tracking

Open **GPS Tracking** in VisionAid to view a device position or run a simulated
route. GPS starts off on every visit. The page shows coordinates, estimated
accuracy in meters, the last successful update, and a readable tracking status.
The interactive map supplements the text details.

## Run locally

From `visionaid-pwa`, run `npm ci` and `npm run dev`. Use localhost on the
development computer. For a phone, deploy `npm run build` output to an HTTPS
origin with a SPA fallback. A regular HTTP address on the local network is
generally an insecure context for geolocation.

## How it works

- `src/data-sources/location.ts` defines the provider contract and keeps browser
  geolocation separate from the synthetic Monrovia demonstration route.
- `useGpsTracking` owns the session, validates fixes, expires real fixes after
  30 seconds, clears the watcher on stop or navigation, and ignores callbacks
  from stopped sessions.
- `GpsTrackingView` controls consent, mode selection, and textual status.
  `LocationMap` renders a Leaflet marker and the demo route.
- The browser provider asks for a first fix using `getCurrentPosition`, then
  uses `watchPosition`. It permits a five-second cached fix and uses a
  15-second acquisition timeout with high-accuracy mode off. The browser
  controls actual sampling frequency and may use network location or GPS.
- Demo Mode uses only generated points, advances every two seconds, and supports
  start, pause, and reset. Switching sources clears the previous reading.

A stale, stopped, or failed device session labels any retained fix historical
and removes its live marker. A pending browser permission prompt is controlled
by the browser. VisionAid can stop processing its eventual result.

## Privacy, offline behavior, and browser limits

The app keeps the latest reading in page memory. It does not write location
history to storage or send coordinates to a VisionAid server. Street tiles are
off by default. Opting in sends approximate viewport information and standard
network metadata to OpenStreetMap. The browser handles normal HTTP tile
caching. VisionAid provides attribution and does not precache or bulk download
street tiles. The offline app shell includes Leaflet and demo data, so text
and route overlays can work without street tiles. Offline device positioning
depends on the browser and device location capabilities.

Geolocation requires a secure context, browser permission, and enabled device
location. Browsers can suspend pages and location updates when minimized, put
in the background, or closed. Continuous background tracking would need an
appropriate native mobile implementation with explicit operating system
permissions and controls.

Caretaker sharing is off and its control is disabled. A future system needs
explicit start and stop consent, an authenticated user and caretaker, per-user
authorization, private endpoints, and a defined retention and deletion policy.
If Supabase is adopted, enforce these boundaries with row-level security.
Keep simulated samples out of any real location-sharing pipeline.

## Verification

Run `npm test` and `npm run build`. Tests cover permission handling, invalid
fixes, timeout, stale data, starting and stopping, watcher cleanup and demo
isolation alongside the existing telemetry tests.

On Android, open the HTTPS deployment in Chrome, enable device location, and
choose **GPS Tracking → Start Tracking**. Allow the browser prompt and confirm
a marker, accuracy, and timestamp. Move outdoors and verify a new fix, then
stop and confirm the historical label. Revoke the site permission and repeat
the request to check the denied message. With TalkBack enabled, check the source
selector, status announcements, controls, and coordinate details. After the app
has opened online, disconnect and reopen the GPS route, then run Demo Mode.

The local Chrome production check used emulated coordinates to verify the
browser geolocation flow, marker updates, stopping, and keyboard access at
390 px. It also checked the desktop sidebar, an offline GPS deep link, Demo
Mode overlays, and navigation to Monitoring. Physical Android location
acquisition and TalkBack remain to be verified on the presentation device.
