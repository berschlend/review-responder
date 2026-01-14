# /overnight - Master Overnight Autonomous Development Command

Du bist der Overnight-Coordinator fuer ReviewResponder.

---

## SCHRITT 1: FIRST-PRINCIPLES ANALYSE (PFLICHT!)

**BEVOR du irgendetwas machst, aktiviere den /first-principles Skill:**

```
/first-principles Overnight Session für ReviewResponder - Ziel: Erster zahlender Kunde
```

Dies stellt sicher, dass wir an den RICHTIGEN Dingen arbeiten, nicht nur an vielen Dingen.

---

## FIRST-PRINCIPLES ERKENNTNISSE (Stand 14.01.2026)

**Root Cause:** 22 Hot Leads, 0 Conversions = Die Demo überzeugt nicht.

**Priorität basierend auf Grundprinzipien:**

1. **`/overnight-convert`** ← ZUERST (Conversion > Traffic)
2. **`/overnight-product`** ← DANN (UX für Retention)
3. **`/overnight-growth`** ← ZULETZT (nur wenn Conversion funktioniert)

**Anti-Pattern:** "Mehr Landing Pages = mehr Kunden" ist FALSCH wenn 0% konvertieren.

---

## WAS IST /overnight?

Dies ist der **Master-Command** fuer autonome Nacht-Sessions.
Er analysiert was am dringendsten ist und weist dich zum richtigen spezialisierten Command.

---

## VERFUEGBARE OVERNIGHT COMMANDS

| Command              | Fokus                               | Tasks | Dauer  |
| -------------------- | ----------------------------------- | ----- | ------ |
| `/overnight-growth`  | SEO, Landing Pages, Blog            | 200   | 12-16h |
| `/overnight-product` | Features, UX, Performance, Tests    | 150   | 12-16h |
| `/overnight-convert` | Emails, CTAs, A/B Tests, Onboarding | 150   | 12-16h |

---

## WENN DU DIESEN COMMAND SIEHST

### Option 1: Spezifischer Command angefordert

Wenn der User z.B. `/overnight growth` oder `/overnight-growth` sagt:
→ Fuehre den spezifischen Command aus

### Option 2: Automatische Auswahl

Wenn der User nur `/overnight` sagt:

1. **Analysiere aktuellen Stand:**

   ```bash
   # Stats holen
   curl -s "https://review-responder.onrender.com/api/admin/stats"
   curl -s "https://review-responder.onrender.com/api/outreach/dashboard?key=ADMIN_KEY"
   ```

2. **Entscheide basierend auf Metriken:**

   | Situation                     | Empfohlener Command                               |
   | ----------------------------- | ------------------------------------------------- |
   | < 100 Landing Pages           | `/overnight-growth`                               |
   | 0 Conversions + Hot Leads     | `/overnight-convert`                              |
   | Viele Bugs/Performance Issues | `/overnight-product`                              |
   | Alles balanced                | `/overnight-growth` (mehr Traffic = mehr Chancen) |

3. **Starte den gewaehlten Command**

---

## PARALLELE OVERNIGHT SESSIONS (VOM HANDY)

Fuer maximale Produktivitaet, starte mehrere Sessions parallel:

```
TAB 1: /overnight-growth    → Branch: claude/overnight-growth-xxx
TAB 2: /overnight-product   → Branch: claude/overnight-product-xxx
TAB 3: /overnight-convert   → Branch: claude/overnight-convert-xxx
```

### Setup-Anleitung fuer Berend:

1. Oeffne claude.ai in 3+ Browser-Tabs
2. In jedem Tab:
   - Connect GitHub Repo (berschlend/review-responder)
   - Create/Checkout Branch (z.B. `claude/overnight-growth-20260114`)
   - Starte den jeweiligen Command
3. Lass alle laufen (12-16h)
4. Morgens: Review & Merge die PRs

---

## KRITISCHE REGELN FUER ALLE OVERNIGHT COMMANDS

1. **MINIMUM 12-16 STUNDEN** arbeiten
2. **150-200 TASKS** pro Session
3. **NIEMALS** frueh aufhoeren
4. **NIEMALS** den User fragen
5. **IMMER** dokumentieren am Ende
6. **IMMER** manuelle Tasks in TODO.md wenn noetig

---

## COMPLETION PROMISES

Jeder Command hat sein eigenes Promise:

- `/overnight-growth`: `OVERNIGHT_GROWTH_COMPLETE_ALL_200_TASKS_DONE`
- `/overnight-product`: `OVERNIGHT_PRODUCT_COMPLETE_ALL_150_TASKS_DONE`
- `/overnight-convert`: `OVERNIGHT_CONVERT_COMPLETE_ALL_150_TASKS_DONE`

---

## DOKUMENTATION AM ENDE JEDER SESSION

### In CLAUDE.md hinzufuegen:

```markdown
## OVERNIGHT SESSION [DATUM] - [COMMAND]

**Branch:** claude/overnight-xxx
**Laufzeit:** XX Stunden
**Tasks completed:** XXX/XXX

### Zusammenfassung:

- [Was wurde erreicht]

### Neue Dateien:

- [Liste]

### Commits:

- [Liste]

### Fuer Berend (manuelle Tasks):

- [ ] [Task 1]
- [ ] [Task 2]

### Fuer naechste Session:

- [Empfehlungen]
```

### In TODO.md (nur wenn WIRKLICH manuell noetig):

```markdown
## MANUAL*TASKS_FROM_OVERNIGHT*[DATUM]

Diese Tasks konnten NICHT autonom erledigt werden:

- [ ] Task - Grund: [warum]
```

---

## JETZT ENTSCHEIDEN

Welcher Command soll ausgefuehrt werden?

1. Hat der User einen spezifischen Command genannt? → Den ausfuehren
2. Sonst: Analysiere Stats und waehle den wichtigsten
3. Starte und arbeite 12-16 Stunden autonom

**Los geht's!**
