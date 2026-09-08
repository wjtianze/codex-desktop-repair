# Visualization compatibility

Release: 1.0.4. English edition: 1.0.4-en.1. Date: September 8, 2026.

Some HTML visualizations generated for the web host use legacy utility classes absent from the desktop host. Hidden tabs consequently remain visible, while grid layout, spacing, and buttons lose their intended styling. This release prepares those fragments before passing them to the existing native sandbox.

- Adds common layout, spacing, typography, and visualization color utilities while preserving their responsive breakpoints.
- Supports both the `.hidden` class and the HTML `hidden` attribute so tab scripts can hide inactive panels.
- Uses the already bundled KaTeX module to convert static text formulas to MathML, including legacy double-escaped delimiters. Code, scripts, attributes, SVG text, and existing rendered math are excluded.
- Preserves element identifiers and the original update logic so sliders and presets still update their values.
- Keeps the visualization in the conversation's natural page flow without adding a nested scrolling container.

Math is rendered locally without downloading additional fonts or a math library. Compatibility styles remain inside the existing visualization sandbox. The patch does not expand network access, messaging permissions, or sandbox capabilities.

## Verification

304 checks pass: 119 portable tests and 185 checks using official resources. New cases cover missing visibility rules, responsive layout, math delimiters, input bounds, the native HTML entry point, and actual Edge tab clicks, slider updates, script execution counts, and node identity at narrow and wide widths.

The corresponding local installation passed 28 transaction checks and preserved 37 existing model preferences. The user confirmed restored tabs and formula display. The extra scrolling container was removed following subsequent feedback. Desktop scrolling and flicker after removing that container still await user confirmation; offline layout tests do not prove that compositor flicker is fully resolved.

## Scope

This is a compatibility layer for common legacy visualization utilities, not a complete Tailwind runtime. Specialized utilities and formulas generated after scripts execute may still need handling within the visualization. A layout using `md:grid-cols-2` remains single-column below its original breakpoint.

Progressive generation previews are not implemented in this release. The existing client hides incomplete visualization markers and mounts the completed visualization after matching its content reference. Progressive previews require further changes to that receiving and rendering path.
