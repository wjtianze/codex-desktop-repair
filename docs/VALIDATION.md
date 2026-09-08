# Validation record

Current repair: 1.0.2. English edition: 1.0.2-en.1. Date: September 8, 2026.

## Behavior coverage

| Check | Coverage |
| --- | --- |
| Bounded record reader | 10 cases: large fields, multiple batches, UTF-8 boundaries, duplicate keys, invalid JSON, and rotation. |
| Composer recovery | 9 cases: permission failures, bounded retries, cancellation on switching, and shared-request protection. |
| Sidebar filtering | 10 cases: projects, pins, manual choice, automatic context following, and the native menu. |
| Installation transactions | 8 cases: fresh installation, upgrade, rollback after failure, subsequent changes, and repeated restore. |
| Patching and resource assembly | 6 cases: hashes, offsets, paths, and empty-file integrity. |
| Listener cleanup, idle eviction, browser queue, crash and window guards | 19 cases. |
| Performance records, on-demand windows, renderer titles, main-process titles | 7, 5, 8, and 9 cases respectively. |
| Retrieval images, conversation models, history conversion, image proportions, full citation renderer | 7, 10, 10, 6, and 7 cases respectively. |
| Log queue, state persistence, mention search, draft saving | 11, 10, 8, and 3 cases respectively. |
| Additional portable helpers | 16 cases covering classification, preference isolation, cache invalidation, and search cancellation. |
| Initial profile selection | 3 cases: nonvirtualized profile, preserving an existing absolute path, and rejecting invalid saved paths. |
| Quick chat across modes | 6 cases exercising the native component, separate button action, keyboard presentation preferences, and unavailable-state protection. |
| Project sources, project form, Work activity | 6, 12, and 12 additional cases. |
| Live Chat summary and Quick Chat actions | 8 native disclosure lifecycle cases, 8 action-state cases, and 8 full transcript/native edit cases. |
| Total | 242 cases: 76 portable tests and 166 tests using fixtures generated from official resources. |
| Packed resources | 8,801 entries in the complete edition; 8,800 without sidebar filtering. Every entry is verified. |

The English edition changes project-owned text and entry-command names and regenerates the relevant digests. It reruns the same 242 cases. Multilingual synthetic test data remains unchanged to preserve Unicode coverage.

## Base-version runtime evidence

The 1.0.0 package was installed, restored, and reinstalled through its actual entry points. All 28 transaction writes verified; restored archive and executable hashes matched the pre-installation state. A fresh ordinary-directory copy also passed 17 transaction checks and rollback, with three native dependencies verified as regular files with matching hashes.

The final 1.0.1 build was installed with 28 verified operations. Eighteen existing per-conversation model choices were retained, as was a later added choice. The user confirmed image display, file cards, conversation Markdown rendering, model selection, streaming-content recovery, and both quick-chat entry points. The client returned to normal launch with diagnostics disabled.

A separate 1.0.1 fresh-copy test verified 17 installation operations and rollback, plus the same three native dependencies. During one upgrade attempt, reopening the client caused a file-rename failure. The transaction restored the exact preceding build and a subsequent installation succeeded.

Logs after the logging and persistence changes showed successful message-subscription connection and no matched temporal-dead-zone, missing-module, or state-persistence failure. Oversized log records were actually limited to 24,000 code units.

## Performance observations

A 15-minute main-renderer observation collected 31 samples. JavaScript heap usage began near 164 MiB, ranged from 162 to 309 MiB, and ended near 198 MiB, with several decreases. Among 9,484 retained interaction events, median duration was 24 ms, the 95th percentile was 48 ms, and the maximum was 336 ms. There were 36 recorded long tasks, with a maximum near 217 ms.

The recorder kept at most 500 events per 30-second interval and covered only the main renderer. Event timing does not measure completion of every asynchronous navigation. This observation does not exclude multi-hour memory problems or Windows compositor faults. A subsequent 55-second CPU profile captured no matching slow interaction and did not identify the remaining occasional delay.

Earlier main-process heartbeat intervals of approximately 19.39 and 11.79 seconds fell to about 0.20 seconds in a same-machine comparison; another check without CPU profiling reached about 0.45 seconds. These intervals include scheduling delay. They are not application startup times and cannot be generalized to every machine.

## Security and reproducibility

The Chinese 1.0.1 source package passed privacy checks, patch-fragment and helper hashes, its environment checker, and all 62 portable tests. Defender completed a custom scan of its final ZIP with no new detection; real-time protection and behavior monitoring remained enabled.

English artifacts receive their own rebuild, package-integrity checks, portable/native test runs, and custom scan. Results specific to the English edition are recorded with its release. Actual signed-in runtime acceptance described above belongs to the base repair and is not presented as a separate English UI acceptance test.

Run **node tests/run.cjs --installed** to generate native fixtures from the supported official installation. Complete client scripts, profiles, logs, and runtime copies remain in ignored local build directories and are not published.

Unresolved reports, including Windows desktop-wide stutter and file-editor math rendering, are listed in [the audit](AUDIT.md). Occasional 0.x-to-1-second delays cannot be diagnosed as a memory leak from a single memory reading.

## English edition results

All 188 tests passed for 1.0.1-en.1. A separate fresh-copy installation verified 17 transaction operations and successful rollback, including three native dependencies checked as regular files with matching hashes. The actual English environment-check entry point also passed. Both full and no-sidebar resource builds were rebuilt and pinned to their verified digests. The English release ZIP received a separate Defender custom scan with no new detection; protection remained enabled.

## 1.0.2 runtime evidence

The Chinese 1.0.2 build was installed with 28 verified operations and all 28 existing conversation model choices preserved. It uses normal launch with diagnostics disabled. An initial Windows executable-replacement failure restored the exact 1.0.1 EXE and ASAR before a successful retry. Both current language editions passed 242 cases, including their full official-source builds. New message actions were exercised with synthetic conversations and native functions, without a real generation request or quota use. The user confirmed the new Quick Chat edit/regenerate controls and successful saving of source-only project changes. This control-level acceptance is distinct from a real regeneration request or a live summary-streaming test.
