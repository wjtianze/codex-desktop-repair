# Search progress during generation

Release: 1.0.5-en.1. Date: September 8, 2026.

The ordinary Chat thinking panel previously skipped web-search records. It now shows the native search status and query when the record arrives. Server-provided sources appear as domain chips with expandable page titles and links.

Only received records are shown: search results do not mean that the model read every page, and missing sources do not produce invented site counts. Opening a source requires an explicit click through the native link action. Restricted-content rules, manual collapse, server hide instructions, and the dedicated Work activity route remain intact.

Checks cover the actual thinking component, live expansion, source updates after manual collapse, restricted links, source deduplication and unsafe URLs, missing sources, and explicit open-page actions. Both editions include these checks in the 326-case suite. Validation uses native components and synthetic inputs; no additional live search or model requests were sent.
