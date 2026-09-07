# Odoo deployment

The Railway **Odoo** service builds from this directory rather than running
the stock `odoo:19.0` image, for one reason: it needs a Paystack payment
provider, and Odoo has no runtime module upload — a custom addon has to be
on the addons path when the server starts.

```
odoo/
  Dockerfile              FROM odoo:19.0, plus addons/ → /mnt/extra-addons
  addons/payment_paystack the module (see its own README)
```

## After a deploy that changes the module

Odoo caches the module list. To pick up a new or changed addon:

1. Turn on developer mode: **Settings → General Settings → Developer Tools →
   Activate the developer mode**.
2. **Apps → Update Apps List**.
3. Search **Paystack**, remove the default "Apps" filter, and Install.

For a change to an *already installed* module, use **Apps → Paystack →
Upgrade** instead, which re-runs its data files.

## What is deliberately not here

No `odoo.conf`. The official image ships one at `/etc/odoo/odoo.conf` that
already has `addons_path = /mnt/extra-addons` and `data_dir = /var/lib/odoo`,
and the Railway service passes its database settings as environment
variables. Overriding the config file would mean re-stating all of that, with
one more place for it to drift.
