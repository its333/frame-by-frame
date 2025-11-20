# Frame by Frame Pro (Chrome Extension)

Control HTML5 videos frame-by-frame with keyboard shortcuts, a floating overlay, and a themed options page.

## What changed recently
- Shortcuts now default to `,` / `.` for previous/next frame and `[` / `]` for framerate; legacy arrow keys migrate automatically.
- Scrubbing reliability improved: active video tracking is more robust and shortcuts work even after long playback.
- Overlay rebuilt with visible labels (Time, Duration, Frame, FPS), clearer typography, and an orange/yellow theme with white accents.
- Options page restyled to match the new theme; shortcut fields and toggles remain fully editable.
- Error handling improved for the options page when the active tab cannot be messaged.

## Usage
- Hover the video, then use:
  - `,` / `.` to step backward/forward
  - `[` / `]` to decrease/increase framerate
  - Hold `Shift` with those keys for larger jumps
- Toggle or resize the overlay with the corner controls; settings persist per site.

## Install (unpacked)
1) `git clone https://github.com/its333/frame-by-frame`  
2) In Chrome, go to `chrome://extensions`, enable Developer Mode.  
3) Click “Load unpacked” and select this folder.

## Notes
- The overlay respects per-site enable/disable in the options page.
- If loading the options page on a protected tab (e.g., chrome://), you’ll see a graceful error banner.
