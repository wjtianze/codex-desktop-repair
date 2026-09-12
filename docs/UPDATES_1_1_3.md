# 1.1.3: reading-position restoration and slider animation cadence

- Reopening a chat restores its reading position using the actual conversation ID instead of a work-mode boolean.
- Slider particles follow the display refresh cadence instead of an uneven roughly 30 FPS cap. Hidden-window suspension and reduced-motion behavior remain supported.

Supported official client versions are unchanged. Both language variants passed 433 installed-source checks. Applying the update requires closing and reopening the client; allow active background tasks to finish first.

A separate source of stuttering was traced to a local arena page rebuilding unchanged terrain canvases in the embedded browser. Its map cache was repaired separately. This general desktop patch contains no arena-specific code and does not throttle computations in other pages.
