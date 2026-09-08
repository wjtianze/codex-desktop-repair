# Work progress and Save As repair

Release: 1.0.3. English edition: 1.0.3-en.1. Date: September 8, 2026. This update builds on 1.0.2 and addresses the newly reported Work-state and download-interaction problems.

## Historical timers and current progress

An earlier turn can retain unfinished plan steps or tool records without their individual completion markers. The native history converter treats these records as an active reasoning group. Without an end time, the view keeps using the current clock. In a live inspection, two later turns were complete while the earliest turn still appeared in progress. Running the native converter again reproduced that state.

The repair closes historical Work activity only after a later, different turn exists. It preserves the actual plan and tool records. Existing end times take priority; when missing, the fallback uses the last recorded completed activity before the next prompt. The current turn and additional input within the same turn remain active. The user confirmed the timer is now correct. The observed historical example corresponds to approximately 15 minutes 29 seconds; that is a fallback from recorded activity, not a new measurement of the exact server completion time.

The native waiting indicator also checked unfinished activity across the entire history, allowing the old turn to suppress the next turn's indicator. It now checks the latest turn.

A visible, active Work conversation can recover its snapshot through the existing client when messages stop updating. The monitor uses server-provided timing hints: the observed values were 30 seconds of silence followed by 10-second recovery intervals. Normal live updates postpone recovery. Navigation, stopping, authorization errors, and new data arriving during a read are guarded. Stale snapshots cannot replace newer local branches or messages. No model generation request was sent for validation.

## Show Save As before downloading

The native Save As path downloaded the whole Blob, converted it to a full ArrayBuffer, and passed it to the main process before showing the dialog. Large files or slow retrieval therefore left the click waiting for tens of seconds.

The repaired path opens the save dialog first and invokes the existing download function after the user chooses a destination. Cancelling the dialog avoids the download. Data is transferred to the main process in chunks of at most 8 MiB, avoiding another full-file cross-process byte array. Network retrieval still uses the native Blob path; transfer time continues to depend on file size, the server, and connection speed.

The main process uses only the user-selected destination. A time-limited save reservation, isolated by service instance, writes into a sibling temporary file. Ordered chunks and the final byte count must match before an atomic replacement. Network failures, write failures, cancellation, or a destination changed during the download preserve the original file. Legacy saving and preview paths remain available. The save control shows a spinner and an accessible busy label.

## Validation

- 287 checks: 105 portable cases and 182 behavior cases generated from the official client.
- 21 new Work-state cases and 24 download cases cover native views and save handlers, chunked writes, cancellation, expiration, concurrent requests, and destination preservation.
- Every packed resource is verified: 8,804 with sidebar filtering and 8,803 without it.
- The accepted local Chinese build passed 28 installation checks and preserved all 35 existing conversation-model choices.
- The client returned to normal launch with diagnostics disabled. The user confirmed both the timer and successful file saving. Real network throughput was not independently benchmarked.

Release 1.0.3 contains the accepted 1.0.3-local.2 implementation. Previously published 1.0.2 tags remain available. The English build is validated separately and is not installed over the user's Chinese interface.
