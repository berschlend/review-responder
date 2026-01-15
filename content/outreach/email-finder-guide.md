# Email Finder Guide - Business Owner Emails finden

> **Ziel:** Qualifizierte Business-Owner-Emails für Cold Outreach finden
> **Fokus:** Restaurants, Hotels, lokale Dienstleister

---

## Quick Start Workflow

```
1. Zielbranche & Region definieren
2. Google Maps / Yelp nach Businesses suchen
3. Website besuchen → About/Contact/Team Seite
4. Email-Finder Tool nutzen (Hunter.io / Apollo)
5. Email verifizieren vor dem Senden
6. In CRM/Spreadsheet mit Personalisierungsdaten speichern
```

---

## Tool 1: Hunter.io (Empfohlen für Anfänger)

### Was es kann:

- Email-Adressen von Domains finden
- Email-Pattern erkennen (vorname@domain.com)
- Email-Verification
- Chrome Extension

### Preise:

| Plan    | Preis   | Searches | Verifications |
| ------- | ------- | -------- | ------------- |
| Free    | $0/mo   | 25       | 50            |
| Starter | $49/mo  | 500      | 1000          |
| Growth  | $149/mo | 5000     | 10000         |

### Anleitung:

**1. Domain Search:**

```
1. Gehe zu hunter.io
2. Gib die Business-Website ein (z.B. grandhotel.com)
3. Hunter zeigt alle gefundenen Emails + Confidence Score
4. Suche nach: owner@, gm@, manager@, contact@
```

**2. Email Finder (wenn Name bekannt):**

```
1. Klicke auf "Email Finder"
2. Gib Domain + Vor/Nachname ein
3. Hunter generiert die wahrscheinlichste Email
4. Confidence Score zeigt Zuverlässigkeit
```

**3. Chrome Extension:**

```
1. Installiere Hunter Chrome Extension
2. Besuche Business-Website
3. Klicke auf Hunter Icon
4. Zeigt sofort alle gefundenen Emails
```

### Hunter API (für Automatisierung):

```javascript
// Hunter.io API Beispiel
const response = await fetch(
  `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`
);
const data = await response.json();
// data.data.emails enthält alle gefundenen Emails
```

---

## Tool 2: Apollo.io (Beste Datenbank)

### Was es kann:

- 275M+ verifizierte Kontakte
- Firmendaten + Entscheider
- Email-Sequenz-Automatisierung
- LinkedIn Integration
- Intent Data

### Preise:

| Plan         | Preis  | Credits       |
| ------------ | ------ | ------------- |
| Free         | $0/mo  | 50 emails/mo  |
| Basic        | $49/mo | 200 emails/mo |
| Professional | $99/mo | Unlimited     |

### Anleitung:

**1. Suche nach Branche + Region:**

```
1. Apollo Login → Search
2. Filter: Industry = "Restaurants" / "Hotels"
3. Filter: Location = "Berlin" / "Hamburg" / etc.
4. Filter: Job Title = "Owner" / "General Manager" / "Director"
5. Ergebnisse speichern
```

**2. Fortgeschrittene Filter:**

```
- Company Size: 1-10 (kleine Businesses)
- Revenue: <$1M (lokale Businesses)
- Technologies: "Google My Business" (haben Online-Präsenz)
- Recent News: Expansion, New Location
```

**3. Sequenz erstellen:**

```
1. Kontakte auswählen
2. "Add to Sequence" klicken
3. Cold Email Template wählen
4. Automatisch senden nach Zeitplan
```

---

## Tool 3: Snov.io (Bestes Preis-Leistung)

### Was es kann:

- Email Finder & Verifier
- Email Drip Campaigns
- CRM integriert
- LinkedIn Extension

### Preise:

| Plan    | Preis  | Credits |
| ------- | ------ | ------- |
| Free    | $0/mo  | 50      |
| Starter | $30/mo | 1000    |
| Pro     | $75/mo | 5000    |

### Anleitung:

**1. Domain Search:**

```
1. Snov.io → Email Finder → Domain Search
2. Website eingeben
3. Alle Emails werden angezeigt
4. Direkt in Liste speichern
```

**2. Social URL Search:**

```
1. LinkedIn Profil-URL eingeben
2. Snov.io findet zugehörige Email
3. Perfekt für Entscheider-Targeting
```

**3. Email Verifier:**

```
1. CSV mit Emails hochladen
2. Bulk-Verification
3. Valid / Invalid / Catch-All Status
4. Nur valide Emails behalten
```

---

## Manuelle Methoden (Kostenlos)

### 1. Google Suche:

```
"restaurant name" email
"restaurant name" contact
"restaurant name" owner
site:linkedin.com "restaurant name" owner
```

### 2. Website Inspection:

```
- /about
- /contact
- /team
- /impressum (DACH-Region)
- Footer (oft Email versteckt)
```

### 3. LinkedIn:

```
1. Business suchen
2. "People" Tab
3. Nach Owner/Manager filtern
4. Profil → Contact Info (manchmal Email sichtbar)
```

### 4. Yelp / Google Maps:

```
- Yelp Business Profile → manchmal Email im "Business Info"
- Google Maps → Website besuchen → Contact Page
```

### 5. WHOIS Lookup:

```
1. who.is oder whois.domaintools.com
2. Domain eingeben
3. Registrant Email (oft Owner)
```

### 6. Email Pattern Guessing:

```
Häufigste Patterns:
- vorname@domain.com
- vorname.nachname@domain.com
- v.nachname@domain.com
- info@domain.com
- contact@domain.com
- owner@domain.com
```

---

## Email Verification Best Practices

### Warum verifizieren?

- Bounces beschädigen Sender Reputation
- Zu viele Bounces = Email-Provider blockt dich
- Verifikation = höhere Deliverability

### Tools für Verification:

| Tool            | Preis        | Genauigkeit |
| --------------- | ------------ | ----------- |
| NeverBounce     | $0.008/email | 99.9%       |
| ZeroBounce      | $0.007/email | 98%+        |
| EmailListVerify | $0.004/email | 97%+        |
| Hunter.io       | inkludiert   | 95%+        |

### Verification Workflow:

```
1. Emails sammeln → CSV
2. Durch Verifier laufen lassen
3. Nur "Valid" behalten
4. "Risky" und "Invalid" löschen
5. Ergebnis: Clean List
```

### Verification Status erklärt:

```
- Valid: Email existiert, kann empfangen
- Invalid: Existiert nicht, sofort löschen
- Risky/Unknown: Catch-All Domain, mit Vorsicht nutzen
- Disposable: Temporäre Email, löschen
- Role-based: info@, support@ - niedrigere Reply-Rate
```

---

## Outreach-Qualität > Quantität

### Ideal Pro Tag:

- 50-100 personalisierte Emails
- Nicht 1000 generische Emails

### Personalisierung sammeln:

```
Für jede Email speichern:
- Business Name
- Owner/Manager Name
- Anzahl Google Reviews
- Durchschnittliche Bewertung
- Letzte Review-Antwort (wann?)
- Besonderheit (Spezialität, Auszeichnung)
```

### Spreadsheet Template:

| Email              | Name  | Business          | City   | Reviews | Rating | Last Response | Notes       |
| ------------------ | ----- | ----------------- | ------ | ------- | ------ | ------------- | ----------- |
| mario@trattoria.de | Mario | Mario's Trattoria | Berlin | 127     | 4.3    | 3 Monate      | Italienisch |

---

## Lead Qualification Checklist

Bevor du eine Email sendest, prüfe:

- [ ] Hat das Business Google Reviews? (sonst kein Need)
- [ ] Sind die Reviews unbeantwortet? (Problem vorhanden)
- [ ] Ist es ein echtes Business? (kein Franchise HQ)
- [ ] Ist die Email eines Entscheiders? (nicht support@)
- [ ] Ist die Email verifiziert? (nicht bouncy)

---

## Compliance & Ethik

### CAN-SPAM (USA):

- Physische Adresse in jeder Email
- Klarer Unsubscribe-Link
- Keine irreführenden Subject Lines
- Opt-out innerhalb 10 Tage bearbeiten

### GDPR (EU):

- Nur Business-Emails (keine privaten)
- Legitimate Interest als Rechtsgrundlage
- Klare Opt-out Möglichkeit
- Daten auf Anfrage löschen

### Best Practices:

- Max 3-4 Follow-ups
- Bei "Unsubscribe" sofort stoppen
- Keine gekauften Listen
- Qualität > Quantität
- Personalisierung zeigt Respekt

---

## Automatisierung mit Zapier/Make

### Workflow: Google Maps → CRM

```
1. Google Maps Scraper (Apify, Phantombuster)
2. → Zapier/Make
3. → Hunter.io Email Enrichment
4. → NeverBounce Verification
5. → Spreadsheet / CRM
6. → Email Sequencer (Instantly, Lemlist)
```

### Kosten für Automatisierung:

```
Apify (Scraping): $49/mo
Hunter.io: $49/mo
NeverBounce: ~$50 für 5000 Emails
Instantly: $37/mo
Zapier: $29/mo
---
Total: ~$200/mo für vollautomatisierte Pipeline
```

---

## Quick Reference: Email Pattern by Business Type

### Restaurants:

```
info@restaurant.com (häufigste)
owner@restaurant.com
reservations@restaurant.com
chef@restaurant.com (für Chef-Owned)
```

### Hotels:

```
gm@hotel.com (General Manager)
frontdesk@hotel.com
reservations@hotel.com
info@hotel.com
```

### Service Businesses:

```
owner@business.com
office@business.com
info@business.com
vorname@business.com
```

---

## Checkliste vor dem Start

- [ ] Hunter.io Free Account erstellt
- [ ] Chrome Extension installiert
- [ ] Spreadsheet Template vorbereitet
- [ ] 50 Target-Businesses identifiziert
- [ ] Emails gesammelt
- [ ] Emails verifiziert
- [ ] Personalisierungsdaten gesammelt
- [ ] Email-Sequenz vorbereitet (siehe cold-emails.md)
- [ ] Tracking-Pixel eingebaut
- [ ] Warmed-up Email Account ready

---

## Ressourcen

- [Hunter.io](https://hunter.io) - Email Finder
- [Apollo.io](https://apollo.io) - Sales Intelligence
- [Snov.io](https://snov.io) - Email Outreach Platform
- [NeverBounce](https://neverbounce.com) - Email Verification
- [Instantly.ai](https://instantly.ai) - Cold Email Sender
- [Apify](https://apify.com) - Web Scraping
- [Phantombuster](https://phantombuster.com) - Lead Generation Automation
