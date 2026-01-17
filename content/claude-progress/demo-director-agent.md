# DEMO-DIRECTOR Agent

> **Aktivieren:** Morgen (18.01.2026)
> **Session Name:** `$env:CLAUDE_SESSION = "DEMO-DIRECTOR"`

---

## Mission

Alles fuer Demo-Video vorbereiten sodass Berend nur noch:
1. OBS starten
2. Record druecken
3. Fertig

---

## Vorbereitet (17.01)

| Item | Status | Details |
|------|--------|---------|
| Server | WARM | 0.28s Response Time |
| Scripts | READY | `content/video-15s-ultra.md` (empfohlen) |
| Test-Account | READY | `reviewer@tryreviewresponder.com` / `ChromeReview2026!` |
| Business-Kandidaten | IDENTIFIED | Godfrey Hotel Hollywood (3.4 Stars) |

---

## Morgen TODO (Agent Tasks)

### 1. Chrome MCP starten
```powershell
$env:CLAUDE_SESSION = "DEMO-DIRECTOR"
claude --chrome
```

### 2. Browser vorbereiten
- [ ] Google Maps oeffnen: Nusr-Et oder Godfrey Hotel
- [ ] Extension eingeloggt pruefen
- [ ] Review mit 1-3 Sternen finden (kurz, englisch)
- [ ] Server warmup (1x API call)

### 3. Test-Recording
- [ ] Extension klicken
- [ ] Response generieren
- [ ] Pruefen: Response ist GUT (nicht generic)
- [ ] Timing messen: <20 Sekunden?

### 4. Berend Handoff
- [ ] OBS Settings pruefen (1920x1080, 30fps)
- [ ] Browser-Fenster positionieren
- [ ] "Ready to record" melden

---

## Business-Kandidaten

| Business | Rating | Stadt | Google Maps Search |
|----------|--------|-------|-------------------|
| **Nusr-Et Steakhouse** | 3.x | NYC/London | "nusr-et steakhouse" |
| **The Godfrey Hotel Hollywood** | 3.4 | LA | "godfrey hotel hollywood" |
| **Travelodge London Central** | 3.8 | London | "travelodge london city road" |
| **Hollywood City Inn** | 3.8 | LA | "hollywood city inn" |

---

## Script Empfehlung

**15s Version** (`content/video-15s-ultra.md`)
- 70% Completion Rate vs 30% bei laengeren Videos
- Kein Voice-Over noetig (Text-Overlays)
- Hook: "YOUR worst review"

---

## Aktivierung

Sag einfach:
```
Aktiviere DEMO-DIRECTOR
```

Oder:
```
/first-principles Demo-Video vorbereiten
```
