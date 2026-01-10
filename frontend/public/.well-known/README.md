# Apple Pay Domain Verification

To enable Apple Pay, download the verification file from Stripe Dashboard:

1. Go to: https://dashboard.stripe.com/settings/apple_pay
2. Click "Add new domain"
3. Enter: tryreviewresponder.com
4. Download the verification file
5. Save it here as: `apple-developer-merchantid-domain-association` (no extension)
6. Commit & push to deploy

The file should be accessible at:
https://tryreviewresponder.com/.well-known/apple-developer-merchantid-domain-association
