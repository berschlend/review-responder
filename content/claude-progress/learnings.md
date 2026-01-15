# 📚 Night-Burst Learnings Database

> Zentrale Wissensbasis für alle Agents. Hier dokumentieren wir was funktioniert und was nicht.
> **PFLICHT:** Jeder Agent liest diese Datei JEDEN Loop!
> **NEU V3.1:** Jetzt mit echten Daten basierend auf 5 Tagen Operation!

---

## 🔴 CRITICAL RULES (Sofort anwenden!)

| Rule | Warum | Gelernt am |
|------|-------|------------|
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
