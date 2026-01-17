# Email Deliverability Fix

> Erstellt: 18.01.2026
> Status: ✅ FIXED - SPF Record aktualisiert am 17.01.2026

---

## Das Problem

Emails werden via **Brevo** und **Amazon SES** gesendet, aber der SPF Record autorisiert nur **ImprovMX**.

**Konsequenz:** Emails bekommen SPF FAIL → landen im Spam!

---

## Aktuelle DNS Records

### SPF ✅ FIXED!
```
# ALT (Problem):
v=spf1 include:spf.improvmx.com ~all

# NEU (Fixed 17.01.2026):
v=spf1 include:spf.improvmx.com include:spf.brevo.com include:amazonses.com include:resend.com ~all
```

**Hinzugefügt:**
- ✅ `include:spf.brevo.com` (Brevo/Sendinblue)
- ✅ `include:amazonses.com` (Amazon SES)
- ✅ `include:resend.com` (Resend)

### DKIM ✅ ALLE KONFIGURIERT!
| Provider | Status |
|----------|--------|
| Resend | ✅ Konfiguriert |
| Brevo | ✅ Konfiguriert (brevo1._domainkey, brevo2._domainkey) |
| Amazon SES | ✅ Konfiguriert (3 CNAME Records) |

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

## ✅ ERLEDIGT (17.01.2026)

| Task | Status |
|------|--------|
| SPF Record fixen | ✅ Via Namecheap DNS |
| Brevo DKIM | ✅ War schon konfiguriert |
| Amazon SES DKIM | ✅ War schon konfiguriert |
| Resend DKIM | ✅ War schon konfiguriert |

---

## ⏳ AUSSTEHEND

### 1. DNS Propagation abwarten (24-48h)
- SPF Änderung muss weltweit propagieren
- Bis dahin: Keine neuen Cold Emails senden!

### 2. Email Score testen
```bash
# Nach 24h: Test-Email an mail-tester.com senden
# Erwarteter Score: >7 (vorher wahrscheinlich <5)
```

### 3. Product-Market Fit validieren (WICHTIG!)
> **Siehe:** [anruf-liste.md](./anruf-liste.md)

Berend muss 5 Leads anrufen um zu validieren ob Reviews überhaupt ein Problem sind:
- Wenn JA → SPF war das Problem, weiter mit Outreach
- Wenn NEIN → Pivot nötig, falsches Problem gelöst

### 4. Google Ads vorbereiten (nach Chrome Store Approval)
> **Siehe:** [google-ads-plan.md](./google-ads-plan.md)

- €100 Testbudget
- Keywords + Ads sind vorbereitet
- Warten auf Chrome Extension Approval

---

## 📋 MASTER TODO

| # | Task | Owner | Status | Link |
|---|------|-------|--------|------|
| 1 | DNS Propagation abwarten | Auto | ⏳ 24-48h | - |
| 2 | Mail-Tester Score prüfen | Claude | ⏳ Nach 24h | - |
| 3 | **5 Leads anrufen** | **Berend** | 🔴 TODO | [anruf-liste.md](./anruf-liste.md) |
| 4 | Chrome Store Approval | Google | ⏳ Pending | - |
| 5 | Google Ads starten | Claude | ⏳ Nach #4 | [google-ads-plan.md](./google-ads-plan.md) |

---

## Quick Actions

```bash
# 1. DNS Records prüfen (nach 24h)
nslookup -type=TXT tryreviewresponder.com

# 2. Erwartete Ausgabe (NEU):
# v=spf1 include:spf.improvmx.com include:spf.brevo.com include:amazonses.com include:resend.com ~all

# 3. Mail Score testen
# → mail-tester.com öffnen, Email senden, Score checken
```

---

## Verwandte Dokumente

| Dokument | Inhalt |
|----------|--------|
| [anruf-liste.md](./anruf-liste.md) | 5 Leads mit Telefonnummern für PMF-Validierung |
| [google-ads-plan.md](./google-ads-plan.md) | Keywords, Ads, Budget für nach Chrome Store |
| [real-user-metrics.json](./real-user-metrics.json) | Echte User-Zahlen (0 organic!) |
