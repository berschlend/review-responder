# Product Hunt Launch Checklist

## 2 Wochen vor Launch

### Product Hunt Account Setup
- [ ] Maker Account erstellen/verifizieren (producthunt.com)
- [ ] Profil ausfüllen (Bio, Website, Social Links)
- [ ] Mind. 5-10 anderen Produkten upvoten (für Credibility)
- [ ] Hunter kontaktieren (siehe hunter-outreach.md)

### Assets vorbereiten
- [ ] Logo (240x240px PNG, transparent)
- [ ] Thumbnail (240x240px)
- [ ] Gallery Images (1270x760px):
  - [ ] Dashboard Screenshot
  - [ ] Chrome Extension in Aktion
  - [ ] Before/After Vergleich (Review ohne/mit AI-Antwort)
  - [ ] Tone Selection Demo
  - [ ] Mobile-Ansicht (falls vorhanden)
- [ ] Demo Video (1-2 Min, optional aber empfohlen)
- [ ] GIF-Demos für Features

### Content vorbereiten
- [ ] Tagline finalisieren: "AI-powered review responses in seconds, not hours"
- [ ] Description (max 260 Zeichen)
- [ ] 5 Key Features mit Beschreibungen
- [ ] Maker Comment Draft (siehe PRODUCT_HUNT.md)
- [ ] FAQ vorbereiten (5-10 häufige Fragen)

---

## 1 Woche vor Launch

### Produkt-Submission
- [ ] Produkt auf Product Hunt einreichen
- [ ] Launch-Datum festlegen (Di-Do sind beste Tage, PST Zeitzone beachten!)
- [ ] Als "Scheduled" markieren, nicht sofort launchen
- [ ] Alle Assets hochladen
- [ ] Preview-Link an Freunde schicken für Feedback

### Community vorbereiten
- [ ] Email an Early Adopters vorbereiten
- [ ] Social Media Posts schedulen (siehe social/ Ordner)
- [ ] Relevante Communities identifizieren (Reddit, Discord, Slack)
- [ ] Persönliche Kontakte benachrichtigen

### Technische Checks
- [ ] Website Load-Test
- [ ] Signup-Flow testen
- [ ] Payment-Flow testen
- [ ] HUNTLAUNCH Discount Code testen
- [ ] Error Monitoring aktivieren (Sentry, etc.)

---

## 1 Tag vor Launch

### Frontend aktivieren
- [ ] `PRODUCT_HUNT_CONFIG.isLaunched` auf `true` setzen
- [ ] `PRODUCT_HUNT_CONFIG.launchEndTime` auf 24h nach Launch setzen
- [ ] `PRODUCT_HUNT_CONFIG.productHuntUrl` mit echtem Link aktualisieren
- [ ] Deployment durchführen

### Content finalisieren
- [ ] Maker Comment in Draft haben
- [ ] Alle Social Media Posts geladen
- [ ] Email an Supporter vorbereitet
- [ ] Slack/Discord Nachrichten vorbereitet

### Team Briefing
- [ ] Launch-Zeit allen mitteilen (12:01 AM PST)
- [ ] Aufgabenverteilung besprechen
- [ ] Notfallkontakte austauschen

---

## Launch Day (Tag 0)

### Morgens (00:01 AM PST = 9:01 Uhr MEZ)
- [ ] Product Hunt Seite überprüfen - ist alles live?
- [ ] Ersten Comment als Maker posten
- [ ] Social Media Posts absenden
- [ ] Email an Supporter senden
- [ ] In relevanten Communities posten (mit Vorsicht - kein Spam!)

### Vormittag (9-12 Uhr MEZ)
- [ ] Alle Comments auf Product Hunt beantworten
- [ ] Social Media Engagement monitoren
- [ ] Ranking beobachten
- [ ] Neue Reviews/Signups tracken

### Nachmittag (12-18 Uhr MEZ)
- [ ] Follow-up Social Posts
- [ ] Weiter Comments beantworten
- [ ] Testimonials sammeln von neuen Usern
- [ ] Bei Fragen schnell reagieren

### Abend (18-24 Uhr MEZ)
- [ ] Finale Social Media Runde
- [ ] Dankes-Posts an Community
- [ ] Tagesergebnis dokumentieren

---

## Nach dem Launch (Tag 1+)

### Auswertung
- [ ] Finale Ranking-Position notieren
- [ ] Anzahl Upvotes
- [ ] Neue Signups zählen
- [ ] Paid Conversions tracken
- [ ] Traffic-Quellen analysieren

### Follow-up
- [ ] Dankes-Email an alle Unterstützer
- [ ] Best Comments/Testimonials speichern
- [ ] "Featured on Product Hunt" Badge auf Website lassen
- [ ] Learnings dokumentieren

### Optimierung
- [ ] User Feedback sammeln
- [ ] Quick Wins implementieren
- [ ] Bug Reports bearbeiten
- [ ] Roadmap anpassen basierend auf Feedback

---

## Wichtige Links

- Product Hunt: https://www.producthunt.com
- Unser Produkt: https://review-responder-frontend.onrender.com
- PH Maker Community: https://www.producthunt.com/makers

## Kontakt für Notfälle

- Berend Mainz: berend.mainz@web.de
