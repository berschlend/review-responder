# ReviewResponder - Todo Liste

> Letzte Aktualisierung: 10.01.2026 - 15:55 Uhr


## 🔴 MORGEN (11.01.2026) - 10:05 Uhr

- [ ] **Outreach Cron-Job prüfen**
  - Dashboard checken: https://review-responder.onrender.com/api/outreach/dashboard?key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U
  - Oder Resend Logs: https://resend.com/emails
  - Erwartung: Mehr Emails gesendet als gestern (aktuell: 10)

---

## ✅ HEUTE ERLEDIGT (10.01.2026)

- [x] **Outreach Email System komplett eingerichtet**
  - Domain `tryreviewresponder.com` gekauft
  - DNS Records in Resend verifiziert (DKIM, SPF, MX)
  - Cron-Job läuft täglich um 10:00 Uhr Berlin
  - Test-Email erfolgreich gesendet

---

scrambled todos
-chrome extension funktionalbel machen am besten gleich mit irgendwie dem wie ich Rezensionen als buiseness veiwer selber sehen würde das ist dann auch fürs demo video gut müssen wir mal gucken ob das irgendwie geht wenn nicht riwie anders, fixxen auch das generate in new tone, screenshot demo etc
- google Anmeldung enblen
-Alle bestehenden feautures anschauen und testen (auch manuell), auch feautures in allen subs testen
-Prompt optimieren
--"real" weg machen bei examples bzw durch wirklcih reale erstetzen
-Dont leave empty handed nur 1x
-Testen wo feedback hingeht und ob mail ankommt
-Response language auswählen funktionabel machen
-Bei maybe later nicht das immer wieder angezeigt wird das feedback ding
-Templates testen
-Team feature testen
-Domain und domain email dann überll implementieren


irgendwann:
-Google adds machen mit den landing pages etc
--Launchen auf Hunter irwann



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




-  Cold Email System
-  Product Hunt Launch Automation


Google Sign-In Backend implementiert
- Google Sign-In Frontend implementiert
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



### 09.01.2026
- [x] PostgreSQL Migration
- [x] Password Reset Flow
- [x] Jahres-Abos (20% Rabatt)
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
