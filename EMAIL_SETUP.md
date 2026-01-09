# ReviewResponder Email Setup (Kostenlose Lösung)

## Aktuelle Email-Konfiguration

### Kostenlose Lösung mit Resend
- **Von-Adresse**: `ReviewResponder <onboarding@resend.dev>`
- **Provider**: Resend (kostenlos bis 100 Emails/Tag)
- **Status**: ✅ Funktioniert sofort ohne weitere Konfiguration

### Verwendung im Code
- **Password Reset**: Sendet Passwort-Reset Links
- **Welcome Email**: Sendet Willkommens-Email mit 20% Rabatt Code (SAVE20)
- **Transactional**: Alle System-generierten Emails

## Vorteile der kostenlosen Lösung
1. **Keine Domain-Kosten**: Keine eigene Domain nötig
2. **Sofort einsatzbereit**: Funktioniert mit deinem bestehenden Resend API Key
3. **100 Emails/Tag kostenlos**: Reicht für ~3 neue User pro Tag
4. **Professionelles Aussehen**: "ReviewResponder" als Absendername

## Emails werden gesendet für:
1. **Passwort zurücksetzen** (`/api/auth/forgot-password`)
2. **Exit-Intent Popup** (`/api/capture-email`) - Welcome Email mit Discount

## Zukünftiges Upgrade (Optional)

Wenn du später eine eigene Domain möchtest:

### Option 1: Email Forwarding (Kostenlos)
- Viele Domain-Registrare bieten kostenloses Email-Forwarding
- Z.B. Namecheap: Domain + Email-Forwarding für ~10€/Jahr
- Emails an `hello@reviewresponder.com` → weiterleiten an `berend.mainz@web.de`

### Option 2: Custom Domain in Resend ($20/Monat)
- Eigene Domain in Resend verifizieren
- SPF, DKIM, DMARC automatisch konfiguriert
- Unbegrenzte Emails von deiner Domain

### Option 3: Google Workspace (6€/Monat/User)
- Professionelle Gmail mit eigener Domain
- 30GB Speicher
- Google Docs, Drive, etc.

## Test-Anleitung

1. **Password Reset testen**:
   ```
   1. Gehe zu https://review-responder-frontend.onrender.com/forgot-password
   2. Gib eine Email-Adresse ein
   3. Email sollte von "ReviewResponder <onboarding@resend.dev>" kommen
   ```

2. **Exit-Intent Popup testen**:
   ```
   1. Gehe zu https://review-responder-frontend.onrender.com
   2. Warte 5 Sekunden
   3. Bewege Maus zum Browser-Tab (als würdest du gehen)
   4. Gib Email in Popup ein
   5. Welcome Email mit SAVE20 Code sollte ankommen
   ```

## Resend Dashboard
- **URL**: https://resend.com/emails
- Hier siehst du alle gesendeten Emails
- Status, Öffnungsrate, etc.

## Wichtige Limits (Kostenlos)
- **100 Emails/Tag**: Reicht für Anfang
- **Von-Adresse**: Muss `@resend.dev` sein
- **Rate Limit**: 10 Emails/Sekunde

---

**Tipp**: Für den Anfang ist die kostenlose Lösung perfekt. Wenn du 30+ zahlende Kunden hast ($1000+/Monat), kannst du easy auf eine eigene Domain upgraden!