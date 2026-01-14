# Sales Automatisierung mit Claude Superpowers

**OUTPUT-REGEL:** Kurze, kompakte Pläne. Keine langen Tabellen. Max 3-5 Bullet Points pro Sektion.

---

## SCHRITT 0: ADMIN DASHBOARD CHECK (AUTOMATISCH!)

**ZUERST API Key holen und alle Status-Endpoints checken:**

```bash
# 1. Key holen
cat .claude/secrets.local

# 2. Scraper-Status checken (Lead-Quellen)
curl -s -H "X-Admin-Key: KEY" "https://review-responder.onrender.com/api/admin/scraper-status"

# 3. Automation Health checken
curl -s "https://review-responder.onrender.com/api/admin/automation-health?key=KEY"
```

**AUTOMATISCHE LEAD-GENERIERUNG wenn noetig:**

| Status | Aktion |
|--------|--------|
| `critical` | SOFORT Leads generieren (< 10-15 Leads) |
| `low` | Heute noch Leads generieren (< 20-30 Leads) |
| `healthy` | Nichts tun |

**Wenn manuelle Quellen kritisch/low sind:**
1. Scraper-Command aus Response nutzen (steht bei jeder Quelle)
2. Chrome MCP starten wenn Scraper Browser braucht
3. Nach Scraping: Status erneut pruefen

**WICHTIG:** Autonome Systeme (Daily Outreach, Drip Emails) brauchen Leads zum Funktionieren!

---

## SCHRITT 1: ZEIT-AWARENESS

**BEVOR du Panik schiebst oder Aenderungen vorschlaegst:**

1. **Wann gestartet?** Check `last_reset` oder erste Email-Timestamps
2. **Realistische Timelines:**
   - Cold Email: 7-14 Tage bis erste Antworten
   - Follow-ups: Wirken ab Tag 5-7
   - Conversions: Fruehestens nach 2-3 Wochen
3. **Wenn < 7 Tage:** System laeuft → NICHT anfassen, nur beobachten
4. **Wenn < 14 Tage:** Nur kleine Tweaks, keine grossen Aenderungen

**REGEL:** Keine Panik bei niedrigen Zahlen wenn System erst kurz laeuft!

---

## SCHRITT 2: OUTREACH-STATS HOLEN

```bash
# Outreach Dashboard (Emails, Opens, Clicks)
curl -s "https://review-responder.onrender.com/api/outreach/dashboard?key=KEY"

# Admin Stats (User, Revenue)
curl -s -H "X-Admin-Key: KEY" "https://review-responder.onrender.com/api/admin/stats"
```

---

## SCHRITT 3: QUICK ANALYSIS (3 Saetze max)

- **Funnel:** X User, Y Paying, Z% Conversion
- **Outreach:** X Leads, Y% Open, Z% Click
- **Bottleneck:** [Der EINE Engpass]

---

## SCHRITT 4: FIRST-PRINCIPLES (Kompakt!)

**5x Warum → Root Cause:**
> Warum kauft niemand? → [1 Satz Antwort]

**Annahme zerstoeren:**
> [1 Annahme die FALSCH sein koennte]

---

## SCHRITT 5: TOP 3 IDEEN

Nur Ideen die den Kunden-Filter bestehen:
1. **[Idee]** - Weil Kunde X will
2. **[Idee]** - Weil Kunde Y braucht
3. **[Idee]** - Weil es Problem Z loest

**ANTI-PATTERNS (nie vorschlagen):**
- Branding auf Kunden-Content
- Mehr Spam statt bessere Emails
- Features ohne Kunden-Feedback

---

## SCHRITT 6: EXECUTION (Max 3 Tasks)

- [ ] **Task 1:** ...
- [ ] **Task 2:** ...
- [ ] **Task 3:** ...

**Erfolgsmetrik:** [1 Zahl die wir verbessern wollen]

---

## KONTEXT

- **Ziel:** $1000/Mo (30 Kunden)
- **Status:** Product-Market-Fit noch nicht validiert
- **Regel:** Keine Skalierung vor erstem zahlenden Kunden
