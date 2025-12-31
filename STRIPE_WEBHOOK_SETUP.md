# Stripe Webhook Setup & Testing

## Environment Variables Required

Add to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from Stripe Dashboard → Webhooks → Your endpoint → Signing secret
```

## Testing with Stripe CLI

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   
   This will output a webhook signing secret (starts with `whsec_`). Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`.

4. **Trigger test events**:
   ```bash
   # Test checkout.session.completed
   stripe trigger checkout.session.completed
   
   # Test invoice.payment_failed
   stripe trigger invoice.payment_failed
   
   # Test customer.subscription.deleted
   stripe trigger customer.subscription.deleted
   ```

5. **Check server logs** for webhook processing results.

## Production Setup

1. **Create webhook endpoint in Stripe Dashboard**:
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`
   - Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

2. **Verify webhook is working**:
   - Complete a test checkout
   - Check database: `businesses.subscription.status` should be `"active"`
   - Check `nextBillingDate` is set to 30 days from now






