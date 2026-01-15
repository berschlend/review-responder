# Omnichannel Demo Blast

**Ziel:** Personalisierte Demo über ALLE verfügbaren Kanäle senden.

**🌐 CHROME MCP: JA** - Braucht Browser für Social Media

---

## Was dieses Skill macht

Für jeden Lead mit Demo:
1. **Social Links finden** (von Website scrapen)
2. **Demo über ALLE Kanäle senden:**
   - ✅ Email (bereits gesendet)
   - 🐦 Twitter/X DM
   - 📘 Facebook Messenger
   - 📸 Instagram DM
   - 💼 LinkedIn Message
   - 📍 Google Business Message

---

## Ablauf

### Schritt 1: Leads mit Demo aber ohne Multi-Channel holen

```bash
curl -s "https://review-responder.onrender.com/api/admin/leads-for-omnichannel?key=ADMIN_KEY"
```

Gibt zurück:
```json
{
  "leads": [
    {
      "id": 123,
      "business_name": "Mario's Pizza",
      "website": "https://mariospizza.com",
      "demo_url": "https://tryreviewresponder.com/demo/abc123",
      "email": "mario@pizza.com",
      "channels_contacted": { "email": true }
    }
  ]
}
```

### Schritt 2: Social Links scrapen (für jeden Lead)

1. **Chrome MCP öffnen:** `tabs_context_mcp` → neuen Tab erstellen
2. **Website besuchen:** `navigate` zu `lead.website`
3. **Social Links finden:** `find` nach "twitter", "facebook", "instagram", etc.
4. **Links extrahieren:** JavaScript ausführen um hrefs zu holen

```javascript
// Social Link Finder Script
const socialLinks = {};
const links = document.querySelectorAll('a[href]');
links.forEach(link => {
  const href = link.href.toLowerCase();
  if (href.includes('twitter.com/') || href.includes('x.com/')) {
    socialLinks.twitter = href;
  } else if (href.includes('facebook.com/')) {
    socialLinks.facebook = href;
  } else if (href.includes('instagram.com/')) {
    socialLinks.instagram = href;
  } else if (href.includes('linkedin.com/company/')) {
    socialLinks.linkedin = href;
  }
});
socialLinks;
```

### Schritt 3: Lead mit Social Links updaten

```bash
curl -X PUT "https://review-responder.onrender.com/api/admin/lead-social-links" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: ADMIN_KEY" \
  -d '{
    "lead_id": 123,
    "twitter_handle": "@mariospizza",
    "facebook_page": "facebook.com/mariospizza",
    "instagram_handle": "@mariospizza"
  }'
```

### Schritt 4: DMs senden (Chrome MCP)

**Twitter DM:**
1. Navigate zu `twitter.com/messages`
2. Klick "New Message"
3. Suche nach Handle
4. Sende Message:

```
Hey! 👋

Hab was Cooles für euch gebaut:
[DEMO_URL]

3 AI-Antworten für eure echten Google Reviews.
Kostenlos, einfach anschauen.

Berend
```

**Facebook Messenger:**
1. Navigate zu `facebook.com/[page]/`
2. Klick "Message" Button
3. Sende Message

**Instagram DM:**
1. Navigate zu `instagram.com/[handle]/`
2. Klick "Message" Button
3. Sende Message

### Schritt 5: Channel als kontaktiert markieren

```bash
curl -X PUT "https://review-responder.onrender.com/api/admin/mark-channel-contacted" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: ADMIN_KEY" \
  -d '{
    "lead_id": 123,
    "channel": "twitter",
    "sent_at": "2026-01-15T10:00:00Z"
  }'
```

---

## Message Templates

### Deutsch (für DE/AT/CH Städte)
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

## Parallel Execution (3 Claude Sessions)

Terminal 1: Twitter DMs
```powershell
$env:CLAUDE_SESSION = "Twitter"
claude --chrome
# Dann: /omnichannel-blast --channel=twitter
```

Terminal 2: Facebook Messenger
```powershell
$env:CLAUDE_SESSION = "Facebook"
claude --chrome
# Dann: /omnichannel-blast --channel=facebook
```

Terminal 3: Instagram DMs
```powershell
$env:CLAUDE_SESSION = "Instagram"
claude --chrome
# Dann: /omnichannel-blast --channel=instagram
```

---

## Rate Limits beachten!

| Platform | Limit | Empfehlung |
|----------|-------|------------|
| Twitter DMs | ~50/Tag | Max 30 senden |
| Facebook Messenger | ~25/Tag | Max 20 senden |
| Instagram DMs | ~30/Tag | Max 20 senden |
| LinkedIn Messages | ~25/Tag | Max 15 senden |

**WICHTIG:** Bei JEDER Warnung SOFORT STOPPEN!

---

## Erfolgsmessung

Nach 24h checken:
1. Wie viele DMs wurden gelesen?
2. Wie viele haben geantwortet?
3. Wie viele haben Demo angeschaut?
4. Conversions?

```bash
curl "https://review-responder.onrender.com/api/admin/omnichannel-stats?key=ADMIN_KEY"
```
