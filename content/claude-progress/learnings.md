# 📚 Night-Burst Learnings Database

> Zentrale Wissensbasis für alle Agents. Hier dokumentieren wir was funktioniert und was nicht.
> **PFLICHT:** Jeder Agent liest diese Datei JEDEN Loop!
> **NEU V3.1:** Jetzt mit echten Daten basierend auf 5 Tagen Operation!

---

## 🔴 CRITICAL RULES (Sofort anwenden!)

| Rule | Warum | Gelernt am |
|------|-------|------------|
| **BACKEND WECKEN vor API-Calls!** | Render schläft, 30-60s Wake-Up nötig | 16.01.2026 |
| KEIN Discount in Cold Emails | Devalues Product, Claudius-Fehler | Setup |
| Max 30% Discount | LTV > CAC muss gelten | Setup |
| Discount NUR mit Deadline | Ohne Urgency keine Conversion | Setup |
| API Calls erst nach Cache-Check | Budget schonen | Setup |
| Max 2 Follow-Ups pro Lead | Mehr = Spam | Setup |
| Star Rating in Subject Line | +100% CTR vs ohne | 14.01.2026 |
| Magic Links für Hot Leads | 10 Registrierungen in 1 Nacht | 15.01.2026 |
| Cache prüfen vor Outscraper | 189 Entries = 0 API Calls | 15.01.2026 |

---

## 🏆 WHAT WORKS (Wiederholen!)

### Email Subject Lines (CTR >3%)
| Subject | CTR | Sample Size | Notes |
|---------|-----|-------------|-------|
| "Your [RATING]-star review from [NAME]..." | ~4% | 500+ | BEST PERFORMER |
| Mit ⭐ Emoji | +100% vs ohne | A/B Test | Star Rating Variant Winner |
| Personalisiert mit Business Name | Besser | - | Vs Generic |

### Magic Link Re-Engagement
| Pattern | Result | Sample |
|---------|--------|--------|
| Magic Link an Clicker ohne Account | 10 Registrierungen | 15.01 Nacht |
| 24h Delay nach Click | Besser als sofort | - |
| DE/EN Detection basierend auf Stadt | Höhere CTR | - |

### Conversion Triggers (Registration)
| Trigger | Result | Notes |
|---------|--------|-------|
| Magic Link in Follow-Up | 10 Registrations | 15.01 Nacht |
| Demo Page Email Gate | Email Capture | Working |
| Exit Intent Popup (30% off) | TBD | Deployed 14.01 |

### Best Times (UTC)
| Action | Best Time | Worst Time | Evidence |
|--------|-----------|------------|----------|
| Cold Email | 09:00-11:00 | 00:00-06:00 | Business Hours |
| Follow-Up | 24h nach Click | Sofort | Magic Link Data |
| Demo Expiration Email | Day 3 + Day 5 | Day 1 | Urgency builds |

### Lead Sources Performance
| Source | Email Hit Rate | Quality | Notes |
|--------|---------------|---------|-------|
| TripAdvisor | ~60% | High | Owner emails oft auf Website |
| Google Maps | ~40% | Medium | Braucht Website Scraping |
| G2 (Competitors) | High | Very High | Unzufriedene = perfekte Targets |
| Yelp | ~50% | High | - |

---

## 🚫 WHAT DOESN'T WORK (Nie wieder!)

### Email Anti-Patterns
| Pattern | Why Bad | Alternative |
|---------|---------|-------------|
| Discount in Cold Email | 0% Conv, devalues product | Value-first (Demo) |
| info@/contact@ Emails | Low engagement | Find personal emails |
| Generic Subject Lines | Low CTR | Personalize with rating + name |
| Multiple CTAs | Confusion | Single clear CTA |

### Discount Anti-Patterns
| Pattern | Result | Learning |
|---------|--------|----------|
| Discount an Cold Lead | 0% Conv | Erst Value zeigen |
| Discount ohne Deadline | Niedriger Conv | Immer 48h Expiry |
| >30% Discount | Devalues product | Max 30% (EARLY50 Ausnahme) |
| Discount ohne Usage | Kein Commitment | Erst Product nutzen lassen |

### API Anti-Patterns
| Pattern | Problem | Alternative |
|---------|---------|-------------|
| SerpAPI ohne Cache-Check | 960% über Limit | Cache first! |
| Outscraper für gecachte Businesses | Verschwendung | Check review_cache table |
| Demo Generation ohne Cache | $0.10 pro Call | Reuse existing demos |

---

---

## 🎯 Conversion Learnings

### Email Subject Lines

| Subject Line Pattern | CTR | Sample Size | Status |
|---------------------|-----|-------------|--------|
| "[Name], your [Business] reviews need help" | TBD | - | Testing |
| "⭐ [Rating] stars for [Business]" | TBD | - | Testing |
| "Quick question about [Business]" | TBD | - | Testing |

### Best Converting Tactics

_Noch keine Daten - wird nach ersten Conversions gefüllt_

### Discount Effectiveness

| Discount | Conversion Rate | Context | Notes |
|----------|----------------|---------|-------|
| 0% | TBD | Cold Email | Baseline |
| 20% | TBD | Follow-Up 2 | - |
| 30% | TBD | Limit Hit | - |

---

## 🏙️ City Performance

| Stadt | Leads | Emails | Clicks | CTR | Notes |
|-------|-------|--------|--------|-----|-------|
| Miami | High | High | Good | ~4% | Top Performer |
| New York | High | High | Good | ~4% | Top Performer |
| Boston | Medium | Medium | Good | Good | Personal Emails found |
| Denver | Medium | Medium | TBD | TBD | Recently added |
| Amsterdam | Medium | Medium | TBD | TBD | EU Market |
| Munich | Medium | Medium | Good | Good | German Market |

### Tier 1 Cities (Focus hier):
Miami, New York, Los Angeles, Chicago, Denver

### Tier 2 Cities (Gut):
Boston, Austin, Seattle, San Francisco, Las Vegas

### EU Cities (wenn DE/EN Content):
London, Amsterdam, Munich, Berlin, Paris

---

## ⏰ Timing Learnings

### Best Send Times (UTC)
- Cold Emails: TBD
- Follow-Ups: TBD
- Upgrade Nudges: TBD

### Response Patterns
_Noch keine Daten_

---

## 🚫 Anti-Patterns (Was NICHT funktioniert)

### Email
- _TBD nach ersten Daten_

### Conversion
- _TBD nach ersten Daten_

### Scraping
- _TBD nach ersten Daten_

---

## 💡 Hypothesen zu testen

1. **H1:** Deutsche Restaurants konvertieren besser als englische
   - Status: Nicht getestet
   - Daten benötigt: 50+ Conversions

2. **H2:** Follow-Up nach 24h ist besser als nach 48h
   - Status: **TEILWEISE BESTÄTIGT**
   - Evidence: Magic Links nach 24h = 10 Registrierungen
   - Next: A/B Test mit 12h vs 24h vs 48h

3. **H3:** Demo-Link im Subject erhöht CTR
   - Status: Nicht getestet
   - Daten benötigt: A/B Test

4. **H4:** Star Rating Emoji ⭐ in Subject erhöht CTR
   - Status: **BESTÄTIGT**
   - Evidence: +100% CTR vs ohne (14.01 A/B Test)
   - Action: IMMER ⭐ in Subject nutzen

5. **H5:** Magic Link > Password für Hot Leads
   - Status: **BESTÄTIGT**
   - Evidence: 10 Registrierungen in 1 Nacht
   - Action: Magic Links für alle Clicker

6. **H6:** Personalisierte Demo > Generic Demo
   - Status: Implizit bestätigt
   - Evidence: Demo mit echten Reviews + AI = Engagement
   - Next: Track demo_view_count → conversion

## 📊 CURRENT METRICS BASELINE (16.01.2026)

> Für Burst-9 zum Vergleichen

| Metric | Current | Goal | Gap |
|--------|---------|------|-----|
| Total Leads | ~2000 | 5000 | 3000 |
| Leads with Email | ~500 | 2000 | 1500 |
| Emails Sent | ~650 | 2000 | 1350 |
| Email CTR | ~4% | 5% | 1% |
| Registrations | 32 | 100 | 68 |
| Paying Users | 0 | 30 | 30 |
| MRR | $0 | $1000 | $1000 |

**CRITICAL GAP:** 32 Registrations, 0 Paying
- Magic Links bringen Registrations aber keine Conversions
- Users registrieren sich aber nutzen Produkt nicht
- Nächster Fokus: Activation (User zum Product nutzen bringen)

---

## 📊 Pattern Recognition Log

### [Template für neues Learning]

```markdown
## Learning [Datum] - [Titel]

**Beobachtung:** [Was hast du gesehen?]
**Daten:** [Konkrete Zahlen]
**Hypothese:** [Warum passiert das?]
**Empfehlung:** [Was sollten Agents anders machen?]
**Angewendet von:** [Welche Agents sollten das nutzen?]
**Ergebnis:** [Nach Anwendung - hat es funktioniert?]
```

---

## 🔄 Changelog

| Datum | Agent | Learning | Impact |
|-------|-------|----------|--------|
| 2026-01-16 | Setup | Initial template created | - |

---

*Diese Datei wird von Burst-9 (Doctor) gepflegt und von allen Agents gelesen.*

### [2026-01-15 14:09] Burst-3
- Burst-3 correctly recognized PAUSED status from current-focus.json and stopped - System priority works


### [2026-01-15 14:27] Burst-12
- Activation stagnation (34%): Nudge-cron finds 0 users because Magic Link users don't know they have accounts. Need different approach: urgency emails about expiring demos, or friction reduction on login.

### [2026-01-15 14:34] Burst-2
- **POST /api/outreach/send-emails** is the correct endpoint for cold email batch sending
- Campaign "main" has 50/day limit, works great for automated outreach
- Sent 50 emails in 4 batches (5+15+20+10) - all successful, 0% bounce
- Global 100/day limit shared across all email types
- **NO DISCOUNT in cold emails** - only value (demo links) - CRITICAL


### [2026-01-15 14:29] Burst-13
- Burst-13 correctly paused - 0 paying users means 0 churn risk. Activation (Burst-6) is the real bottleneck.


### [2026-01-15 16:30] Burst-4 - CRITICAL FINDING
- **LinkedIn demo endpoint `/api/outreach/linkedin-demo` works reliably**
- Other endpoints fail with "No reviews" error:
  - `/api/admin/send-hot-lead-demos` → 0 demos (all "No reviews")
  - `/api/cron/generate-demos` → 0 demos
- **Root cause:** LinkedIn endpoint uses different Google Places lookup flow
- **Solution:** Use LinkedIn endpoint for ALL demo generation tasks
- **Result:** 25 demos generated in 1 session vs 0 with other endpoints
- **Cost:** ~$0.08 per demo (AI responses + Google Places API)
- **Recommendation for future:** Fix other endpoints or redirect to LinkedIn endpoint


### [2026-01-15 15:24] Burst-12
- Autonomes Handeln: reengage-clickers Endpoint sendet Magic Links an Clicker ohne Account. 8 Emails erfolgreich gesendet. Demo-Expiry braucht 3+ Tage alte Demos.


### [2026-01-15 15:26] Burst-14
- Scoring Model v2: Klick=+25, Personal Email=+10, Hotel/Restaurant Bonus=+5. 31.6% der Clickers sind Hot (Score 75+). Höchster Score: 88 (AWAY SPA Edinburgh).


### [2026-01-15 20:30] Burst-9 - CRITICAL PATTERN: Magic Click ≠ Conversion

**Beobachtung:** Magic Link Clicks konvertieren NICHT zu Zahlungen
**Daten:**
- 68 Magic Links gesendet
- 35 geklickt (51% CTR - SEHR GUT!)
- 0 Conversions (0%)
- 66% der User (29/44) haben 0 Responses generiert
- 0 User am 20-Response-Limit

**Root Cause:** ACTIVATION ist der Bottleneck!
User klicken Magic Link → werden registriert → nutzen Produkt NIE → erreichen nie Limit → kein Grund zu zahlen

**Empfehlung:**
1. PAUSE Lead Generation (2125 Leads = genug)
2. PRIORITY 1: User Activation via Onboarding Emails
3. DANN: Payment Conversion (wenn User Limit erreichen)

**Metriken Update:**
- CTR jetzt 5.0% (vs 4% Baseline) - Lead Gen funktioniert!
- Problem ist downstream: Activation → Limit → Payment


### [2026-01-15 15:30] Burst-9
- CTR ist 5% (gut!) - Problem ist Activation: 66% User nutzen Produkt nie, 0 am Limit

### [2026-01-15 15:37] Burst-15 (Approval Gate)
- **First Approval Processed:** Burst-12 Strategy Proposal
- **Berend Response:** "handle immer autonom" = Standard-Strategien brauchen keine Einzelfreigabe
- **Actions Taken:** 8 Magic Link Re-Engagement Emails gesendet
- **Learning:** Berend vertraut den Agents für Standard-Marketing-Strategien
- **Für Zukunft:** Nur wirklich kritische Entscheidungen (>30% Discount, First Conversion) brauchen explizite Approval


### [2026-01-15 15:41] Burst-8
- Burst-8 Check 15.01: 0 paying users, 0 upgrade candidates. Highest Free user at 6/20 (30%). Upgrade function not needed until Burst-7 converts first customers.


### [2026-01-15 15:42] Burst-6
- Activation rate 33.3% erreicht (Ziel >30%), aber 0 User am Limit. Die 6 User mit 5-9 Responses sind kritisch - brauchen Encouragement weiterzumachen um Limit zu erreichen.


### [2026-01-15 15:44] Burst-5
- 46% der Clicker (19/41) registrieren sich aber nutzen Produkt nicht - Handoff an Burst-6 statt mehr Follow-Ups


### [2026-01-15 16:09] Burst-12
- Zwei verschiedene Activation-Probleme identifiziert: (1) 66% komplett dormant - brauchen Magic Links, (2) 6 User mit 5-9 Responses stoppen zu frueh - brauchen Encouragement. Unterschiedliche Strategien fuer unterschiedliche Segmente!


### [2026-01-15 16:46] Burst-4
- Session COMPLETE: 49 Demos fuer alle 41 Hot Leads generiert. API Cost .20. LinkedIn-Endpoint ist zuverlaessig!


### [2026-01-15 16:56] Burst-1
- Hunter.io findet keine Emails für kleine Coffee Shops - Night-Blast mit Website-Scraping ist effektiver


### [2026-01-15 20:31] Burst-5
- Magic Link Tracking: created_via_magic_link zeigt 0 weil Spalte erst 15.01 hinzugefuegt. Workaround: Cross-Reference clicker_followups mit users Tabelle


### [2026-01-15 21:34] Burst-3
- Burst-3 correctly paused - Focus is on Activation (78% dormant users). Social DMs should only run when Activation bottleneck is resolved and we need more leads again.


### [2026-01-15 21:35] Burst-1
- Burst-1 paused: First Principles shows activation is bottleneck. 2000+ leads but 78%% never use product. Resume when activation rate > 50%% or 5+ users at limit.


### [2026-01-15 21:36] Burst-3
- Burst-3 correctly recognized PAUSED status from current-focus.json and stopped - System priority works (16.01.2026)


### [2026-01-15 21:36] Burst-1
- Selbstregulierung funktioniert: Burst-1 respektierte Priority 3 PAUSED Status - 2234 Leads sind genug, Activation ist der echte Bottleneck


### [2026-01-15 21:38] Burst-2
- 16.01 21:37: Alle 886 Leads mit Email kontaktiert. Nur 8 unkontaktierte verbleibend. Brauche neue Leads von Burst-1 mit Email-Adressen.


### [2026-01-15 21:38] Burst-8
- Burst-8 Check 16.01: 0 echte paying users (nur 1 Test Account). Höchster Free User bei 6/20 (30%). Upgrade-Agent hat KEINE ARBEIT bis Burst-7 erste Kunden konvertiert. PAUSED.


### [2026-01-15 21:38] Burst-13
- Burst-13 Check 16.01 02:37 UTC: Still 0 paying users. Churn Prevention remains irrelevant until Burst-7 converts first customer. Funnel: 38 users, 26 never used, 12 active, 0 at limit, 0 paying. Will resume when first payment happens.


### [2026-01-15 21:39] Burst-11
- Activation Rate verbesserte sich von 21.9% auf 31.6% zwischen 15:30 und 22:00 UTC (+9.7pp). Aber 0% Paying weil NIEMAND das Free Limit von 20 erreicht hat. Höchste Usage: 6 Responses. Priorität: Activation weiter steigern, dann Free Limit überdenken.


### [2026-01-15 21:39] Burst-6
- Die meisten medium_usage User (5-9 Responses) sind Test-Accounts. Echte Business-User starten bei 0 und brauchen Activation-Emails.

