# Anruf-Liste - Priorisiert

> Stand: 17.01.2026 | Ziel: Erster zahlender Kunde

---

## PRIORITAET 1: Registrierte User (haben Account, nutzen nicht)

Diese Leads haben sich AKTIV registriert aber noch NIE das Produkt genutzt.
**Conversion-Chance: HOCH** - Sie kennen uns, muessen nur aktiviert werden!

| # | Business | Telefon | Email | Score | Status |
|---|----------|---------|-------|-------|--------|
| 1 | **Trattoria Sempre Zuerich** | +41 44 262 54 62 | zuerich@trattoria-sempre.ch | **+5** | Magic Link genutzt! |
| 2 | **Sphere Tim Raue (Berlin)** | 030 247575875 | i.schmidt@tv-turm.de | **+4** | Michelin, personal Name |
| 3 | ibis Wien Mariahilf | +43 1 521510 | H0796@accor.com | +2 | Business hours signup |

### Scoring Erklaerung

| Lead | Faktoren |
|------|----------|
| Trattoria Sempre | +3 (Magic Link = aktiv engagiert), +2 (SMB, Entscheider erreichbar) |
| Sphere Tim Raue | +3 (Personal Name = Entscheider), +2 (High-End, viele Reviews), -1 (gross) |
| ibis Wien | +2 (Business Hours), -2 (Corporate Accor, H####@ Pattern) |

---

## PRIORITAET 2: Weitere registrierte User

| # | Business | Email | Problem |
|---|----------|-------|---------|
| 4 | terrasse Restaurant Zuerich | info@terrasse-zuerich.ch | Generic info@ |
| 5 | IntercityHotel Hamburg | info@treudelberg.com | Chain hotel |
| 6 | St James Quarter | hello@stjamesquarter.com | Shopping center? |

**Nicht anrufen:**
- h9057@accor.com (2am signup = Bot/Scanner)
- reservation.web@madamebrasserie.com (Generic email)
- awayspa.edinburgh@whotels.com (Same-minute burst pattern)

---

## CALL WORKFLOW

### Vor dem Anruf
1. Call-Prep oeffnen: `content/call-prep/[business-name].md`
2. 2 Minuten lesen (Quick Info + Opener)
3. Browser offen mit ReviewResponder Demo

### Nach dem Anruf
Sag Claude: "Anruf mit [Business] war [Ergebnis]"

| Ergebnis | Claude macht... |
|----------|-----------------|
| "Interesse" | Demo senden, Follow-up planen |
| "Kein Interesse" | Lead Status updaten, Grund notieren |
| "Rueckruf" | Termin notieren, neues Prep mit Notizen |
| "Nicht erreicht" | 2x retry markieren |

---

## BESTE ANRUFZEITEN

| Region | Beste Zeit (lokal) | In deutscher Zeit |
|--------|-------------------|-------------------|
| Schweiz | 10:00-12:00 | 10:00-12:00 |
| Deutschland | 10:00-12:00 | 10:00-12:00 |
| Oesterreich | 10:00-12:00 | 10:00-12:00 |
| UK | 10:00-12:00 | 11:00-13:00 |

**Restaurant-Tipp:** VOR 11:30 anrufen (dann wird's hektisch)

---

## TRACKING

| Datum | Business | Ergebnis | Naechster Schritt |
|-------|----------|----------|-------------------|
| - | - | - | - |

---

*Aktualisiert: 17.01.2026*
