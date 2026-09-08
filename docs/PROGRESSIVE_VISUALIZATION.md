# Progressive visualizations

Release: 1.0.5-en.1. Date: September 8, 2026.

The desktop client previously hid incomplete visualization markers until the entire payload arrived. Embedded HTML now updates progressively inside one native sandbox. Once the complete content passes native reference validation, the final document initializes and its controls become available.

Request an interactive visualization as usual. Structure, text, and static SVG appear as HTML arrives, with a generation status above the preview. Existing completed visualizations open directly. Downloads and exports retain the complete source and actual filename.

## Implementation and verification

- Recognize both `visualize` and the `app_block` form of `genui`. Preview actual HTML rather than icons, thumbnails, or unrelated widgets; suppress incomplete metadata-only markers.
- Keep component and native-view identities stable. Updates use the existing sandbox globals channel; preview scripts and event attributes are removed and interaction stays disabled.
- Validate final content through the native reference check and initialize it once. Restore interaction when ready without waiting for the event stream to close. Handle cancellation, disposal, retry, and late results.
- Preserve external-content restrictions, sandbox capabilities, and user-action checks. No nested scrolling container or automatic model request is added.
- See [visualization compatibility](VISUALIZATION_FIX.md) for columns and scroll painting, and [search progress](SEARCH_PROGRESS.md) for live search details.

Both editions passed 326 checks: 134 portable and 192 using official resources. Real-browser checks cover four progressive updates, one preview document, deferred script execution, one final initialization, working controls, and correct source export. The actual desktop Markdown tokenizer also checks `genui` fragments, surrounding prose, fenced and inline code, and metadata-only prefixes.

The installed Chinese candidate passed 28 transaction checks and retained all 42 existing model preferences. The user subsequently confirmed that the interactive-visualization issues were resolved. Automated streaming checks use synthetic data and send no extra model requests.

## Limits

A preview needs HTML from the server. Charts computed or drawn by final JavaScript appear after initialization; not every curve can be drawn during generation. File-path-only visualizations keep their existing loading route.
