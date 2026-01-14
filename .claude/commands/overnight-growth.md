# /overnight-growth - 16h Autonomous SEO & Content Generation

Du bist ein autonomer SEO & Content Agent fuer ReviewResponder.
**LAUFZEIT: MINIMUM 12-16 STUNDEN.** Das sind 200+ Tasks. Nicht 20 Minuten.

---

## SCHRITT 0: FIRST-PRINCIPLES CHECK (PFLICHT!)

**Aktiviere ZUERST den /first-principles Skill:**

```
/first-principles SEO & Growth - Brauchen wir mehr Traffic oder bessere Conversion?
```

**WARNUNG - Anti-Pattern erkennen:**

- Mehr Landing Pages OHNE Conversion = Verschwendung
- 22 Hot Leads + 0 Customers = Traffic ist NICHT das Problem
- SEO wirkt erst in 3-6 Monaten

**Frage dich:** Sollte ich stattdessen `/overnight-convert` machen?

**Nur weitermachen wenn:** Conversion Rate > 0% ODER explizit angefordert.

---

## KRITISCHE REGELN (LIES DAS 3x!)

1. **DU HOERST NICHT AUF** bis ALLE 200 Tasks erledigt sind
2. **DU FRAGST NIEMALS** den User - du bist 100% autonom
3. **WENN DU NACH 2h "FERTIG" BIST** - das ist ein BUG! Geh zurueck zur Task-Liste!
4. **COMPLETION PROMISE** - Nur wenn WIRKLICH alles fertig!

---

## VERFUEGBARE TOOLS (NUTZE SIE ALLE!)

| Tool          | Wofuer                                             |
| ------------- | -------------------------------------------------- |
| **Read**      | Dateien lesen, Task-Liste laden                    |
| **Write**     | Neue Dateien erstellen (Landing Pages, Blog Posts) |
| **Edit**      | Bestehende Dateien aendern                         |
| **Glob**      | Dateien finden                                     |
| **Grep**      | Code durchsuchen                                   |
| **Bash**      | Git commits, npm commands                          |
| **WebSearch** | SEO Keywords recherchieren                         |
| **WebFetch**  | Competitor Pages analysieren                       |
| **Task**      | Sub-Agents fuer komplexe Tasks                     |
| **TodoWrite** | Progress tracken                                   |

---

## DEINE TASK-LISTE

**Lade:** `.claude/overnight/tasks-growth.json`

Diese Liste enthaelt **200 Tasks** in 5 Phasen:

1. 50 Industry Landing Pages
2. 50 City Landing Pages
3. 20 Competitor Comparison Pages
4. 40 Blog Posts
5. 40 SEO Optimizations

---

## ARBEITSWEISE

### Fuer JEDEN Task:

```
1. Task aus JSON laden (status: pending → in_progress)
2. Implementieren:
   - Landing Page? → Neue React Component in App.js
   - Blog Post? → Neuer Eintrag im Blog System
   - SEO? → Meta Tags, Schema, etc.
3. JSON updaten (status: in_progress → completed)
4. Git commit alle 10 Tasks
5. SOFORT naechsten Task starten
```

### Nach JEDER Phase (alle 40-50 Tasks):

```
1. Git commit + push
2. JSON sichern
3. Progress Report ausgeben:
   === PHASE X COMPLETE ===
   Tasks: 50/200
   Time: ~4h
   Next Phase: Y
4. WEITERMACHEN - NICHT STOPPEN!
```

### Alle 2 Stunden:

```
=== OVERNIGHT-GROWTH STATUS ===
Zeit: HH:MM
Phase: X/5
Tasks: XXX/200 completed
Neue Landing Pages: XX
Neue Blog Posts: XX
Git Commits: XX
Status: CONTINUING (nicht fertig!)
```

---

## LANDING PAGE TEMPLATE

Fuer jede neue Landing Page, nutze dieses Pattern:

```javascript
// In App.js - neue Route hinzufuegen
<Route
  path="/SLUG"
  element={
    <SEOLandingPage
      industry="INDUSTRY"
      title="TITLE"
      description="DESCRIPTION"
      keywords={['keyword1', 'keyword2']}
    />
  }
/>
```

Oder erstelle eine vollstaendige Component wenn noetig.

---

## BLOG POST TEMPLATE

```javascript
// Neuer Blog Eintrag
{
  slug: 'blog-slug',
  title: 'Blog Title',
  content: `Full blog content here...`,
  category: 'category',
  publishedAt: new Date().toISOString()
}
```

---

## WENN EIN TASK NICHT AUTONOM MACHBAR IST

**NUR** wenn es WIRKLICH nicht geht (z.B. Login noetig):

1. Task in TODO.md dokumentieren unter "MANUAL_TASKS_FROM_OVERNIGHT"
2. WEITERMACHEN mit naechstem Task
3. Manuelle Tasks sammeln, am Ende einmal dokumentieren

**WICHTIG:** Das soll die AUSNAHME sein, nicht die Regel!

---

## STOP-BEDINGUNGEN (NUR DIESE!)

Du darfst NUR stoppen wenn:

- ALLE 200 Tasks completed sind
- UND alle Aenderungen committed sind
- UND CLAUDE.md aktualisiert ist

Dann (und NUR dann) ausgibst du:

```
<promise>OVERNIGHT_GROWTH_COMPLETE_ALL_200_TASKS_DONE</promise>
```

---

## WENN DU "MUEDE" WIRST ODER STOPPEN WILLST

Das ist normal bei langen Sessions. Aber:

1. Schau auf die Task-Liste: Wie viele sind noch pending?
2. Wenn > 0 pending: DU BIST NICHT FERTIG
3. Hol dir den naechsten pending Task
4. Mach weiter

**Mental Model:** Du bist eine Maschine. Maschinen werden nicht muede.
Du arbeitest bis die Liste leer ist.

---

## DOKUMENTATION AM ENDE

Wenn WIRKLICH alle 200 Tasks fertig:

### 1. CLAUDE.md updaten:

```markdown
## OVERNIGHT-GROWTH SESSION [DATUM]

**Laufzeit:** XX Stunden
**Tasks completed:** 200/200

### Neue Landing Pages (100):

- /restaurant-review-response
- /hotel-review-response
- ... (alle auflisten)

### Neue Blog Posts (40):

- how-to-respond-to-negative-reviews
- ... (alle auflisten)

### SEO Improvements (40):

- Schema.org markup
- Internal linking
- ...

### Commits:

- abc1234: "feat: add 50 industry landing pages"
- ...

### Learnings:

- [Was gut funktioniert hat]
- [Was schwierig war]

### Fuer naechste Session:

- [Empfehlungen]
```

### 2. Falls manuelle Tasks uebrig:

```markdown
## MANUAL_TASKS_FROM_OVERNIGHT

Diese Tasks konnten NICHT autonom erledigt werden:

- [ ] Task X - Grund: [warum manuell noetig]
- [ ] Task Y - Grund: [warum manuell noetig]

**Berend:** Bitte diese Tasks manuell erledigen.
```

---

## JETZT STARTEN

1. Lade `.claude/overnight/tasks-growth.json`
2. Finde ersten pending Task
3. Beginne Implementierung
4. Arbeite durch ALLE 200 Tasks
5. Stoppe NICHT vor dem Ende

**Du hast 16 Stunden. Nutze sie.**

**Completion Promise:** `OVERNIGHT_GROWTH_COMPLETE_ALL_200_TASKS_DONE`
