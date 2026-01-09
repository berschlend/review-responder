# Claude Code Orchestration Prompts

Diese Datei enthält detaillierte Prompts für parallele Claude Code Sessions.
Jeder Prompt kann im Plan-Modus ausgeführt werden.

---

## TASK 1: Team/Multi-User Accounts (Schwer)

### Prompt für Claude Code Session:

```
# Task: Team/Multi-User Accounts implementieren

## Kontext
Du arbeitest am ReviewResponder Projekt - einer SaaS-App für KI-generierte Review-Antworten.
Lies zuerst MEMORY.md für den vollständigen Kontext.

## Vorarbeit (bereits vorhanden)
Die Datenbank-Tabelle `team_members` existiert bereits in `backend/server.js`:
- team_owner_id, member_email, member_user_id, role, invite_token, invited_at, accepted_at

## Deine Aufgabe
Implementiere ein vollständiges Team-Management-System:

### Backend (server.js) - Neue Endpoints:

1. `GET /api/team/members` - Alle Team-Mitglieder des Users abrufen
   - Nur für Pro/Unlimited Pläne
   - Return: Liste der Mitglieder mit Status (invited/accepted)

2. `POST /api/team/invite` - Team-Mitglied einladen
   - Body: { email, role }
   - Generiere invite_token
   - Sende Einladungs-Email via Resend
   - Limit: Starter=0, Pro=3, Unlimited=10 Team-Mitglieder

3. `POST /api/team/accept/:token` - Einladung annehmen
   - Validiere Token
   - Verknüpfe member_user_id mit bestehendem oder neuem Account
   - Setze accepted_at

4. `DELETE /api/team/members/:id` - Mitglied entfernen
   - Nur Owner kann entfernen

5. `PUT /api/team/members/:id/role` - Rolle ändern
   - Rollen: 'admin', 'member', 'viewer'

### Frontend (App.js) - Neue UI:

1. **Team Settings Tab** im Dashboard
   - Liste aller Team-Mitglieder
   - Invite-Button mit Email-Eingabe
   - Rollen-Dropdown (Admin/Member/Viewer)
   - Remove-Button

2. **Einladungs-Annahme Seite** `/team/invite/:token`
   - Zeige wer einlädt
   - Register/Login wenn nicht eingeloggt
   - Automatische Team-Verknüpfung

3. **Shared Usage**
   - Team-Mitglieder teilen das Response-Limit des Owners
   - Zeige "Team Usage" statt "Your Usage" für Team-Accounts

### Berechtigungen pro Rolle:
- **Owner**: Alles (Billing, Team-Management, Responses)
- **Admin**: Responses generieren, History sehen, Settings ändern
- **Member**: Responses generieren, eigene History sehen
- **Viewer**: Nur History ansehen (read-only)

### Tests nach Implementation:
1. Pro-User kann 3 Mitglieder einladen
2. Einladungs-Email wird gesendet
3. Eingeladener kann annehmen und Responses generieren
4. Usage wird vom Team-Owner abgezogen
5. Owner kann Mitglied entfernen

## Wichtig
- Nutze die bestehende `team_members` Tabelle
- Keine neuen npm packages nötig
- Teste lokal vor dem Commit
- Update MEMORY.md nach Fertigstellung
```

---

## TASK 2: SEO Blog Artikel Generator (Mittel)

### Prompt für Claude Code Session:

```
# Task: SEO Blog Artikel Generator implementieren

## Kontext
Du arbeitest am ReviewResponder Projekt - einer SaaS-App für KI-generierte Review-Antworten.
Lies zuerst MEMORY.md für den vollständigen Kontext.

## Deine Aufgabe
Erstelle ein Feature, das SEO-optimierte Blog-Artikel über Review-Management generiert.

### Backend (server.js) - Neue Endpoints:

1. `POST /api/blog/generate` - Blog-Artikel generieren
   - Body: { topic, keywords, length, tone }
   - Topics: "Wie man auf negative Reviews antwortet", "Review-Management Best Practices", etc.
   - Nutze GPT-4o-mini mit SEO-optimiertem Prompt
   - Nur für Pro/Unlimited Pläne
   - Return: { title, content, metaDescription, suggestedTags }

2. `GET /api/blog/topics` - Vorgefertigte Topic-Vorschläge
   - 10-15 SEO-relevante Topics rund um Review-Management
   - Mit Keyword-Vorschlägen

3. `GET /api/blog/history` - Generierte Artikel abrufen
   - Paginiert
   - Nur eigene Artikel

4. `DELETE /api/blog/:id` - Artikel löschen

### Neue Datenbank-Tabelle:
```sql
CREATE TABLE IF NOT EXISTS blog_articles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  keywords TEXT,
  topic TEXT,
  word_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Frontend (App.js) - Neue UI:

1. **Blog Generator Tab** im Dashboard (nur Pro/Unlimited)
   - Topic-Auswahl (Dropdown + Custom Input)
   - Keyword-Eingabe (Komma-separiert)
   - Länge-Slider (500-2000 Wörter)
   - Tone-Auswahl (Informativ, Überzeugend, Casual)
   - "Generate Article" Button

2. **Artikel-Vorschau**
   - Markdown-Rendering des Artikels
   - Copy-to-Clipboard Button
   - Download als .md oder .txt
   - Meta-Description Anzeige
   - Word Count

3. **Artikel-History**
   - Liste generierter Artikel
   - Click zum erneuten Anzeigen
   - Delete Button

### GPT Prompt für Artikel-Generierung:
```
Du bist ein SEO-Experte und Content-Writer. Schreibe einen Blog-Artikel zum Thema:
"{topic}"

Keywords die natürlich eingebaut werden sollen: {keywords}

Anforderungen:
- Länge: ca. {length} Wörter
- Ton: {tone}
- SEO-optimiert mit H1, H2, H3 Struktur
- Bullet Points für bessere Lesbarkeit
- Actionable Tips
- Interne Verlinkungsmöglichkeiten erwähnen
- Call-to-Action am Ende

Format: Markdown

Zusätzlich generiere:
1. Eine Meta-Description (max 160 Zeichen)
2. 5 vorgeschlagene Tags
```

### Tests nach Implementation:
1. Pro-User kann Artikel generieren
2. Artikel wird in History gespeichert
3. Copy-to-Clipboard funktioniert
4. Download als .md funktioniert
5. Free/Starter User sehen Upgrade-Prompt

## Wichtig
- Keine neuen npm packages nötig (Markdown kann mit CSS gestylt werden)
- Artikel zählen NICHT gegen Response-Limit (separates Feature)
- Teste lokal vor dem Commit
- Update MEMORY.md nach Fertigstellung
```

---

## TASK 3: API Key System für Entwickler (Mittel)

### Prompt für Claude Code Session:

```
# Task: API Key Management UI implementieren

## Kontext
Du arbeitest am ReviewResponder Projekt - einer SaaS-App für KI-generierte Review-Antworten.
Lies zuerst MEMORY.md für den vollständigen Kontext.

## Vorarbeit (bereits vorhanden)
Das Backend hat bereits:
- `api_keys` Tabelle mit: key_hash, key_prefix, name, requests_today, requests_total, is_active
- `authenticateApiKey` Middleware die X-API-Key Header prüft
- Rate Limit: 100 requests/Tag
- Nur für Unlimited-Plan verfügbar

## Deine Aufgabe
Implementiere die fehlenden API-Endpoints und das Frontend für API Key Management.

### Backend (server.js) - Neue Endpoints:

1. `GET /api/developer/keys` - Alle API Keys des Users abrufen
   - Return: [{ id, name, keyPrefix, requestsToday, requestsTotal, isActive, createdAt }]
   - Nur für Unlimited-Plan

2. `POST /api/developer/keys` - Neuen API Key erstellen
   - Body: { name }
   - Generiere sicheren Key: `rr_live_` + 32 random bytes (hex)
   - Speichere nur Hash in DB
   - Return: { key, keyPrefix, name } - Key wird nur einmal gezeigt!
   - Max 5 Keys pro User

3. `PUT /api/developer/keys/:id` - Key umbenennen oder deaktivieren
   - Body: { name?, isActive? }

4. `DELETE /api/developer/keys/:id` - Key löschen (unwiderruflich)

5. `POST /api/v1/generate` - Public API Endpoint (bereits teilweise vorhanden)
   - Auth: X-API-Key Header
   - Body: { reviewText, reviewRating?, platform?, tone? }
   - Return: { response, remaining_requests }

### Frontend (App.js) - Neue UI:

1. **Developer/API Tab** im Dashboard (nur Unlimited)
   - Erklärungstext: "Integrate ReviewResponder into your own apps"
   - Liste aller API Keys mit:
     - Name (editierbar)
     - Key Prefix (rr_live_xxxx...)
     - Requests today / Total
     - Active/Inactive Toggle
     - Delete Button

2. **Create API Key Modal**
   - Name Input
   - Generate Button
   - **WICHTIG**: Zeige Full Key nur einmal mit Copy Button
   - Warning: "This key will only be shown once. Save it securely!"

3. **API Documentation Section**
   - Quick Start Code Examples (curl, JavaScript, Python)
   - Endpoint Reference
   - Rate Limits Info
   - Error Codes

### Code Examples für Dokumentation:

**cURL:**
```bash
curl -X POST https://review-responder.onrender.com/api/v1/generate \
  -H "X-API-Key: rr_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"reviewText": "Great service!", "tone": "professional"}'
```

**JavaScript:**
```javascript
const response = await fetch('https://review-responder.onrender.com/api/v1/generate', {
  method: 'POST',
  headers: {
    'X-API-Key': 'rr_live_your_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reviewText: 'Great service!',
    tone: 'professional'
  })
});
const data = await response.json();
console.log(data.response);
```

**Python:**
```python
import requests

response = requests.post(
    'https://review-responder.onrender.com/api/v1/generate',
    headers={'X-API-Key': 'rr_live_your_key_here'},
    json={'reviewText': 'Great service!', 'tone': 'professional'}
)
print(response.json()['response'])
```

### Tests nach Implementation:
1. Unlimited-User kann API Key erstellen
2. Key wird nur einmal angezeigt
3. API Request mit Key funktioniert
4. Rate Limit (100/Tag) wird enforced
5. Deaktivierter Key wird rejected
6. Non-Unlimited User sieht Upgrade-Prompt

## Wichtig
- Nutze crypto.randomBytes für Key-Generierung
- Speichere nur SHA-256 Hash in DB (Sicherheit!)
- Key Format: rr_live_ + 64 hex chars
- Teste lokal vor dem Commit
- Update MEMORY.md nach Fertigstellung
```

---

## Ausführungsreihenfolge (Empfehlung)

1. **Task 3: API Key System** - Am einfachsten, Grundstruktur existiert bereits
2. **Task 2: SEO Blog Generator** - Unabhängiges Feature, mittlerer Aufwand
3. **Task 1: Team/Multi-User** - Komplex, viele Edge Cases

## Parallele Ausführung

Tasks 2 und 3 können parallel von verschiedenen Claude Code Sessions bearbeitet werden, da sie unabhängig voneinander sind. Task 1 sollte separat gemacht werden.

---

## Nach Fertigstellung

Jede Session sollte:
1. Code testen
2. `git add -A && git commit -m "Feature: [Name]" && git push`
3. MEMORY.md updaten mit:
   - Task als ✅ markieren
   - Neue Endpoints dokumentieren
   - Eventuelle Bugs notieren
