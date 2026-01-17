# Night Mode - Alle 15 Agents starten

Starte alle 15 Night-Burst Agents in separaten Windows.

---

## SCHRITT 1: First Principles (PFLICHT!)

**BEVOR du Agents startest, fuehre `/first-principles` aus!**

Analysiere:
1. **Was ist der aktuelle Bottleneck?** (Funnel-Daten pruefen)
2. **Welche Agents sind wirklich noetig?** (Nicht alle 15 wenn Problem bei Activation liegt)
3. **Gibt es einen kuerzeren Weg zum Ziel?** (Manchmal reicht ein Hotfix statt 15 Agents)

```
=== FIRST PRINCIPLES CHECK ===

AKTUELLER BOTTLENECK: [Wo stockt es im Funnel?]
BENOETIGTE AGENTS: [Welche adressieren den Bottleneck?]
ALTERNATIVE: [Gibt es schnelleren Weg ohne Agents?]

ENTSCHEIDUNG: [ ] Agents starten  [ ] Alternativen Weg gehen
```

**Ohne diese Analyse werden KEINE Agents gestartet!**

---

## SCHRITT 2: Agents starten (nach Analyse)

Nur wenn First-Principles Analyse abgeschlossen:

```bash
powershell -ExecutionPolicy Bypass -File ".\scripts\start-agents.ps1" -Preset full
```

---

## Warum First Principles zuerst?

- **17.01.2026 Learning:** Agents diagnostizierten falsche Probleme wegen Test-Account Metriken
- **Ressourcen-Verschwendung:** 15 Agents parallel wenn 1 Hotfix reicht
- **Autonomie mit Verstand:** Erst verstehen, dann handeln

---

Alternativ fuer interaktive Auswahl: `/priority-mode`
