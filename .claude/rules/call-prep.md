# Call-Prep Rules (Auto-loaded when phone outreach is mentioned)

> Telefon-Outreach ist MANUELL (Berend). Claude bereitet ALLES vor.

---

## CORE PRINCIPLE

**Claude kann nicht telefonieren. Also muss Claude PERFEKT vorbereiten.**

Jeder Lead mit Telefonnummer bekommt ein Call-Prep-Sheet das Berend:
- In 2 Minuten lesen kann
- Alles hat was er braucht
- Keine eigene Recherche erfordert

---

## WANN CALL-PREP ERSTELLEN?

| Trigger | Aktion |
|---------|--------|
| Neuer Lead mit Telefonnummer | Call-Prep generieren |
| Lead klickt auf Demo | Call-Prep mit "Hot Lead" Flag |
| Berend fragt nach Anruf-Liste | Liste + alle Preps aktualisieren |
| Lead antwortet auf Email | Call-Prep fuer Follow-up Call |

---

## CALL-PREP STRUKTUR (PFLICHT!)

Jedes Call-Prep MUSS enthalten:

### 1. Quick Info (5 Sekunden scanbar)
```
| Business | [NAME] |
| Telefon | [NUMMER] |
| Reviews | [X] Reviews, [Y]★ |
| Problem | [1 SATZ] |
```

### 2. Opener Script (Wort fuer Wort)
- Erste 15 Sekunden
- Name, Grund, Frage nach Zeit
- Fallback wenn "keine Zeit"

### 3. Hook Script
- Das Problem ansprechen
- Die Loesung teaser
- Frage die Gespraech oeffnet

### 4. Objection Handling
- Mindestens 4 Einwaende
- Wort-fuer-Wort Antworten
- KEIN "das kommt drauf an"

### 5. Kontext (Hintergrund)
- Was macht das Business?
- Warum sind sie ein guter Lead?
- Moegliche Pain Points

### 6. Beispiel AI-Antwort
- Echte Review vom Business
- Von ReviewResponder generierte Antwort
- Zum Vorlesen/Zeigen

---

## TEMPLATE LOCATION

```
content/call-prep/TEMPLATE.md
```

Nutze das Template fuer JEDES neue Call-Prep.

---

## ANRUF-LISTE

```
content/call-prep/anruf-liste.md
```

Enthaelt:
- Priorisierte Liste der Anrufe
- Scoring (warum diese Reihenfolge)
- Tracking (Ergebnisse)
- Beste Anrufzeiten

---

## SCORING FUER PRIORISIERUNG

| Faktor | Punkte |
|--------|--------|
| Hat 1-2★ Review | +3 |
| Viele Reviews (>200) | +2 |
| Lokales Business | +1 |
| Bereits geklickt/interagiert | +2 |
| Upscale/Premium | +1 |
| **Kette/Corporate** | **-2** |

Sortiere nach Score, hoechster zuerst.

---

## NACH DEM ANRUF

Claude fragt: "Wie lief der Anruf mit [BUSINESS]?"

Je nach Antwort:
- **"Interesse"** → Demo senden, Follow-up planen
- **"Kein Interesse"** → Grund notieren, Lead updaten
- **"Rueckruf"** → Termin notieren, neues Prep mit Notizen
- **"Nicht erreicht"** → 2x retry, dann Email

---

## QUICK COMMANDS

```bash
# Anruf-Liste anzeigen
cat content/call-prep/anruf-liste.md

# Call-Prep fuer Lead erstellen
# (Claude macht das automatisch wenn Lead-ID gegeben)

# Nach Anruf: Demo senden
/marketing demo [business] [email]
```

---

## BEISPIEL WORKFLOW

1. Berend: "Gib mir die Anruf-Liste"
2. Claude: Zeigt `anruf-liste.md`
3. Berend: "Ich ruf Bocconcino an"
4. Claude: Zeigt `bocconcino-duesseldorf.md`
5. Berend: [TELEFONIERT]
6. Berend: "Hat Interesse, will Demo"
7. Claude: Generiert Demo, sendet Email, updated Lead Status

---

*Loaded by: Development Sessions, Sales Agents*
