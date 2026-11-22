# VisionAid accessibility and voice guide

VisionAid uses native headings, landmarks, links, buttons, and form controls.
A skip link leads to the main content. Each route updates the page title and
moves focus to the main landmark. The current navigation item exposes its
active state. WCAG 2.2 AA is the design and testing target.

## Set up the app

Open **Accessibility Settings**. Choose Normal, Large, or Extra-large text.
Enable **High contrast** for a black background and light text. Enable
**Always reduce motion** to reduce app animation and use direct map centering.
VisionAid follows the system reduced-motion preference by default. Browser
zoom remains available. Preferences are saved locally for this browser and
origin. They apply offline after the app shell has loaded once.

To enable TalkBack on Android, open **Settings → Accessibility → TalkBack** and
turn on **Use TalkBack**. Consult [Android’s TalkBack guide](https://support.google.com/accessibility/android/answer/6007100)
for device-specific shortcuts. With TalkBack, swipe to move between items and
double-tap to activate the focused control. On iOS, use VoiceOver in the
system accessibility settings.

## Use VisionAid without the map

- **Monitoring and Dashboard:** Select one of the five simulator scenarios.
  **Read Sensor Status** gives each direction, distance, and unavailable or
  outdated readings. The alert announces meaningful changes in obstacle
  direction or sensor state. Repeated samples and distance-only changes stay
  quiet. The app identifies all demo readings as simulated.
- **Device:** **Read Device Status** explains the detected Bluetooth state.
  **Connect Cane** is disabled while the hardware protocol is unverified.
  A supported browser or available Bluetooth adapter does not establish a
  connection. Hardware handles immediate obstacle warnings independently.
- **GPS Tracking:** Select **Device location → Start Tracking**, then respond
  to the browser permission prompt. **Read My Location Status** reports the
  tracking state, accuracy, or last-known timestamp as appropriate. Text
  location details are available even when the map is off or unavailable.
  **Demo Mode** remains labeled and has separate controls.
- **Caretaker sharing:** The GPS page explains the sharing controls and their
  unavailable state. No sharing, caretaker approval, or revocation action
  can execute until authenticated and authorized backend support exists.

## Optional voice feedback

Voice feedback is off by default. Select **Test Voice** to hear a sample.
Enable **Speak important status changes** for occasional sensor, device, and
GPS announcements. The status buttons also speak on request when voice is
enabled. **Stop Voice** in Settings or **Stop voice feedback** in the current
page interrupts app speech. Disable the preference to silence future
automatic announcements. Navigation cancels current app speech.

App speech uses the browser’s speech synthesis API. Voice availability and
offline audio depend on the browser and installed voice. Voice feedback may
overlap with TalkBack or VoiceOver, so leave the preference off if you prefer
the screen reader alone. GPS speech omits raw coordinates. The app provides
no voice commands or turn-by-turn guidance, and speech is not a substitute
for the cane’s immediate warnings.

## Manual verification before the pitch

1. On Android Chrome with TalkBack enabled, use the skip link and move through
   the nav. Check that the current route is identified and route changes
   announce a new heading or landmark.
2. Use the Settings controls without looking. Check their selected states.
   Try high contrast, Extra-large text, and 200% browser zoom where supported.
3. Run all five sensor scenarios. Confirm each state is understandable and
   the alert does not repeat on every sample. Use **Read Sensor Status**.
4. Open Device and verify the availability message and explanation for the
   disabled pairing button. Use **Read Device Status**.
5. Start and stop GPS. Try granting and denying permission, loss of a fix,
   stale readings, and GPS Demo Mode. Confirm that the status is understandable
   with the map off. Check that disabled sharing controls have an explanation.
6. Test app voice on a device with speech synthesis. Interrupt the sample,
   turn the voice preference off, and verify that speech stays quiet while
   TalkBack continues. Try the same workflow with VoiceOver in iOS Safari.
7. After a complete online load, turn off internet access and reopen the app.
   Confirm settings persist and sensor/GPS demos remain usable. Available
   offline device fixes depend on the browser and phone.

## Verification limits and follow-up

Automated tests cover preference changes and persistence, route focus, mocked
speech, Bluetooth errors, and on-demand status. Production Chrome verified
keyboard operation, reflow at 320 CSS pixels with Extra-large text, and offline
preference persistence. Physical TalkBack, VoiceOver, real speech output, and
the embedded Google Maps controls still require device checks. The map is
optional and its third-party controls may vary. Next accessibility improvements
should be based on those device checks and feedback from blind and low-vision
users.
