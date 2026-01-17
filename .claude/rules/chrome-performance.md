# Chrome MCP Performance Rules

> **Auto-loaded for:** Alle Agents mit Chrome MCP Zugriff
> **Ziel:** Multiple Agents parallel in Chrome ohne Performance-Probleme

---

## DIE 4 PERFORMANCE KILLER

| Killer | Problem | Lösung |
|--------|---------|--------|
| Fixed Waits | `wait(5)` egal ob bereit | Smart Wait Pattern |
| Screenshots | 2-5MB Base64 pro Bild | `read_page` first |
| Serielle Ops | Tab1, dann Tab2, dann Tab3 | Parallele Tool-Calls |
| Tab-Registry | PowerShell nach jedem navigate | Batch am Ende |

---

## 1. SMART WAIT PATTERN (KRITISCH!)

### FALSCH (Fixed Wait)
```javascript
// LANGSAM: Wartet IMMER 5 Sekunden
navigate({ url: "https://gmail.com", tabId })
computer({ action: "wait", duration: 5, tabId })
```

### RICHTIG (Smart Wait)
```javascript
// SCHNELL: Wartet nur bis Element da ist
navigate({ url: "https://gmail.com", tabId })
// Sofort prüfen ob bereit:
find({ query: "compose button", tabId })
// Gefunden? → Weiter! Nicht gefunden? → 1 Sek warten, retry
```

### Smart Wait Implementation
```javascript
// MAX 3 Retries, MAX 1 Sek pro Retry
for (let i = 0; i < 3; i++) {
  const result = find({ query: "expected element", tabId });
  if (result.elements.length > 0) break;
  computer({ action: "wait", duration: 1, tabId });
}
```

### Wann welches Wait?
| Situation | Pattern |
|-----------|---------|
| Seite laden | `find` + Element check |
| Button Klick → Reaktion | `find` nach Klick |
| Animation/Transition | `wait(duration: 0.5)` max |
| Nichts spezifisches | `read_page` als Check |

---

## 2. READ_PAGE > SCREENSHOT

### FALSCH (Screenshot Overkill)
```javascript
// LANGSAM: 2-5MB Transfer, Bildverarbeitung
computer({ action: "screenshot", tabId })
// "Ich sehe einen Login Button..."
```

### RICHTIG (read_page First)
```javascript
// SCHNELL: Nur Text, paar KB
read_page({ tabId, filter: "interactive" })
// Direkt: ref_1: button "Login"
```

### Wann Screenshot WIRKLICH nötig?
| Situation | Tool |
|-----------|------|
| Element finden | `find` oder `read_page` |
| Text lesen | `read_page` oder `get_page_text` |
| Formular-Felder | `read_page({ filter: "interactive" })` |
| Visuelles Layout checken | `screenshot` (selten!) |
| Debugging "was zeigt die Seite?" | `screenshot` |
| Evidence für User | `screenshot` |

### Screenshot Kostentabelle
| Aktion | Dauer | Transfer |
|--------|-------|----------|
| `read_page` | ~200ms | ~10KB |
| `read_page({ filter: "interactive" })` | ~150ms | ~5KB |
| `screenshot` | ~1-3s | ~2-5MB |

---

## 3. PARALLELE TOOL-CALLS

### FALSCH (Seriell)
```javascript
// LANGSAM: Nacheinander
navigate({ url: "gmail.com", tabId: 1 })
navigate({ url: "stripe.com", tabId: 2 })
navigate({ url: "render.com", tabId: 3 })
// Total: 3x Wartezeit
```

### RICHTIG (Parallel)
```javascript
// SCHNELL: Gleichzeitig in einem Message-Block
// Alle 3 navigates in EINEM Tool-Call Block senden!
```

### Wann parallel möglich?
| Scenario | Parallel? |
|----------|-----------|
| Verschiedene Tabs öffnen | JA |
| Formular ausfüllen (sequentiell) | NEIN |
| Screenshots von 3 Tabs | JA |
| Click → Wait → Check | NEIN |

---

## 4. TAB-REGISTRIERUNG OPTIMIEREN

### FALSCH (Nach jedem Navigate)
```javascript
navigate({ url, tabId })
// PowerShell Aufruf (200-500ms)
Bash: powershell ... -Action register -TabId X
```

### RICHTIG (Batch am Ende)
```javascript
// Während Session: Tabs in Memory tracken
// Am Ende: EINMAL cleanup Script

// Oder: Gar nicht registrieren wenn kein Cleanup nötig
```

### Wann Tab-Registrierung?
| Scenario | Registrieren? |
|----------|---------------|
| Schneller Test/Check | NEIN |
| Lange Session mit vielen Tabs | JA (am Ende) |
| Protected Tabs (Gmail, Stripe) | Auto-Protected, skip |

---

## QUICK REFERENCE: OPTIMIERTE PATTERNS

### Gmail öffnen und prüfen
```javascript
// Alt (LANGSAM): 8+ Sekunden
navigate({ url: "mail.google.com", tabId })
computer({ action: "wait", duration: 5, tabId })
computer({ action: "screenshot", tabId })

// Neu (SCHNELL): 2-3 Sekunden
navigate({ url: "mail.google.com", tabId })
find({ query: "compose", tabId })  // Wartet implizit
read_page({ tabId, filter: "interactive" })
```

### Formular ausfüllen
```javascript
// Alt: find, wait, input, wait, find, wait, input...
// Neu: find+input direkt, kein wait dazwischen

find({ query: "email field", tabId })
form_input({ ref: "ref_1", value: "test@test.com", tabId })
find({ query: "password field", tabId })
form_input({ ref: "ref_2", value: "password", tabId })
// Kein wait() nötig zwischen form_input Calls!
```

### Multi-Tab Monitoring
```javascript
// Alt: Tab1 → Screenshot → Tab2 → Screenshot → Tab3 → Screenshot
// Neu: Alle 3 screenshots PARALLEL in einem Block

// In EINEM Tool-Call Message:
computer({ action: "screenshot", tabId: 1 })
computer({ action: "screenshot", tabId: 2 })
computer({ action: "screenshot", tabId: 3 })
```

---

## ANTI-PATTERNS LISTE

| Pattern | Problem | Fix |
|---------|---------|-----|
| `wait(duration: 5)` | Immer 5 Sek | `find` + retry |
| `wait(duration: 2)` nach navigate | Unnötig | `find` stattdessen |
| `screenshot` für Text | Overkill | `read_page` |
| `screenshot` nach jedem Click | Overkill | Nur bei Bedarf |
| Tab-Register nach navigate | Overhead | Batch/Skip |
| Seriell wenn parallel möglich | Langsam | Parallel calls |

---

## PERFORMANCE CHECKLISTE

Vor Chrome MCP Session, prüfe:

- [ ] Nutze ich `find` statt `wait` wo möglich?
- [ ] Nutze ich `read_page` statt `screenshot` wo möglich?
- [ ] Sind unabhängige Operationen parallel?
- [ ] Ist Tab-Registrierung wirklich nötig?
- [ ] Ist mein max wait <= 1-2 Sekunden pro Aktion?

---

## EXPECTED SPEEDUP

| Operation | Alt | Neu | Speedup |
|-----------|-----|-----|---------|
| Seite öffnen + check | 7s | 2s | 3.5x |
| Formular (5 Felder) | 15s | 5s | 3x |
| Multi-Tab Check (3 Tabs) | 15s | 5s | 3x |
| Komplette Session | 2min | 40s | 3x |

---

*Loaded by: Alle Chrome MCP Agents*
