# BOSS Changelog

## v15.0 — 2026-08

### Fixed
- **Nested HTML bug** — Removed duplicate `<html>`/`<body>` tags from `/t/[slug]`, `/review/[token]`, and `/portfolios` pages. Root `layout.js` now provides the document shell consistently.

### Added
- **ReviewClient component** — Extracted client-side review form logic for proper Server/Client component separation.

### Verified
- **Service worker intact** — Confirmed `public/sw.js` exists and `navigator.serviceWorker.register("/sw.js")` in BOSSApp.jsx is functional. Push notification routes (`/api/push/*`) and `web-push` dependency present.

## v14.0 — 2026-08 (current)

### What Changed from v13
- All 8 Tier 1 blocking items resolved (verified in code 2026-08)
- Landing page sections and navigation copy updated

### Tier 1 Blocking Items — All Resolved
- [x] PARTIAL-01 — db.setCustomers() N+1 loop → bulk upsert (src/lib/db.js:320)
- [x] PARTIAL-02 — BOS Score repeat rate formula → corrected denominator (src/components/boss/helpers.js:293)
- [x] PARTIAL-03 — creditWallet fallback → moot, Paystack removed (v2)
- [x] MISSING-01 — Privacy Policy / Terms of Service → /privacy + /terms pages live
- [x] MISSING-02 — Unmatched DVA payments UI → moot, DVA removed (v2)
- [x] MISSING-03 — Sync/connection status indicator → _syncCallback + BOSSApp sync pill
- [x] BUG-AUTH — Auth emails → moot, Google-only OAuth bypasses SMTP (v2); residual is Supabase dashboard SMTP/Site URL config, no code
- [x] BUG-SAVE — Double-save duplicate orders → isSaving/savingRef guards (AddOrderFlow, AddClientFlow, CustomerDetailFlow)

### Next Session Should Start With
Run /status for full dashboard. All Tier 1 items are code-complete.
