# Changelog

## 1.1.0

Monitor Gemini and Claude/GPT quotas together with a compact status bar and more detailed hover tooltips.

### What's new

- Display both model families with initials, ring indicators, and remaining quota percentages.
- View 5-hour and weekly quotas in hover tooltips, including ring/pie charts and reset countdowns.
- Choose which model families to display: All, Gemini, or Claude & GPT.
- Enable or disable quota refresh notifications. Audio signals are requested where supported by the IDE.
- Open extension settings directly from the status bar.

### Improvements

- Refined chart alignment and countdown formatting.
- Updated the extension logo.
- Changed the default refresh interval from 120 to 20 seconds. Supported values now range from 20 to 3,600 seconds.
- Updated English, Korean, and Chinese documentation.

### Thanks

Special thanks to [@chrisquim](https://github.com/chrisquim) for proposing the dual-quota design and contributing the original implementation in [PR #2](https://github.com/coramdeo643/my-agy-usage/pull/2).

Resolves [issue #1](https://github.com/coramdeo643/my-agy-usage/issues/1).
