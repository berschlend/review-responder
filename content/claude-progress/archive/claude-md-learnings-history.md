# CLAUDE.md Learnings History

> Archivierte Learnings aus CLAUDE.md. Fuer aktive Rules siehe `.claude/rules/`.
> Diese Datei wird nicht aktiv gelesen, nur fuer historische Referenz.

---

## 18.01.2026

### Chrome MCP Parallele Sessions Klarstellung
- **Problem:** CLAUDE.md implizierte Einschraenkung bei parallelen Sessions
- **Korrektur:** Parallele Browser-Agents SIND moeglich
- **Wann sequentiell?** NUR bei RAM-Ueberlastung

---

## 17.01.2026

### Demo Page Unlock + Auto-Account
- **Problem:** User wurde zu /register redirected BEVOR Responses sichtbar
- **Fix:** `handleEmailCapture()` zeigt sofort alle Responses + Auto-Account

### /marketing Skill mit Claudius Guard
- 7-Punkte Checklist vor JEDER Marketing-Aktion
- Discount Decision Tree basierend auf Project Vend

### First Principles Analyse Korrektur
- 47 Homepage-Clicks waren von ALTEN Emails
- Letzte 20 Clicks zeigen 95% zu Demo-Pages

### Night-Burst System Reboot
- 29% Activation Rate war FAKE (Test-Accounts)
- Echtes Problem: OUTREACH -> FIRST USE

### AI Kritik-Handling First Principles
- 2-3 Saetze = souveraen (nicht 4-5)
- Ownership-Words > Empathy-Words

### Demo Email Bug
- 97% der Demos nie gesendet (send_emails Default false)

### Magic Link Activation
- 0% Activation weil Redirect zu /dashboard statt /generator

### Night-Burst-2 API Endpoints
- Dokumentierte Endpoints existierten nicht

---

## 16.01.2026

### Burst-15 Approval Gate Pattern
- 5-min Loop bei leerer Queue = Ressourcenverschwendung

### Burst-12 Creative Strategist
- A/B Testing erst relevant bei >5 zahlenden Kunden

### Demo Generation API
- `focus: "mixed"` fuer nur positive Reviews
- City ohne Laenderkuerzel

### Ralph-Loop Hook-Loop Bug
- Hooks-Ordner umbenennen zu hooks.disabled

### AnyDesk Remote Access
- HDMI Dummy Plug fuer Laptop mit zugeklapptem Deckel

### Discount Code Validation
- CLICKER30 war nie implementiert

### Rate-Limit Bypass
- JWT Token in /api/public/try optional pruefen

### Frontend Build Crash
- Bei "weisse Seite" Browser Console checken

### API_BASE vs API_URL
- API_URL enthaelt schon /api

### Public Stats Endpoint
- Multi-Table Queries: individual error handling

---

## Evergreen Learnings

### Email Deliverability
- "Hey" statt "Hallo"
- HTML mit CTA-Button > Plain Text
- FRONTEND_URL MUSS Fallback haben

### API Limits
- SerpAPI: UEBER LIMIT - Cache nutzen
- Fallback: Cache -> Outscraper -> SerpAPI

### AI Response Qualitaet
- Blacklist: "Thank you for your feedback", "We appreciate..."

### DB-Schema
- outreach_leads.status ist VARCHAR (nicht BOOLEAN)
- users hat KEIN last_login Feld

---

*Archived: 18.01.2026*
