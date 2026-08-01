# BOSS Changelog

## v10.0 — 2026-05

### Implemented
- **S-09** Fixed all three bare setTimeout memory leaks (saveProfile, requeryMsg, vaMsg)
- **S-02** Upstash Redis distributed rate limiter replacing in-memory Map
- **S-01** Offline mode fully removed — db.js is Supabase-only
- **S-05/L-03** Customer and tailor phone removed from public invoice API
- **S-09 HMAC** crypto.timingSafeEqual() replaces string equality on webhook
- **PAY-03** creditWallet() fallback removed — atomic RPC only
- **DVA** buildDVAName() naming convention: first_name="BOSS", last_name=cleanedShopName
- **U-09** Custom DatePicker (3 selects, Android WebView safe, leap year handling)
- **T-09** File split: BOSSApp.jsx 2,559 → 260 lines; 8 submodules in boss/
- **T-13** React Context (useBOSS) eliminates prop drilling
- **T-07** ErrorBoundary at BOSSClient level
- **U-02** Delete order confirmation sheet (2-tap required)
- **PAY-02** Paystack card fee toggle in SmartPricingCalculator

### Fixed
- **BUG-IMPORTS** flows.jsx, tabs.jsx, cards.jsx, ui.jsx missing imports causing crashes
- **BUG-TOKENS** Duplicate const NG_BANKS in tabs.jsx (build failure)
- **BUG-TOKENS** Duplicate const MONTHS in ui.jsx (build failure)
- **BUG-TOKENS** Duplicate const greenDim in tokens.js
- **BUG-DIVIDE** Zero-division in partial payment percentage display

### Deferred
- BUG-AUTH — Auth emails not sending (anon key issue) — TIER 1 PRIORITY
- BUG-SAVE — Double-save duplicate orders (no isSaving guard) — TIER 1 PRIORITY
- PARTIAL-01 — db.setCustomers() N+1 loop — TIER 1 PRIORITY
- PARTIAL-02 — BOS Score repeat rate formula inverted — TIER 1 PRIORITY
- MISSING-01 — Privacy Policy / Terms of Service — requires legal counsel
- MISSING-02 — Unmatched DVA payments UI
- MISSING-03 — Sync/connection status indicator

### Tier 1 Blocking Items Remaining (8)
- [ ] PARTIAL-01 — N+1 write loop
- [ ] PARTIAL-02 — BOS Score formula
- [ ] PARTIAL-03 — creditWallet fallback (done in v10 — verify)
- [ ] MISSING-01 — Privacy Policy (legal)
- [ ] MISSING-02 — Unmatched payments UI
- [ ] MISSING-03 — Sync status indicator
- [ ] BUG-AUTH — Auth emails
- [ ] BUG-SAVE — Double-save guard

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
