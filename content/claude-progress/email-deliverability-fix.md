# Email Deliverability Fix

> Erstellt: 18.01.2026
> Status: KRITISCH - SPF Record fehlt Email Provider!

---

## Das Problem

Emails werden via **Brevo** und **Amazon SES** gesendet, aber der SPF Record autorisiert nur **ImprovMX**.

**Konsequenz:** Emails bekommen SPF FAIL → landen im Spam!

---

## Aktuelle DNS Records

### SPF (PROBLEM!)
```
v=spf1 include:spf.improvmx.com ~all
```

**Fehlend:**
- `include:spf.brevo.com` (Brevo/Sendinblue)
- `include:amazonses.com` (Amazon SES)
- `include:resend.com` (Resend)

### DKIM
| Provider | Status |
|----------|--------|
| Resend | ✅ Konfiguriert |
| Brevo | ❌ FEHLT |
| Amazon SES | ❓ Unbekannt |

### DMARC
```
v=DMARC1; p=none; rua=mailto:dmarc@tryreviewresponder.com
```
**Problem:** `p=none` = kein Enforcement, nur Monitoring

---

## FIX (Render DNS oder Domain Provider)

### 1. SPF Record korrigieren

**Alter Eintrag löschen und ersetzen mit:**
```
v=spf1 include:spf.improvmx.com include:spf.brevo.com include:amazonses.com include:resend.com ~all
```

### 2. Brevo DKIM hinzufügen

In Brevo Dashboard → Settings → Senders & IPs → Domain Management:
1. Domain "tryreviewresponder.com" hinzufügen
2. DKIM Key kopieren
3. Als TXT Record hinzufügen:
   - Name: `brevo._domainkey`
   - Value: (von Brevo Dashboard)

### 3. Amazon SES DKIM (falls genutzt)

In AWS SES Console → Verified Identities → tryreviewresponder.com:
1. DKIM aktivieren
2. 3 CNAME Records hinzufügen (von AWS)

### 4. DMARC verschärfen (optional, später)

```
v=DMARC1; p=quarantine; rua=mailto:dmarc@tryreviewresponder.com
```

---

## Email Content Analyse

### Aktuelle Cold Email (Sequence 1, EN):
```
Subject: {business_name} - quick question

Hi,

I noticed {business_name} has {review_count}+ Google reviews - impressive!

Quick question: How much time does your team spend responding to customer reviews each week?

I built a tool that helps with exactly this - 3 seconds per response instead of 5 minutes.

If you're interested: https://tryreviewresponder.com

Cheers,
Berend

P.S. I'm the founder, feel free to reply if you have any questions.
```

### Spam-Trigger Analyse

| Element | Status | Risiko |
|---------|--------|--------|
| Subject Line | ✅ OK | Personalisiert, keine Spam-Wörter |
| "I built a tool" | ⚠️ | Könnte als Self-Promo flaggen |
| Einziger Link | ✅ OK | Gut - kein Link-Spam |
| "P.S." | ✅ OK | Macht es persönlicher |
| Keine Emojis | ✅ OK | Business-like |
| Kurze Email | ✅ OK | <150 Wörter |

### Verbesserungsvorschläge

1. **SPF/DKIM fixen** - Das ist der Hauptgrund!
2. **Tracking Pixel entfernen** - Kann als Spam-Signal wirken
3. **Reply-Aufforderung verstärken** - "Just hit reply" statt Link

---

## Test nach Fix

1. SPF/DKIM Records ändern
2. 24h warten (DNS Propagation)
3. Test-Email an mail-tester.com senden
4. Score muss >7 sein (aktuell wahrscheinlich <5)

---

## Quick Actions

```bash
# 1. DNS Records prüfen
nslookup -type=TXT tryreviewresponder.com
nslookup -type=TXT _dmarc.tryreviewresponder.com

# 2. Nach Fix testen
curl -X POST "https://www.mail-tester.com/api/check" -d "email=test@mail-tester.com"
```
