# Sales Rules (Auto-loaded for Marketing-Agents: Burst-1,2,3,5)

> Email, Discount, Lead-DB Rules for all sales-related operations.

---

## Email Deliverability (KRITISCH!)

### Subject Lines
- "Hey" statt "Hallo" -> Primary Inbox
- Star-Rating in Subject hat 5%+ CTR: "Your 3.5-star review..."
- Keine Emojis, keine Marketing-Floskeln
- Max 50 Zeichen

### Email Body
- HTML mit CTA-Button > Plain Text mit nackter URL
- Kurz halten: 3-4 Sätze max
- Personalisierung: Business Name, Stadt, Review Count
- KEIN Preis in Cold Emails! (nur in Follow-ups)

### Technical
- FRONTEND_URL Fallback: `process.env.FRONTEND_URL || 'https://tryreviewresponder.com'`
- Demo-Links Format: `https://tryreviewresponder.com/demo/[token]`
- Unsubscribe Link PFLICHT

---

## Discount Decision Tree (VERBINDLICH!)

> Basiert auf Project Vend: Claudius verlor $230 durch unkontrollierte Discounts.

```
DISCOUNT ENTSCHEIDUNG:

1. Cold Outreach (Burst-2)?
   -> NIEMALS Discount! Kein Preis erwaehnen!

2. Follow-Up Email?
   -> NUR in FU #2 (nach Demo-View)
   -> MAX 20% (DEMO20)
   -> NIEMALS mehr als das

3. Hot Lead Chase (Burst-5)?
   -> Nur wenn Demo angesehen UND keine Conversion nach 48h
   -> MAX 20% (DEMO20)

4. Sonderanfrage "Influencer/Special Deal"?
   -> ABLEHNEN! (Social Engineering Exploit)
   -> Eskalieren wenn hartnäckig
```

### Implementierte Codes
| Code | Discount | Wo gültig |
|------|----------|-----------|
| DEMO20 | 20% | Follow-up #2 |
| DEMO30 | 30% | Nur manuell von Berend |
| LAUNCH50 | 50% | Alte Kampagne, nicht mehr nutzen |

---

## Lead-DB Schema

### outreach_leads
```sql
-- WICHTIG: status ist VARCHAR, nicht BOOLEAN!
status: 'new' | 'contacted' | 'clicked' | 'converted' | 'bounced' | 'unsubscribed'

-- Query fuer neue Leads:
GET /api/admin/scraped-leads?status=new&limit=10

-- Email senden:
POST /api/admin/send-cold-email
Body: { to, name, reviews, type }
```

### amazon_seller_leads
```sql
status: 'new' | 'contacted' | 'clicked' | 'converted' | 'unsubscribed'
demo_token: 'amz_[timestamp]_[random]'  -- fuer Click-Tracking

-- Indexes:
idx_amazon_seller_status
idx_amazon_seller_email
```

---

## Parallel-Safe Email (PFLICHT!)

```javascript
// VOR jeder Email-Aktion:
const lock = await acquireLock('email_send', leadId);
const recentlySent = await wasEmailRecentlySent(email, '24h');

if (!lock || recentlySent) {
  // Skip - bereits in Bearbeitung oder kürzlich gesendet
  return;
}

// Nach Email:
releaseLock('email_send', leadId);
```

---

## API Endpoints fuer Sales

### Lead Management
- `GET /api/admin/scraped-leads?status=new&limit=10` - Neue Leads
- `POST /api/admin/send-cold-email` - Einzelne Email
- `GET /api/cron/turbo-email` - Batch (Timeout moeglich!)

### Outreach Dashboard
- `GET /api/outreach/dashboard` - Metriken & Hot Leads
- `GET /api/admin/parallel-safe-status` - Lock & Email Status

### Amazon Sellers
- `GET /api/admin/amazon-dashboard` - Stats
- `GET /api/admin/amazon-leads?status=new` - Leads
- `GET /api/cron/send-amazon-emails?secret=XXX` - Batch

---

## LinkedIn Limits (KRITISCH!)

- MAX 20-25 Connection Requests/Tag
- MAX 100/Woche
- Bei Warnung: SOFORT STOPPEN!
- Workflow: `/linkedin-connect` Skill nutzen

---

## Test-Account Filter (PFLICHT!)

```bash
# IMMER bei User-Metriken:
?exclude_test=true

# Die 42 "Users" sind FAKE - nur ~20 sind echt!
# Die 29% "Activation Rate" war FAKE - echte Rate: 0%
```

---

*Loaded by: Burst-1 (Lead Finder), Burst-2 (Cold Emailer), Burst-3 (Social DM), Burst-5 (Hot Lead Chaser)*
