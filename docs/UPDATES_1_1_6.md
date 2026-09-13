# 1.1.6: Quick Chat search crashes, spacing and model previews

- Fix Quick Chat crashing as live web-search records arrive. Search metadata now uses the correct native source parser; available sources remain visible.
- Count nested transcript padding toward the navigation gutter, reducing excess blank space while preserving markers, hover expansion, and message navigation.
- Keep the selected model visible while previewing reasoning effort, such as "5.5 Medium". Canceling restores the original label; releasing saves the final choice.
- With Latest selected, ordinary slots show only their effort labels and the maximum slot shows "6 Pro". Crossing into or out of Pro preserves that distinction in both directions.
- Expand the README rant to cover subsequent issues and acknowledge regressions in the repair package itself.

Supports Windows Store package **26.908.4834.0**, UI **26.908.40834**. Save unsent content, exit the app, and run **Install-Repair.cmd**. The existing profile is preserved.

Both editions passed 447 native checks. The Chinese edition is installed with the original profile preserved.
