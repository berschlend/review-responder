# Approval Queue - Human-in-the-Loop Decisions

> Burst-15 (Approval Gate) monitort diese Datei alle 5 Minuten.
> Berend antwortet in berend-feedback.md.

---

## 🔴 PENDING APPROVALS

---

## 💡 NEUE STRATEGIE VORGESCHLAGEN [2026-01-16 ~17:30 UTC]

**From:** Burst-12 (Creative Strategist)
**Type:** New Strategy
**Priority:** 🟡 Important

### Stagnation Erkannt

**Betroffene Metrik:** User Activation Rate
**Trend:** 34% seit 48h+ (66% der User haben NIE das Produkt genutzt)
**Sample Size:** 44 registrierte User, 29 dormant

**Evidence:**
- Burst-6 (User Activator) letzter Heartbeat: 15.01 14:08 UTC - läuft nicht
- Nudge-Magic-Users Cron: "No inactive magic link users to nudge" → 0 Emails
- Activation-Strategie wird de facto NICHT ausgeführt

### Root Cause Hypothese

Die 29 dormanten User sind **Magic Link Auto-Registrations**:
1. Sie klickten auf Email-Link aus Outreach
2. Wurden automatisch registriert (ohne aktiv zu wollen)
3. **Wissen nicht dass sie einen Account haben**
4. Haben keine Intention das Produkt zu nutzen

Das erklärt warum Nudge-Emails nicht funktionieren - diese User erinnern sich nicht mal an ReviewResponder!

### Vorgeschlagene Tests

**OPTION A: Demo-Expiry Urgency Email** ⭐ (Empfohlen)
- **Was:** Statt generischem Onboarding: "Your personalized demo for [Business] expires in 48h - see how AI would respond to your reviews"
- **Warum:** Wir haben BEREITS Demos für diese User generiert. Zeige den VALUE + URGENCY
- **Kosten:** ~2h Backend-Änderung (neuer Email-Template)
- **Erwarteter Impact:** +15% Activation (5 von 29 werden neugierig)
- **Test-Dauer:** 3 Tage
- **Risiko:** Gering - Emails sind bereits in Pipeline

**OPTION B: One-Click First Value**
- **Was:** Wenn User einloggt → Zeige automatisch eine AI Response für SEIN Business (aus bestehendem Demo)
- **Warum:** Entfernt Friction (kein Copy/Paste nötig), zeigt sofort Wert
- **Kosten:** ~4h Frontend-Änderung (Dashboard anpassen)
- **Erwarteter Impact:** +25% Activation für EINLOGGEDE User
- **Test-Dauer:** 7 Tage
- **Risiko:** Mittel - Nutzt nur was wenn User einloggen

**OPTION C: Founder Personal Touch (High-Touch)**
- **Was:** Persönliche Email von "Berend" an Top-10 Businesses (höchste Review-Anzahl)
- **Warum:** B2B braucht oft persönlichen Kontakt, Cold Emails werden ignoriert
- **Kosten:** ~1h für 10 personalisierte Emails
- **Erwarteter Impact:** 2-3 Aktivierungen (20-30% der Angeschriebenen)
- **Test-Dauer:** 5 Tage
- **Risiko:** Gering - Kleine Testgruppe

### Risiken

- **Option A:** Könnte als Spam empfunden werden (wir haben schon mehrere Emails geschickt)
- **Option B:** Löst das Problem nicht wenn User nie einloggen
- **Option C:** Skaliert nicht, aber gut für Learnings

### Meine Empfehlung

**OPTION A zuerst** (niedrigste Kosten, nutzt bestehende Assets)
→ Bei Erfolg: Mit Option B kombinieren
→ Bei Misserfolg: Option C testen für qualitative Learnings

### Timeout

4 Stunden → Default: OPTION A testen

---

**BEREND RESPONSE:** "handle immer autonom" ✅

**RESOLUTION:** ✅ IMPLEMENTED [2026-01-16 ~17:45 UTC]
- Demo-Expiry Emails: 0 (Demos noch <3 Tage alt - normal)
- **Re-Engagement Magic Links: 8 gesendet!**
- Aktion: Existierende Crons getriggert (reengage-clickers)

---

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

### [2026-01-15 ~17:45 UTC] Burst-12 Strategy Proposal
- **Decision:** APPROVED (Autonom)
- **Berend Response:** "handle immer autonom"
- **Actions Taken:** 8 Re-Engagement Magic Links gesendet
- **Outcome:** Pending - tracking activation rate
- **Learning:** Berend vertraut den Agents für Standard-Strategien

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
