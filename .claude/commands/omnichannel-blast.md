# Omnichannel Demo Blast

**Ziel:** Demo-URLs über ALLE Social Media Kanäle senden.

**🌐 CHROME MCP: JA** - Startet mit `claude --chrome`

---

## Quick Start (vom Handy via AnyDesk)

1. AnyDesk öffnen → PC verbinden
2. Terminal öffnen
3. `claude --chrome`
4. `/omnichannel-blast`

Das war's. Claude macht den Rest.

---

## Was passiert automatisch

1. **Leads holen** - Alle mit Demo + Social Links aber noch keine DM
2. **Für jeden Lead:**
   - Twitter DM senden (wenn Handle vorhanden)
   - Facebook Message senden (wenn Page vorhanden)
   - Instagram DM senden (wenn Handle vorhanden)
   - Als kontaktiert markieren
3. **Stats zeigen** - Wie viele DMs gesendet

---

## Ablauf im Detail

### Schritt 1: Leads mit Social Links holen

```bash
curl -s "https://review-responder.onrender.com/api/admin/leads-for-omnichannel?key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"
```

Die Social Links wurden bereits vom Night Blast (Phase 9) gescraped!

### Schritt 2: DMs senden (Chrome MCP)

**Twitter DM:**
1. `navigate` zu `twitter.com/messages`
2. "New Message" klicken
3. Handle suchen (z.B. @mariospizza)
4. Message senden:

```
Hey! 👋

Hab was für [BUSINESS_NAME] gebaut:
[DEMO_URL]

3 AI-Antworten auf eure echten Google Reviews.
Kostenlos, einfach mal anschauen.

Berend
```

**Facebook Messenger:**
1. `navigate` zu `facebook.com/[page]`
2. "Message" Button klicken
3. Gleiche Message senden

**Instagram DM:**
1. `navigate` zu `instagram.com/[handle]`
2. "Message" Button klicken
3. Gleiche Message senden

### Schritt 3: Als kontaktiert markieren

```bash
curl -X PUT "https://review-responder.onrender.com/api/admin/mark-channel-contacted" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U" \
  -d '{"lead_id": 123, "channel": "twitter"}'
```

---

## Message Templates

### Deutsch (DE/AT/CH Städte)
```
Hey! 👋

Hab was für [BUSINESS_NAME] gebaut:
[DEMO_URL]

3 AI-Antworten auf eure echten Google Reviews.
Kostenlos, einfach mal anschauen.

Berend
```

### English
```
Hey! 👋

Built something for [BUSINESS_NAME]:
[DEMO_URL]

3 AI responses to your actual Google reviews.
Free to check out.

Berend
```

---

## Rate Limits - WICHTIG!

| Platform | Tägliches Limit | Max senden |
|----------|-----------------|------------|
| Twitter  | ~50/Tag | 30 |
| Facebook | ~25/Tag | 20 |
| Instagram | ~30/Tag | 20 |

**Bei JEDER Warnung oder Captcha → SOFORT STOPPEN!**

---

## Der komplette Nacht-Flow

```
22:00  Night Blast startet automatisch (Server)
       → Phase 1-8: Leads, Emails, Demos, Follow-ups
       → Phase 9: Social Links scrapen

~23:00 Du (via AnyDesk vom Handy):
       → claude --chrome
       → /omnichannel-blast
       → Claude sendet DMs
       → Fertig, schlafen gehen
```

---

## Channel-spezifisch starten

Nur einen Kanal machen:
- `/omnichannel-blast --channel=twitter`
- `/omnichannel-blast --channel=facebook`
- `/omnichannel-blast --channel=instagram`

Oder alle parallel (3 Terminals):
```powershell
# Terminal 1
$env:CLAUDE_SESSION = "Twitter"
claude --chrome
# /omnichannel-blast --channel=twitter

# Terminal 2
$env:CLAUDE_SESSION = "Facebook"
claude --chrome
# /omnichannel-blast --channel=facebook

# Terminal 3
$env:CLAUDE_SESSION = "Instagram"
claude --chrome
# /omnichannel-blast --channel=instagram
```

---

## Stats checken

```bash
curl "https://review-responder.onrender.com/api/admin/omnichannel-stats?key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"
```

Zeigt:
- Leads mit Demos
- Social Links gefunden (pro Plattform)
- DMs gesendet (pro Kanal)
- Potential Reach (noch nicht kontaktiert)
