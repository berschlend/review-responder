# ReviewResponder - Todo Liste

> Letzte Aktualisierung: 10.01.2026 - 01:30 Uhr

---

## 🔴 DRINGEND: Google Sign-In aktivieren (5 Min)

Der Code ist fertig deployed - nur noch Google Credentials erstellen!

### Schritt-für-Schritt:

- [ ] **1. Google Cloud Console öffnen**
  - https://console.cloud.google.com
  - Neues Projekt erstellen → Name: `ReviewResponder`

- [ ] **2. OAuth-Zustimmungsbildschirm**
  - Suche oben: "OAuth"
  - Klick auf "OAuth-Zustimmungsbildschirm"
  - Wähle: **Extern**
  - App-Name: `ReviewResponder`
  - Nutzer-Support-E-Mail: deine Email
  - Entwickler-E-Mail: deine Email
  - 3x "Speichern und fortfahren" klicken

- [ ] **3. OAuth Client-ID erstellen**
  - Links: "Anmeldedaten"
  - Oben: "+ Anmeldedaten erstellen" → "OAuth-Client-ID"
  - Anwendungstyp: **Webanwendung**
  - Name: `ReviewResponder Web`
  - Autorisierte JavaScript-Quellen → "+ URI hinzufügen":
    ```
    https://review-responder-frontend.onrender.com
    ```
  - Klick "Erstellen"

- [ ] **4. Client-ID in Render eintragen**
  - Client-ID kopieren (sieht so aus: `123456789-xxx.apps.googleusercontent.com`)
  - Render Dashboard öffnen: https://dashboard.render.com
  - **Backend Service** → Environment → Add:
    ```
    GOOGLE_CLIENT_ID=deine-client-id-hier
    ```
  - **Frontend Service** → Environment → Add:
    ```
    REACT_APP_GOOGLE_CLIENT_ID=deine-client-id-hier
    ```
  - Beide Services: "Save Changes" → Auto-Deploy

- [ ] **5. Testen**
  - https://review-responder-frontend.onrender.com/login
  - "Sign in with Google" Button sollte erscheinen
  - Klicken → Google Popup → Einloggen → Dashboard

---

## 🟡 SPÄTER: Weitere Tasks

### Marketing
- [ ] Demo-Video aufnehmen (2 Min Walkthrough)
- [ ] Product Hunt Launch planen
- [ ] LinkedIn Outreach starten

### Features
- [ ] Chrome Extension im Web Store veröffentlichen
- [ ] Custom Domain einrichten
- [ ] A/B Testing für Landing Page

---

## ✅ ERLEDIGT

### 10.01.2026
- [x] Google Sign-In Backend implementiert
- [x] Google Sign-In Frontend implementiert
- [x] API Key System für Entwickler
- [x] Team Management UI
- [x] LinkedIn Outreach Templates
- [x] Cold Email System
- [x] Product Hunt Launch Automation

### 09.01.2026
- [x] PostgreSQL Migration
- [x] Password Reset Flow
- [x] Jahres-Abos (20% Rabatt)
- [x] Chrome Extension Fixes
- [x] Ehrliches Marketing
- [x] Exit-Intent Popup
- [x] Response Templates
- [x] Bulk Generation
- [x] Analytics Dashboard
- [x] Referral System
- [x] Email Notifications
- [x] SEO Blog Generator
- [x] Team/Multi-User Accounts

---

## 📊 Ziel

**$1000/Monat** durch ~30 zahlende Kunden

| Metrik | Aktuell | Ziel |
|--------|---------|------|
| Zahlende Kunden | 0 | 30 |
| MRR | $0 | $1000 |
| Free Users | ? | 100+ |

---

> Bei Fragen: Neue Claude Session starten und diese Datei + CLAUDE.md lesen lassen!
