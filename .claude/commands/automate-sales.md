# Sales Automatisierung mit Claude Superpowers

**OUTPUT-REGEL:** Kurze, kompakte Plaene. Max 3-5 Bullet Points pro Sektion.

---

## SCHRITT 0: LIVE-DATEN HOLEN (IMMER ZUERST!)

**AUTOMATISCH am Anfang diese Daten holen:**

```
1. WebFetch: https://review-responder.onrender.com/api/outreach/dashboard?key=KEY
   → Zeigt: Leads, Emails, Clicks, Click-Rate, HOT LEADS (Clicker!)

2. KEY aus: .claude/secrets.local (ADMIN_SECRET)
```

**Dashboard zeigt jetzt:**
- `stats.total_leads` - Anzahl Leads
- `stats.emails_sent` - Gesendete Emails
- `stats.clicks` - Echte Klicks (gefiltert)
- `stats.click_rate` - Echte Click-Rate
- `hot_leads` - **WICHTIG: Liste der Businesses die geklickt haben!**
- `hot_leads_count` - Anzahl Hot Leads

**HINWEIS:** Open-Rate wurde entfernt - ist unzuverlaessig (Bot-Scans).
Click-Rate ist die einzige echte Metrik!

---

## SCHRITT 1: QUICK ANALYSIS (3 Saetze max)

- **Outreach:** X Leads, Y Emails, Z% Click-Rate
- **Hot Leads:** X Businesses haben geklickt (LISTE ZEIGEN!)
- **Bottleneck:** Clicks → Signups → Paid

---

## SCHRITT 2: HOT LEADS PRIORISIEREN

**Diese Leads haben ECHTES Interesse gezeigt:**

Aus `hot_leads` Array:
- Business Name, Stadt, Email
- Sortiert nach clicked_at (neueste zuerst)

**Aktionen fuer Hot Leads:**
1. Demo generieren (personalisiert)
2. Follow-Up Email mit Demo-Link
3. LinkedIn Connection Request

---

## SCHRITT 3: ZEIT-AWARENESS

**BEVOR du Panik schiebst:**

1. **Wann gestartet?** Check erste Email-Timestamps
2. **Realistische Timelines:**
   - Cold Email: 7-14 Tage bis erste Antworten
   - Conversions: Fruehestens nach 2-3 Wochen
3. **Wenn < 7 Tage:** NICHT anfassen, nur beobachten

---

## SCHRITT 4: FIRST-PRINCIPLES (Kompakt!)

**5x Warum → Root Cause:**
> Warum kauft niemand? → [1 Satz]

**Annahme zerstoeren:**
> [1 Annahme die FALSCH sein koennte]

---

## SCHRITT 5: TOP 3 IDEEN

1. **Hot Lead Follow-Up** - Die X Clicker direkt kontaktieren
2. **[Idee]** - Basierend auf Daten
3. **[Idee]** - Basierend auf Bottleneck

**ANTI-PATTERNS (nie vorschlagen):**
- Mehr Spam statt bessere Emails
- Features ohne Kunden-Feedback
- Panik-Aktionen bei < 7 Tage alten Daten

---

## SCHRITT 6: ONE THING

> Was ist der EINE naechste Schritt?

**Kleinster Test:** [1 Satz - was testen wir HEUTE]

---

## SCHRITT 7: EXECUTION (Max 3 Tasks)

- [ ] **Task 1:** Hot Leads kontaktieren
- [ ] **Task 2:** ...
- [ ] **Task 3:** ...

**Erfolgsmetrik:** [1 Zahl die wir verbessern wollen]

---

## KONTEXT

- **Ziel:** $1000/Mo (30 Kunden)
- **Status:** 0 zahlende Kunden, aber ~17 Hot Leads (Clicker)
- **Regel:** Hot Leads ZUERST, dann neue Leads
- **Echte Metrik:** Click-Rate (nicht Open-Rate!)
