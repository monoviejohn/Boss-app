---
name: status
description: Outputs the current BOSS launch readiness dashboard — score, blocking items, confirmed correct items, and next priority action.
---

# /status — BOSS Launch Readiness Dashboard

You are providing a project status report.
Read `.copilot/context/overview.md` for context.
Check `.copilot/artifact/worklog/` for the most recent session log.
Check `.copilot/spec/` for any open specs.

---

## Output Format

```
════════════════════════════════════════════════
  BOSS — Launch Readiness Dashboard
  v14 · $(date)
════════════════════════════════════════════════

OVERALL SCORE: 8.5 / 10

Engineering Quality:    9.0/10  █████████░
Security:               8.5/10  █████████░
UX/Accessibility:       8.0/10  ████████░░
Legal/Compliance:       7.0/10  ███████░░░
Business Readiness:     7.0/10  ███████░░░

════════════════════════════════════════════════
  🔴 TIER 1 — BLOCKING (must fix before paying users)
════════════════════════════════════════════════

✅ PARTIAL-01  db.setCustomers() N+1 loop
              → Fixed with bulk upsert (onConflict:"id")
              → File: src/lib/db.js:320

✅ PARTIAL-02  BOS Score repeat rate formula
              → Fixed: repeatCustomers / customersWhoHaveOrders
              → File: src/components/boss/helpers.js:293

✅ PARTIAL-03  creditWallet() fallback
              → Moot — Paystack removed (v2)

✅ MISSING-01  Privacy Policy / Terms of Service
              → Live at /privacy and /terms

✅ MISSING-02  Unmatched DVA payments UI
              → Moot — DVA removed (v2)

✅ MISSING-03  Sync/connection status indicator
              → _syncCallback in db.js + BOSSApp sync pill

✅ BUG-AUTH    Auth emails not sending
              → Moot — Google-only OAuth bypasses SMTP (v2)
              → Residual: Supabase dashboard SMTP/Site URL, no code

✅ BUG-SAVE    Double-save creates duplicate orders
              → Fixed with isSaving/savingRef guards
              → Files: AddOrderFlow, AddClientFlow, CustomerDetailFlow

════════════════════════════════════════════════
  🟡 TIER 2 — LAUNCH QUALITY (fix within first week)
════════════════════════════════════════════════

[ ] Q-03  tabs.jsx is 1,158 lines — extract ProfileTab
[ ] Q-04  SmartPricingCalculator fee formula edge cases
[ ] Q-05  Invoice payment auto-polling (customer pays → status updates live)
[ ] A-01  BOS Score explainability panel (show what drives the score)
[ ] A-02  Self-declaration score boost for new tailors (onboarding)
[ ] A-04  bos_score_history table (track score over time)

════════════════════════════════════════════════
  ✅ CONFIRMED CORRECT — DO NOT TOUCH
════════════════════════════════════════════════

✅ HMAC webhook with crypto.timingSafeEqual()
✅ Upstash Redis rate limiter with in-memory fallback
✅ Idempotency on paystack_ref AND transfer_code
✅ db.updateOrder() / db.updateCustomer() targeted writes
✅ Auto-receipt WhatsApp prompt (deposit > 0 + phone exists)
✅ ErrorBoundary at BOSSClient level
✅ Custom DatePicker (Android WebView safe)
✅ Promise.all([minWait, dataLoad]) splash transition
✅ Customer/tailor phone excluded from public invoice API
✅ Offline mode fully removed
✅ Google-only OAuth (verified email, no SMTP dependency)

════════════════════════════════════════════════
  📋 OPEN SPECS
════════════════════════════════════════════════

[Check .copilot/spec/ for any draft or approved specs]

════════════════════════════════════════════════
  🎯 NEXT PRIORITY ACTION
════════════════════════════════════════════════

All Tier 1 items are code-complete. Move to Tier 2:
A-01 BOS Score explainability panel — show tailors what drives their score.
════════════════════════════════════════════════
```
