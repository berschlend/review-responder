# First Principles - Problem-Solving wenn Standard-Ansätze versagen

> **Wann nutzen:** Loop ohne Progress, gleicher Fehler 3x, "mehr vom Gleichen" bringt nichts

---

## TRIGGER-BEDINGUNGEN

Nutze First Principles wenn:
- `loops_without_progress >= 3`
- Gleicher Ansatz scheitert wiederholt
- Du merkst: "Ich mache mehr vom Gleichen"
- Metriken steigen aber Ziel rückt nicht näher
- Du hörst dich sagen: "Das sollte eigentlich funktionieren"

---

## DIE 5 FRAGEN

### 1. Was ist das ECHTE Problem?
```
Nicht: "Wir brauchen mehr Leads"
Sondern: "Warum kauft niemand?"

Frage: Was ist das Symptom vs. die Ursache?
```

### 2. Was sind die ECHTEN Constraints?
```
Nicht: "API Limit ist 100/Monat"
Sondern: "Brauchen wir überhaupt diese API?"

Frage: Welche Annahmen habe ich nie hinterfragt?
```

### 3. Wo im Funnel ist der ECHTE Bottleneck?
```
Lead → Email → Click → Demo → Register → USE → Pay
2000    650     23      22      10         0      0
                                           ↑
                                    HIER ist das Problem
```

### 4. Was würde ein Anfänger fragen?
```
"Warum schicken wir 1000 Emails wenn keiner das Produkt nutzt?"
"Warum scrapen wir mehr Leads wenn wir schon 2000 haben?"
```

### 5. Was ist der kürzeste Weg zum Ziel?
```
Ziel: Erster zahlender Kunde
Kürzester Weg: Die 10 registrierten User aktivieren
Nicht: 1000 neue Leads generieren
```

---

## OUTPUT FORMAT

Nach First-Principles Analyse, schreibe:

```
=== FIRST PRINCIPLES ANALYSE ===

SYMPTOM: [Was sieht aus wie das Problem]
ECHTES PROBLEM: [Was ist die Root Cause]

BISHERIGER ANSATZ: [Was wurde versucht]
WARUM ES NICHT FUNKTIONIERT: [Die falsche Annahme]

NEUER ANSATZ: [Was stattdessen tun]
ERSTE AKTION: [Konkret, jetzt machbar]
```

---

## BEISPIELE

### Beispiel 1: Sales Automation
```
SYMPTOM: Zu wenig Leads
ECHTES PROBLEM: 10 User registriert, 0 nutzen das Produkt

BISHERIGER ANSATZ: Mehr scrapen, mehr Emails
WARUM ES NICHT FUNKTIONIERT: Mehr Input ≠ mehr Output wenn Conversion 0%

NEUER ANSATZ: Existierende User aktivieren
ERSTE AKTION: Onboarding Email Sequence implementieren
```

### Beispiel 2: API Limits
```
SYMPTOM: SerpAPI bei 960% vom Limit
ECHTES PROBLEM: Jeder Demo-Request macht neuen API Call

BISHERIGER ANSATZ: Mehr API Keys kaufen
WARUM ES NICHT FUNKTIONIERT: Skaliert nicht, teuer

NEUER ANSATZ: Caching + Demo Reuse
ERSTE AKTION: review_cache Tabelle implementieren
```

### Beispiel 3: Feature funktioniert nicht
```
SYMPTOM: dbRun is not defined
ECHTES PROBLEM: Funktion existiert nicht im Codebase

BISHERIGER ANSATZ: Warten auf Deployment
WARUM ES NICHT FUNKTIONIERT: Code ist falsch, nicht Deployment

NEUER ANSATZ: Vorher prüfen welche Funktionen existieren
ERSTE AKTION: grep "^async function db" server.js
```

---

## NACH DER ANALYSE

1. **Neuen Ansatz in LEARNINGS dokumentieren** (night-blast.md)
2. **Alten Ansatz NICHT wiederholen**
3. **Erste Aktion SOFORT umsetzen**

---

## MERKSATZ

> "Wenn du in einem Loch steckst, hör auf zu graben."
>
> Mehr vom Gleichen = Tieferes Loch
> First Principles = Raus aus dem Loch
