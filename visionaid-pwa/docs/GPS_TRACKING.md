# GPS Tracking

Open **GPS Tracking** in VisionAid to display device location or run a clearly
labeled simulated route. Tracking starts off on every visit. The text panel
provides latitude, longitude, estimated accuracy in meters, and the last
successful update. Enable **Load Google Maps** to view Google's street or
satellite map with an Advanced Marker and an estimated accuracy circle.

## Configure Google Maps

1. In [Google Cloud Console](https://console.cloud.google.com/), select a project
   and link a billing account. Enable the **Maps JavaScript API** for that project.
2. Under Google Maps Platform **Map Management**, create a **JavaScript** map ID.
   Use the ID from that project for Advanced Markers. Google’s `DEMO_MAP_ID`
   is for map setup testing. The GPS page’s Demo Mode selector controls whether
   positions come from the browser or the simulation.
3. Under **Credentials**, create a browser API key. Set its application
   restriction to **Websites** and its API restriction to **Maps JavaScript API**.
   Authorize the exact origins that should run the app, such as
   `https://YOUR-SITE.netlify.app`, your production custom domain, and
   `http://localhost:5173` on your development key. Add
   `http://localhost:4173` to your development key to test production preview.
   This app requests origin-only referrers. Configure allowed referrers at the
   origin level, without restricting them to an individual app path.
4. Copy `.env.example` to `.env.local` in `visionaid-pwa`. Set the two values
   below and restart Vite. Run `npm ci` then `npm run dev`, or run
   `npm run build` and `npm run preview` to test the built app.

```dotenv
VITE_GOOGLE_MAPS_API_KEY=your_restricted_browser_key
VITE_GOOGLE_MAPS_MAP_ID=your_javascript_map_id
```

Vite embeds browser variables in its built JavaScript. Browser keys and map IDs
are visible to visitors. Keep actual environment files out of Git and restrict
keys in Google Cloud. Use separate keys for development and production, set
usage quotas where available, and configure billing budgets and alerts. Budget
alerts notify you about spending. Use quotas to limit supported API usage.

[Google Maps setup and Advanced Markers](https://developers.google.com/maps/documentation/javascript/advanced-markers/start)
· [Google key restrictions](https://developers.google.com/maps/api-security-best-practices)

## Deploy through GitHub and Netlify

In the linked Netlify project, open **Project configuration → Environment
variables** and add both variables to the **Builds** scope for production.
Authorize the deployed HTTPS origin in the browser key's website restrictions.
If deploy previews need a working map, use a separately restricted key for
their intended origins. Push the code to the production branch and trigger a
new build after changing the environment variables. The root `netlify.toml`
builds from `visionaid-pwa` and publishes `dist`.

[Netlify environment variables](https://docs.netlify.com/build/environment-variables/get-started/)

## Tracking, privacy, and offline behavior

- VisionAid uses `getCurrentPosition` and `watchPosition` after **Start Tracking**.
  The browser controls location sources and sampling frequency. VisionAid requests
  fresh high-accuracy fixes. The reported accuracy in meters is an estimate. Tracking
  requires permission, device location services, and HTTPS or localhost.
- VisionAid clears the watcher on stop or navigation and marks real readings
  stale after 30 seconds. The latest successful fix stays in page memory and
  is labeled historical when tracking stops or the fix expires. The live
  marker and accuracy circle are removed. Reloading starts a new session.
- Simulated points move along an illustrative Monrovia route with Start, Pause,
  and Reset. The route overlays actual Google geography when a map is
  available. It represents a demo sequence.
- The GPS map accepts a normalized sample and optional route. Browser location
  and demo location stay behind the existing provider interface. Future
  Arduino NEO-M8N support can supply the same sample format after its
  telemetry protocol is confirmed.
- Opting into Google Maps sends viewport information and standard network
  metadata to Google. VisionAid has no remote location storage or caretaker
  sharing. Browser location can run while the map stays off.
- The PWA caches its own shell. Google Maps requires a network connection,
  and its tiles are excluded from the app's offline cache. GPS details and demo
  controls remain available offline after the first online app load. Device
  positioning offline depends on the browser and the phone.
- Browser tracking is intended for foreground use. Continuous background GPS
  would require an appropriate native mobile integration.

## Verify

Run `npm test` and `npm run build`. On the configured HTTPS deployment, open
`/gps` in Android Chrome, enable device location, and use **Start Tracking**.
Allow permission and opt into Google Maps. Confirm a marker, accuracy circle,
and timestamp, then walk outdoors to check updates. Test Street map, Satellite,
zoom, pan, and **Center on My Location**. Stop and check that the historical
details remain while the live overlays disappear. Revoke site permission to
verify the denied state. Verify the demo route and controls with TalkBack, and
reopen the installed app offline after a complete online load.

## Diagnose a position near Fendall Campus

Open **Developer location diagnostics** and select **Device location**.
After starting tracking, compare the raw browser latitude and longitude with
the plotted marker. Check the reported accuracy, UTC fix timestamp, and fix
age. A wide accuracy estimate indicates approximate positioning. Enable
precise location for Chrome if available and repeat outdoors. The initial
Monrovia viewport is a map starting point. VisionAid plots a device marker
only after a valid, fresh browser fix. The map follows fresh device fixes until you pan or turn off **Follow my
location**. The marker keeps updating while follow is paused. **Center on My
Location** returns to the marker and resumes following.

## Offline location and map recovery

The service worker caches the VisionAid app shell, including the GPS controls
and simulated route. It does not cache or prefetch Google Maps imagery. After
one complete online load, the GPS page can reopen offline and still show the
location interface. A new page session starts without a last-known reading.

Device Location keeps the browser's position watcher active through connection
changes and recoverable acquisition failures. Some Android devices and
browsers continue supplying location from onboard sensors without internet.
Others time out, return errors, or need a network-assisted fix. While the
page stays open, VisionAid retains only the last valid reading in memory. If
the fix expires or the browser reports a failure, the reading and timestamp
remain visible with a historical label. New valid fixes replace it.

Google Maps needs a connection. When it goes offline, VisionAid hides the map
and shows a text status. After reconnecting, choose **Retry Map**. The map uses
a fresh device fix if available, or reopens the last viewport as geographic
context with no live marker. Retries never restart the location session.

To test on Android Chrome, use the HTTPS deployment. Start Device Location
outdoors, enable the map, and wait for a fix. Disable Wi-Fi and mobile data
while keeping device Location enabled. Walk and compare coordinates, accuracy,
and fix age in **Offline Location Status**. If fixes stop, confirm that the
reading becomes historical and the old timestamp remains. Restore connectivity
and select **Retry Map**, then verify Demo Mode separately. Toggle Location off
and back on for a separate browser-unavailable test.

A future ESP32 GPS integration can implement the existing location-provider
interface. Confirm the firmware transport and fix-quality fields first, then
validate coordinates, reported accuracy, timestamp, and freshness before using
a reading. Offline display should remain independent of whichever map is loaded.
