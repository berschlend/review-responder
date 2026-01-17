# /data-analyze - Data Quality & Fraud Detection

> Analysiert Metriken auf Verfälschung durch Bots, Tests, und Fake-Events.

---

## Usage

```
/data-analyze [metric]
```

### Metrics

| Metric | Was wird geprüft |
|--------|------------------|
| `ctr` | Click-Through-Rate auf Bot-Clicks |
| `users` | User-Registrierungen auf Test-Accounts |
| `demos` | Demo-Generierungen auf Bot-Pattern |
| `emails` | Email-Delivery auf Bounces/Spam |
| `all` | Komplette Data Quality Analyse |

---

## Bot Detection Patterns

### 1. Timing Anomalies
```javascript
// Verdächtig wenn:
// - Viele Events in derselben Minute
// - Events um Mitternacht (UTC 00:00)
// - Ungewöhnlich regelmäßige Abstände
```

### 2. Test Account Patterns
```javascript
const testPatterns = [
  'user@domain.com',
  'xxx@xxx.com',
  'test@',
  '@example.',
  'berend',      // Owner
  'mainz',       // Owner
  '%40',         // URL-encoded @
  'placeholder'
];
```

### 3. Email Security Scanners
- Microsoft 365 Safe Links
- Google Safe Browsing
- Proofpoint URL Defense
- Mimecast URL Protect

**Detection:** Klicken alle Links in einer Email gleichzeitig.

### 4. Missing Data
- `business_name = null`
- `email = null`
- Incomplete records

---

## Output Format

```
═══════════════════════════════════════════
       DATA QUALITY REPORT: [metric]
═══════════════════════════════════════════

REPORTED vs REAL:
  Reported: X
  Real:     Y
  Inflation: Z%

SUSPICIOUS PATTERNS:
  [Pattern 1]: N occurrences
  [Pattern 2]: M occurrences

RECOMMENDATION:
  [What to do about it]

═══════════════════════════════════════════
```

---

## Implementation

### analyze-ctr.js (bereits erstellt)
`scripts/analyze-ctr.js`

### analyze-users.js
```javascript
// Prüft User-Registrierungen auf:
// - Test-Emails
// - Keine Responses generiert
// - created_via_demo ohne Demo-Link-Click
```

### analyze-demos.js
```javascript
// Prüft Demo-Generierungen auf:
// - Gleiche IP-Adresse
// - Unrealistisch schnelle Sequenzen
// - Test-Business-Namen ("Test", "Demo", "ACME")
```

---

## API Enhancement (TODO)

Backend sollte filtern können:

```
GET /api/outreach/dashboard?exclude_bots=true
GET /api/admin/stats?exclude_test=true&exclude_bots=true
```

### Bot Detection Logic (Server-Side)

```javascript
function isBotClick(click) {
  const hour = new Date(click.clicked_at).getUTCHours();
  const minute = new Date(click.clicked_at).getUTCMinutes();

  // Midnight burst detection
  if (hour === 0 && minute < 20) {
    // Check if many clicks in same minute
    return true;
  }

  // Test email patterns
  const email = click.email?.toLowerCase() || '';
  const testPatterns = ['test@', 'xxx@', 'user@domain', '%40'];
  if (testPatterns.some(p => email.includes(p))) {
    return true;
  }

  return false;
}
```

---

## Cron Integration

`/api/cron/data-quality-check` - Täglich um 06:00

```javascript
// Alert wenn:
// - Bot-Click-Rate > 50%
// - Test-Account-Rate > 20%
// - Metric-Inflation > 100%
```

---

## First Principles: Warum das wichtig ist

1. **Falsche Metriken → Falsche Entscheidungen**
   - 4.4% CTR suggeriert "Email funktioniert super"
   - 1.4% CTR zeigt "Email ist okay, aber nicht der Hebel"

2. **Resource Allocation**
   - Mit Fake-84 Clicks: "Fokus auf Conversion der Clicker"
   - Mit Real-27 Clicks: "Vielleicht mehr Lead Gen nötig"

3. **Vertrauen in Daten**
   - Jede Metrik sollte validiert sein
   - "Trust but verify"

---

## Quick Commands

```bash
# CTR analysieren
node scripts/analyze-ctr.js

# Alle Metriken prüfen (TODO)
node scripts/data-quality-full.js
```

---

*Created: 2026-01-17*
*Author: Claude (Data Quality Initiative)*
