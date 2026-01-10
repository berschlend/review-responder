# Google Ads Guide - ReviewResponder

> **Status:** Bereit zum Starten wenn Produkt besser ist
> **Budget:** $100-150 für 2 Wochen Test
> **Ziel:** 5-10 zahlende Kunden + Testimonials VOR Product Hunt Launch

---

## Landing Pages (FERTIG)

| Kampagne | URL |
|----------|-----|
| Restaurant | `https://review-responder-frontend.onrender.com/restaurant-review-responses?utm_source=google&utm_medium=cpc&utm_campaign=restaurant-reviews` |
| Hotel | `https://review-responder-frontend.onrender.com/hotel-review-management?utm_source=google&utm_medium=cpc&utm_campaign=hotel-reviews` |
| Local Business | `https://review-responder-frontend.onrender.com/local-business-reviews?utm_source=google&utm_medium=cpc&utm_campaign=local-business` |
| Google Reviews | `https://review-responder-frontend.onrender.com/google-review-response-generator?utm_source=google&utm_medium=cpc&utm_campaign=google-reviews` |
| Yelp Reviews | `https://review-responder-frontend.onrender.com/yelp-review-reply-tool?utm_source=google&utm_medium=cpc&utm_campaign=yelp-reviews` |

UTM-Tracking ist implementiert - Daten werden in DB gespeichert (utm_source, utm_campaign, etc.)

---

## Schritt-für-Schritt Anleitung

### 1. Google Ads Konto erstellen
1. Gehe zu **ads.google.com**
2. Klicke "Jetzt starten"
3. Melde dich mit deinem Google-Konto an

### 2. Neue Kampagne erstellen
1. Klicke **"+ Neue Kampagne"**
2. Ziel: **"Leads"** oder **"Websitetraffic"**
3. Kampagnentyp: **"Suche"**

### 3. Kampagnen-Einstellungen
- **Netzwerke:** Nur "Google-Suche" (Display deaktivieren!)
- **Standorte:** USA, UK, Deutschland, Schweiz, Österreich
- **Sprachen:** Englisch, Deutsch
- **Budget:** $10-20/Tag zum Testen

### 4. Keywords

**Restaurant-Kampagne:**
```
restaurant review response
how to respond to restaurant reviews
restaurant review reply generator
google review response restaurant
yelp review response template
respond to negative restaurant review
```

**Hotel-Kampagne:**
```
hotel review response
respond to hotel reviews
tripadvisor review reply
booking.com review response
hotel guest review template
respond to negative hotel review
```

**Local Business-Kampagne:**
```
how to respond to google reviews
review response generator
reply to customer reviews
small business review response
google my business review reply
respond to negative reviews
ai review response
```

### 5. Anzeigentexte

**Überschriften (max 30 Zeichen):**
```
AI Review Response Generator
Reply to Reviews in Seconds
Free Trial - 5 Responses
Save Hours on Reviews
Professional Review Replies
Respond to Reviews with AI
```

**Beschreibungen (max 90 Zeichen):**
```
Generate professional review responses with AI. Works with Google, Yelp & more. Try free!
Stop struggling with review replies. Our AI writes perfect responses in seconds. Start free.
Respond to customer reviews 10x faster. Professional, personalized replies. No credit card needed.
```

### 6. Finale URLs einfügen
Kopiere die URLs aus der Tabelle oben (mit UTM-Parametern!)

### 7. Budget & Zahlung
- Tageslimit: $10-20 pro Kampagne
- Kreditkarte hinzufügen
- Empfehlung: Mit $50 starten, dann erhöhen

---

## Empfohlene Strategie

### Phase 1: Test (Woche 1) - $70
| Kampagne | Budget/Tag | Keywords |
|----------|------------|----------|
| Restaurant | $10 | 6 |
| Hotel | $10 | 6 |
| Local Business | $10 | 6 |

### Phase 2: Optimieren (Woche 2) - $80
- Schlechteste Kampagne pausieren
- Budget auf beste Kampagne erhöhen
- Keywords ohne Conversions entfernen

### Phase 3: Skalieren
- Winning Kampagne auf $30-50/Tag
- Mehr Keywords hinzufügen
- Testimonials von Kunden sammeln

---

## Erfolgs-Metriken

| Metrik | Ziel |
|--------|------|
| Cost per Click (CPC) | < $2 |
| Click-Through Rate (CTR) | > 3% |
| Conversion Rate | > 5% |
| Cost per Registration | < $20 |
| Cost per Paying Customer | < $100 |

---

## Nach dem Test: Product Hunt Launch

Mit echten Zahlen launchen:
- "50+ businesses use ReviewResponder"
- "Saved 100+ hours on review management"
- 2-3 echte Testimonials von zahlenden Kunden

---

## Checkliste vor Start

- [ ] Produkt ist stabil und gut
- [ ] Stripe funktioniert
- [ ] Email-System funktioniert (Resend)
- [ ] $100-150 Budget bereit
- [ ] Zeit zum Monitoren (täglich 10 Min)

---

## Notizen

- Landing Pages haben UTM-Tracking (automatisch)
- Daten werden in PostgreSQL gespeichert
- Kein Admin-Dashboard für UTM-Analytics (kann später gebaut werden)
- Google Ads braucht 1-24h für Anzeigen-Genehmigung

---

*Erstellt: 10.01.2026*
*Status: Warten auf Produkt-Verbesserungen*
