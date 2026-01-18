# Demo Rules (Auto-loaded for: Burst-4 Demo Generator)

> Demo Generation, Business-Namen, Email Rules

---

## Demo Generation API

### Endpoint
```
POST /api/demo/generate
Content-Type: application/json

{
  "businessName": "Exact Name like on Google Maps",
  "city": "Munich",  // NO country code!
  "focus": "mixed"   // Use for positive-only businesses
}
```

### Common Errors

| Error | Ursache | Fix |
|-------|---------|-----|
| "Could not find business" | Name nicht exakt | Exakt wie auf Google Maps |
| "0 responses generated" | Nur 5-Sterne Reviews | `focus: "mixed"` nutzen |
| "No reviews found" | Falscher City-Name | Ohne Laenderkuerzel |

### Business-Namen Format
- Exakt wie auf Google Maps schreiben
- City ohne Laenderkuerzel: "Munich" NICHT "Munich, Germany"
- Sonderzeichen beachten: "Joe's Pizza" nicht "Joes Pizza"

---

## Demo Email System

### Warum 97% der Demos nie ankamen (17.01 Bug)
- `/api/cron/generate-demos` hatte `send_emails` Default auf `false`
- FIX: Default jetzt `true` (send_emails !== 'false')

### Pending Demos senden
```bash
GET /api/cron/send-pending-demo-emails?secret=ADMIN_SECRET
# Findet alle Demos ohne email_sent_at
# Sendet Demo-Emails an zugehoerige Leads
# Parallel-safe mit wasEmailRecentlySent()
```

### Demo Email Template
- Subject: "See how AI would respond to [Business] reviews"
- CTA Button zu Demo-Page
- KEIN Preis, KEIN Discount in erster Email

---

## Demo Page Flow (17.01 Fix)

### Conversion Flow
1. User landet auf `/demo/[token]`
2. Sieht 2-3 AI Responses (geblurred)
3. Gibt Email ein
4. SOFORT: Alle Responses werden sichtbar
5. Auto-Account wird erstellt im Hintergrund
6. User ist eingeloggt, kann Dashboard nutzen

### KRITISCH: Flow darf NIE unterbrechen!
- User muss den Wert SEHEN bevor naechste Aktion
- KEIN Redirect zu /register bevor Responses sichtbar
- Welcome-Email mit Magic Link wird automatisch gesendet

---

## API Endpoints fuer Demos

### Generation
- `POST /api/demo/generate` - Neue Demo erstellen
- `GET /api/cron/generate-demos?secret=XXX` - Batch Generation
- `GET /api/cron/send-pending-demo-emails?secret=XXX` - Pending senden

### Tracking
- `GET /api/demo/:token` - Demo abrufen
- Click-Tracking automatisch bei Seitenaufruf

### Auto-Account
- `POST /api/auth/auto-create-demo-user` - Erstellt User nach Email-Eingabe
  - Random Password
  - Welcome-Email mit Magic Link
  - Demo-Conversion tracking
  - Business Name wird uebernommen

---

## Demo Follow-Up Sequence

| Tag | Email | Inhalt |
|-----|-------|--------|
| 0 | Demo Email | Link zur Demo-Page |
| 2 | FU #1 | "Did you see your responses?" |
| 5 | FU #2 | Mit DEMO20 Discount (max!) |
| 10 | FU #3 | Last chance, social proof |

---

## focus Parameter

| Wert | Wann nutzen |
|------|-------------|
| `"negative"` | Default - nur negative Reviews |
| `"mixed"` | Business hat nur 5-Sterne Reviews |
| `"all"` | Alle Reviews (selten noetig) |

---

## Demo = Echter User! (WICHTIG)

> **Demo-Generierung mit Email = Echter User**
>
> User die auf Demo-Seite generieren UND Email eingeben zählen als "echte User"
> (via `demo_generations` Tabelle mit `outreach_leads` JOIN).
>
> Das ist GUT - Demo-Wert demonstriert = Aktivierung erreicht!

---

## 🔴 CHROME MCP FALLBACK (Wenn APIs down!)

> **Wenn Outscraper/Serper/Google Places erschöpft sind:**
> Demo-Generation manuell via Chrome MCP!

### Wann Fallback nutzen?

| API Status | Aktion |
|------------|--------|
| Outscraper: "verify credit card" | → Chrome MCP |
| Serper: "Not enough credits" | → Chrome MCP |
| Google Places: "Place not found" | → Chrome MCP |
| Alle APIs OK | → Normal API nutzen |

### Chrome MCP Demo Workflow

```bash
# 1. Google Maps öffnen
mcp__playwright__browser_navigate({ url: "https://www.google.com/maps" })

# 2. Business suchen
# → Suchfeld finden, Business Name + City eingeben

# 3. Reviews Tab öffnen
# → Auf "Reviews" klicken

# 4. Reviews scrapen
# → read_page() für Review-Text
# → Screenshot für Evidence

# 5. Demo manuell erstellen
POST /api/demo/generate-manual
{
  "businessName": "...",
  "city": "...",
  "reviews": [
    { "text": "...", "rating": 4, "author": "..." },
    ...
  ]
}
```

### Quick Command
```
/generate-demo-chrome [Business Name] [City]
```

### Limitationen
- Langsamer als API (2-3 Min vs 10 Sek)
- Max 10-20 Reviews pro Scrape (Scroll-Limit)
- Nur für High-Value Leads nutzen!

### Priorität bei API-Ausfall

| Lead Score | Methode |
|------------|---------|
| 80+ (Super High) | Chrome MCP Fallback |
| 50-79 (High) | Warten auf API Fix |
| <50 | Skip bis APIs wieder da |

---

*Loaded by: Burst-4 (Demo Generator)*
