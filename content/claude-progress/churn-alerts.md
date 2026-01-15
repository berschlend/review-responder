# 🔄 Churn Alerts

> Generiert von Burst-13 (Churn Prevention) alle 6 Stunden.
> Alle Agents lesen diese Datei für Retention-Priorisierung.

---

## At-Risk Summary

**Letztes Update:** 2026-01-16T02:38:00Z

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
| Total Users | 38 | +6 seit gestern |
| Paying Users | 0 | Keine Churn-Gefahr |
| Never Used (0 Responses) | 26 | 68% - Activation Problem |
| Low Usage (1-4 Responses) | 7 | Potential churners wenn sie Free bleiben |
| Medium Usage (5-14 Responses) | 5 | Getting closer to limit |
| High Usage (15+ Responses) | 0 | Niemand nahe am Limit |
| Users at 20 Response Limit | 0 | Niemand hat Limit erreicht |

### Top Active Users (closest to limit)

| User | Plan | Responses | % to Limit |
|------|------|-----------|------------|
| Berend.mainz@web.de | unlimited | 8 | N/A (unlimited) |
| rolicupo.twitch@gmail.com | free | 6 | 30% |
| berend.jakob.mainz@gmail.com | free | 5 | 25% |
| rolicupo.games@gmail.com | free | 5 | 25% |
| breihosen@gmail.com | free | 5 | 25% |

---

## Why Churn Prevention is Paused

```
┌──────────────────────────────────────────────────────────────┐
│ FIRST PRINCIPLES ANALYSIS:                                   │
│                                                              │
│ Churn Prevention = Verhindern dass ZAHLENDE Kunden gehen    │
│                                                              │
│ AKTUELL:                                                     │
│ - 0 zahlende Kunden                                         │
│ - 0 User die jemals Limit erreicht haben                    │
│ - 26 von 38 Users haben NIEMALS Product genutzt             │
│                                                              │
│ BOTTLENECK IST NICHT CHURN:                                 │
│ - Bottleneck ist ACTIVATION (Burst-6)                       │
│ - Users registrieren sich, nutzen Product aber nicht        │
│ - Dann PAYMENT (Burst-7) wenn sie Limit erreichen          │
│                                                              │
│ WANN WIRD BURST-13 RELEVANT?                                │
│ 1. Wenn erster zahlender Kunde da ist                       │
│ 2. Wenn Free Power Users (10+ Responses) vorhanden          │
│ 3. Wenn erste Cancellation passiert                         │
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

## Erfolgreiche Win-Backs

| Datum | User | Segment | Offer Used | Revenue Recovered |
|-------|------|---------|------------|-------------------|
| (noch keine) | - | - | - | - |

---

## Next Steps for Burst-13

1. **PAUSED** - Fokus liegt auf Activation (Burst-6) und Payment (Burst-7)
2. **MONITOR** - Checke alle 6h ob sich Status ändert
3. **RESUME CONDITIONS:**
   - First paying customer acquired
   - User cancels subscription
   - Berend manually requests churn analysis

---

*Diese Datei wird von Burst-13 alle 6 Stunden aktualisiert.*
*Nächster Check: 2026-01-16T08:38:00Z*
