# 🔄 Churn Alerts

> Generiert von Burst-13 (Churn Prevention) alle 6 Stunden.
> Alle Agents lesen diese Datei für Retention-Priorisierung.

---

## At-Risk Summary

**Letztes Update:** 2026-01-18T07:00:00Z

| Kategorie | Count | Trend |
|-----------|-------|-------|
| Paying At-Risk | 0 | → (keine zahlenden Kunden) |
| Free Power At-Risk | 0 | → (niemand mit 10+ Responses) |
| In Win-Back Window | 0 | → (keine Cancellations) |

**STATUS: HEALTHY (No churn risk because no paying users yet)**

---

## Current User State

| Metric | Value | Notes |
|--------|-------|-------|
| Total Registered | 16 | Non-test accounts |
| Real Users (1+ Gen) | 8 | Via Demo (laut Stats) |
| Paying Users | 0 | Keine Churn-Gefahr |
| Never Used (0 Responses) | 16 | 100% - Kritisches Activation Problem |
| DAU | 0 | Niemand aktiv heute |
| WAU | 14 | Letzte Woche aktiv (inkl. Test) |
| Returning Users | 0 | Niemand kommt zurück |

### Bot-Filtered Reality (aus real-user-metrics.json)

| Category | Count | Emails |
|----------|-------|--------|
| REAL Users (Demo Gen) | 4 | terrasse-zuerich.ch, trattoria-sempre.ch, treudelberg.com, stjamesquarter.com |
| FAKE Accounts (Bots) | 3 | H0796@accor.com, h9057@accor.com, i.schmidt@tv-turm.de |
| New Bot Accounts (heute) | 6+ | h5413@sofitel.com, H1163@accor.com, etc. (Magic Link Bot-Clicks) |

---

## Why Churn Prevention is PAUSED

```
┌──────────────────────────────────────────────────────────────┐
│ FIRST PRINCIPLES ANALYSIS (18.01.2026):                      │
│                                                              │
│ Churn Prevention = Verhindern dass ZAHLENDE Kunden gehen    │
│                                                              │
│ AKTUELL:                                                     │
│ - 0 zahlende Kunden                                         │
│ - 0 User die jemals Generator genutzt haben                 │
│ - 100% der registrierten User haben 0 Responses             │
│ - Viele "Registrierungen" sind Security Scanner Bots        │
│                                                              │
│ DAS PROBLEM IST NICHT CHURN:                                │
│ 1. ACQUISITION: Emails gehen raus (OK)                      │
│ 2. ACTIVATION: Registrierte nutzen Product NICHT (PROBLEM!) │
│ 3. PAYMENT: Noch niemand am Limit gewesen                   │
│ 4. CHURN: Noch niemand zum Churnen                          │
│                                                              │
│ BOTTLENECK: Magic Link → Account → STOPP (kein Generator)   │
│                                                              │
│ WANN WIRD BURST-13 RELEVANT?                                │
│ 1. Erster zahlender Kunde da ist                            │
│ 2. User Subscription cancelled                               │
│ 3. Power User (10+ Responses) wird inaktiv                  │
└──────────────────────────────────────────────────────────────┘
```

---

## High-Value At-Risk

| User | Plan | LTV | Last Active | Segment |
|------|------|-----|-------------|---------|
| (keine) | - | - | - | - |

---

## Segment Distribution

| Segment | Count | % |
|---------|-------|---|
| 💸 Price Sensitive | 0 | 0% |
| 🔧 Feature Gap | 0 | 0% |
| ⏰ Bad Timing | 0 | 0% |
| 🔬 Just Testing | 0 | 0% |
| 😕 Didn't See Value | 0 | 0% |
| 🚫 Unknown | 0 | 0% |

---

## Active Win-Back Sequences

| User | Segment | Step | Last Sent | Next Action |
|------|---------|------|-----------|-------------|
| (keine) | - | - | - | - |

---

## Win-Back Performance (7 Tage)

| Segment | Sent | Opened | Clicked | Reactivated | Rate |
|---------|------|--------|---------|-------------|------|
| Price Sensitive | 0 | 0 | 0 | 0 | N/A |
| Feature Gap | 0 | 0 | 0 | 0 | N/A |
| Bad Timing | 0 | 0 | 0 | 0 | N/A |
| Just Testing | 0 | 0 | 0 | 0 | N/A |
| Didn't See Value | 0 | 0 | 0 | 0 | N/A |
| Unknown | 0 | 0 | 0 | 0 | N/A |

---

## Revenue Recovered

**Letzte 7 Tage:** $0
**Letzte 30 Tage:** $0
**Gesamt:** $0

---

## Hot Leads (für andere Agents)

Diese Leads sollten von Burst-5 (Hot Lead Chaser) bearbeitet werden:

| Email | Business | Status | Priority |
|-------|----------|--------|----------|
| ti.cafeofficial@gmail.com | Tí Cafe Denver | Clicked 17.01, personal gmail | 🔴 HOT |
| zuerich@trattoria-sempre.ch | Trattoria Sempre Zürich | Real user, phone available | 🟡 WARM |

---

## Key Insight

```
┌──────────────────────────────────────────────────────────────┐
│ SECURITY SCANNER BOT EXPLOSION:                              │
│                                                              │
│ 6+ neue "Accounts" heute (2026-01-18) sind Bots:            │
│ - h5413@sofitel.com (Sofitel Munich)                        │
│ - info@radissonhotels.com (Radisson)                        │
│ - H1163@accor.com (Mercure Hamburg)                         │
│ - wien@25hours-hotels.com (25hours Vienna)                  │
│ - office@rollercoasterrestaurant.com                        │
│ - info@godfreyhotelhollywood.com                            │
│ - conciergebirmingham@s5a.com                               │
│                                                              │
│ ALLE: is_magic_link=true, signup_source=magic_link,         │
│       response_count=0, days_since_signup=0                 │
│                                                              │
│ PATTERN: Enterprise Hotels mit Security Scannern            │
│          klicken Magic Links → Auto-Account erstellt        │
│                                                              │
│ FIX NEEDED: Bot-Check BEFORE auto-account creation          │
│ CURRENT: Bot-Check nur bei Magic Link Login, nicht Create   │
└──────────────────────────────────────────────────────────────┘
```

---

## Next Steps for Burst-13

1. **PAUSED** - Fokus liegt auf Activation (kein Churn möglich ohne User)
2. **MONITOR** - Checke alle 6h ob sich Status ändert
3. **RESUME CONDITIONS:**
   - First paying customer acquired
   - User cancels subscription
   - Berend manually requests churn analysis

---

*Diese Datei wird von Burst-13 alle 6 Stunden aktualisiert.*
*Nächster Check: 2026-01-18T13:00:00Z*
