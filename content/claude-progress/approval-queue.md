# Approval Queue - Human-in-the-Loop Decisions

> Burst-15 (Approval Gate) monitort diese Datei alle 5 Minuten.
> Berend antwortet in berend-feedback.md.

---

## 🔴 PENDING APPROVALS

_Keine ausstehenden Approvals_

---

## TEMPLATE FÜR APPROVAL REQUEST

```markdown
## APPROVAL NEEDED [TIMESTAMP]

**From:** Burst-X (Agent Name)
**Type:** [Discount >30% | New Strategy | API Spend | First Conversion | Other]
**Priority:** 🔴 Critical / 🟡 Important / 🟢 Informational

### Context
[Was passiert? Warum ist Approval nötig?]

### My Recommendation
[Was würde ich tun?]
[Begründung mit Daten]

### Risk
[Was könnte schiefgehen?]

### Timeout
[X Minuten] → Default: [APPROVE/REJECT/PROCEED]

---

**BEREND RESPONSE:** [waiting]
**RESOLUTION:** [pending]
```

---

## APPROVAL LEVELS

| Level | Timeout | Default Action | Examples |
|-------|---------|----------------|----------|
| 🔴 Critical | 30 min | REJECT | Discount >40%, First conversion, API >$50 |
| 🟡 Important | 2 hours | PROCEED | New A/B test, Strategy change, Discount 30-40% |
| 🟢 Informational | None | N/A | Metrics report, Learning dokumentiert |

---

## ✅ RESOLVED (Letzte 24h)

_Noch keine Approvals gelöst_

---

## INSTRUCTIONS FÜR AGENTS

1. **Wann hierher schreiben:**
   - Discount-Anfrage >30%
   - Erste Conversion überhaupt
   - Neue Strategie vorschlagen (Burst-12)
   - API Spend >$20/Tag
   - Jede "unsicher" Situation

2. **Format:**
   - Nutze das Template oben EXAKT
   - Setze korrekten Priority-Level
   - Begründe mit DATEN, nicht Vermutungen
   - Setze realistischen Timeout

3. **Nach dem Schreiben:**
   - Warte auf Resolution
   - Check berend-feedback.md alle 5 min
   - Bei Timeout: Handle Default Action
   - Dokumentiere Ergebnis in learnings.md

---

## INSTRUCTIONS FÜR BEREND

1. **Wie antworten:**
   Schreibe in berend-feedback.md:
   ```
   ## APPROVAL RESPONSE [Timestamp]

   Re: [Approval von Burst-X]
   Decision: APPROVED / REJECTED / MODIFIED
   Notes: [Begründung]
   ```

2. **Kill Switch:**
   ```
   ## STOP ALL
   [Alle Agents pausieren]

   ## STOP Burst-X
   [Einzelner Agent pausiert]
   ```

3. **Modifizieren:**
   ```
   ## MODIFIED

   Statt 40% Discount: 30% mit Deadline
   ```

---

*Diese Datei wird von Burst-15 (Approval Gate) verwaltet.*
