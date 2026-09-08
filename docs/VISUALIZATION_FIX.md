# Visualization compatibility

Current release: 1.0.5-en.1. Date: September 8, 2026.

Some web-generated visualizations depend on styles missing from the desktop host. This caused hidden tabs to remain visible, columns to stack, and spacing or formulas to render incorrectly. Compatibility rules are applied before HTML reaches the existing native sandbox.

- Support common layout, spacing, typography, and visualization color variables, including unequal fractional columns and sibling spacing.
- Expand two-column `md` grids at 560 pixels of visualization width to fit desktop conversation panes. Other breakpoints retain their original values; narrower views remain single-column.
- Request the native wide-layout route for multiple columns. Keep visualization webviews in a stable composited layer to address the reported transient white frames during wheel scrolling.
- Supply `.hidden` and native `hidden` rules so tab changes reveal only the selected panel.
- Render static text formulas as MathML using the bundled KaTeX library. Preserve code, scripts, attributes, SVG text, existing math, and node identities.
- Keep natural conversation scrolling without a nested height-limited scrollbar.

No additional math library, sandbox capabilities, GPU-setting changes, or disabled hardware acceleration are required. See [progressive visualizations](PROGRESSIVE_VISUALIZATION.md) for previews during generation.

## Validation and scope

326 checks passed. The compatibility module has 17 portable checks; native integration and real-browser checks exercise narrow and wide layouts, tabs, sliders, script counts, formulas, and node preservation. Additional checks cover native wide mode and the visualization-only compositing change.

After installation, the user confirmed that the interactive-visualization issues were resolved. This is acceptance on the current machine, not verification of every GPU or extended-use scenario.

This is a focused compatibility layer, not a complete Tailwind runtime. Unusual utilities, dynamically created formulas, and visualization-specific design problems can still require source changes.
