# HANDOFF: Conversion Analysis (17.01.2026)

## KONTEXT (First Principles Erkenntnisse)

**Brutale Wahrheit:**
- 56 "User" in DB → davon 0 echte organische Signups
- 27 "Real Users" stammen von:
  - Magic Link SENDEN → Account auto-created (Outreach-Empfänger, nie geklickt/genutzt)
  - Manuell/Admin erstellt (Test-Accounts)
- KEINE Bots - aber auch KEINE echten Signups
- 146 Outreach-Klicks → unklar wie viele echte Menschen vs Bot-Klicks

**Bereits gefixt:**
- Magic Link User zählen nicht mehr als "echte" User
- Magic Link Expiry: 7d → 30d erweitert
- Demo Page CTAs: Smart Routing (eingeloggt → Dashboard, nicht eingeloggt → Email Modal)
- DEMO30 aus cta_url entfernt

---

## TASKS FÜR PLAN MODE

### 1. Klick-Analyse (PRIORITY)
**Ziel:** Herausfinden welche der 146 Outreach-Klicks ECHTE Menschen waren

**Ansätze:**
- Klicks mit Session-Dauer > 10 Sekunden = wahrscheinlich echt
- Klicks die Demo-Page scrollten = wahrscheinlich echt
- Klicks von Corporate Email-Domains (info@, hello@) mit <1s Session = Bot
- User-Agent Analyse (Microsoft SafeLinks, Google URL Scanner, etc.)

**Daten prüfen:**
- `outreach_clicks` Tabelle
- `demo_generations.demo_page_viewed_at` + `demo_view_count`
- Korrelation zwischen Klick-Timestamp und Demo-View-Timestamp

### 2. Demo-Page Heat Check (Chrome MCP)
**Ziel:** Wo steigen echte Besucher aus?

**Test-Flow:**
1. Demo-Page öffnen als nicht-eingeloggter User
2. Scroll-Verhalten tracken
3. CTA-Buttons testen
4. Email-Modal Flow testen
5. Nach Unlock: Sehen User alle Responses?

**Fragen:**
- Ist der Value Proposition klar in <5 Sekunden?
- Sind die AI-Responses gut genug sichtbar?
- Ist der CTA zu früh/zu spät?

### 3. Outreach Pivot (Optional/Extra)
**Problem:** Cold Email hat ~0 echte Conversions trotz 1500+ Emails

**Alternative Ansätze:**
- LinkedIn DMs (persönlicher, höhere Response Rate)
- Warm Intros über Freunde/Netzwerk
- Content Marketing (SEO, Blog)
- Community Engagement (Reddit, Facebook Groups für Restaurant Owner)

**Frage:** Lohnt sich weiteres Cold Email Optimieren oder komplett pivoten?

### 4. Product-Market Fit Check
**Kernfrage:** Ist "AI Review Responses" ein echtes Problem oder Nice-to-Have?

**Signale für PMF-Problem:**
- 0 zahlende Kunden
- 0 Activation bei echten Leads
- Restaurant Owner haben wenig Zeit → Review-Antworten = niedrige Priorität

**Zu prüfen:**
- Gibt es Competitors die Geld verdienen? (ReviewReply, etc.)
- Was sagen echte Restaurant Owner wenn man sie fragt?
- Ist der Preis das Problem oder das Produkt?

---

## DATEN-ENDPUNKTE

```bash
# Admin Stats (mit Test-Account Filter)
curl -H "x-admin-key: $ADMIN_SECRET" "https://review-responder.onrender.com/api/admin/stats"

# User Liste (real vs test)
curl -H "x-admin-key: $ADMIN_SECRET" "https://review-responder.onrender.com/api/admin/user-list"

# Email Dashboard (Klicks, Opens)
curl -H "x-admin-key: $ADMIN_SECRET" "https://review-responder.onrender.com/api/admin/email-dashboard"

# Sales Dashboard
curl -H "x-admin-key: $ADMIN_SECRET" "https://review-responder.onrender.com/api/admin/sales-dashboard"
```

---

## ERFOLGS-KRITERIEN

Nach dieser Analyse sollten wir wissen:
1. Wie viele ECHTE Menschen haben Demo gesehen (nicht Bots)
2. Wo im Funnel verlieren wir sie
3. Ob Cold Email weiter optimieren oder pivoten
4. Ob wir ein PMF-Problem haben

---

## ADMIN SECRET

Siehe `.claude/secrets.local` → `ADMIN_SECRET`
