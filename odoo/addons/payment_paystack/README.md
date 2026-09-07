# payment_paystack (Odoo 19)

Adds **Paystack** to Odoo's payment providers list.

## Why this module exists

Odoo 19 ships no Paystack provider — `payment_flutterwave`, `payment_paymob`,
`payment_razorpay` and twenty-odd others, but not Paystack. Every Paystack
module on the Odoo Apps Store targets 14.0–18.0, and the official
[PaystackHQ/plugin-odoo](https://github.com/PaystackHQ/plugin-odoo) is Odoo 14
with two commits. None of them load on 19: the payment framework moved to
`odoo.addons.payment.logging`, `REPORT_REASONS_MAPPING`, `_apply_updates`,
`_extract_reference` and `_send_api_request` — none of which exist in 14–17.

So this is written against Odoo 19's own provider contract rather than ported
from an older one. It follows `addons/payment_flutterwave` in the 19.0 branch
closely, that being the closest analogue: an African, redirect-flow provider
with a signed webhook.

## What it does

- Redirect flow. Odoo initialises a transaction with
  `POST /transaction/initialize` and sends the customer to the
  `authorization_url` Paystack returns.
- On the way back, and again from the webhook, Odoo calls
  `GET /transaction/verify/{reference}` and applies **that** result. The
  redirect's query string is only ever used to look the transaction up.
- The webhook is verified with HMAC-SHA512 over the raw request body, keyed
  by the secret key. Paystack issues no separate webhook secret, which is why
  there is no third credential field.
- Amounts cross the boundary in the currency's subunit (`× 100`), and are
  converted back in `_extract_amount_data` so Odoo's own amount check
  compares like with like.

## Configuring it

1. **Invoicing → Configuration → Payment Providers → Paystack**
2. *Credentials*: Public Key and Secret Key from the Paystack dashboard.
3. Set **State** to *Enabled* (or *Test mode* with `pk_test`/`sk_test` keys).
4. In the Paystack dashboard, add the webhook URL:
   `https://<your-odoo-host>/payment/paystack/webhook`

Supported currencies are GHS, KES, NGN, USD and ZAR — an account is enabled
for a subset, and Odoo only offers the ones that overlap with the order's.

Tokenisation is deliberately off. Paystack can charge a saved authorization,
but storing card tokens raises the compliance bar and this deployment sells
one-off digital goods.
