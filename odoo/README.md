# Odoo deployment

The Railway **Odoo** service runs a custom image built from this directory
rather than the stock `odoo:19.0`, for one reason: it needs a Paystack
payment provider, and a custom addon has to be on the addons path when the
server starts.

```
odoo/
  Dockerfile              FROM odoo:19.0, plus addons/ → /mnt/extra-addons
  addons/payment_paystack the module (see its own README)
```

## How the image reaches Railway

Not by Railway building from this repository. Railway's GitHub connection on
this account cannot read *any* repository — attaching one to a service fails
with `User does not have access to the repo`, including a public repository
that two services in the same project are already deployed from. So the link
itself is broken, not the permissions on one repo, and re-granting access per
repository does not fix it.

A container image needs no such link. So:

1. `.github/workflows/odoo-image.yml` builds this directory on GitHub
   Actions, where the credentials are valid, and pushes to
   `ghcr.io/chaldeastudios/kakitahi-odoo:latest`.
2. The GHCR package must be **public**, once, so Railway can pull it without
   registry credentials — Railway's image sources take credentials only
   through its dashboard. GitHub → Packages → `kakitahi-odoo` → Package
   settings → Change visibility → Public. The package contains only the
   Paystack addon and the upstream Odoo image; there is nothing secret in
   it, and no key is baked in (they are entered in Odoo's own UI).
3. The Railway Odoo service's source is that image tag. A new build is
   picked up by redeploying the service.

If the Railway↔GitHub connection is ever repaired (disconnect and reconnect
GitHub in Railway's account settings), pointing the service straight at this
repository with root directory `odoo/` would also work, and this workflow
becomes redundant. It is not the assumed route because it has not worked.

## Why the module is not simply imported into the running Odoo

`base_import_module` is installed, and Apps → Import Module accepts a zip.
It will not work here. Odoo 19's `_import_module` loads only `.xml`, `.csv`
and `.sql` from the manifest and logs *"skip unsupported file"* for anything
else, and `_get_modules_to_load_domain` excludes imported modules from the
registry with the comment *"imported modules are not expected to be loaded
as regular modules"*. Import Module is for data and theme modules. Paystack
is Python — models and controllers — so none of it would ever run.

## After a deploy that changes the module

Odoo caches the module list. To pick up a new or changed addon:

1. Turn on developer mode: **Settings → General Settings → Developer Tools →
   Activate the developer mode**.
2. **Apps → Update Apps List**.
3. Search **Paystack**, remove the default "Apps" filter, and Install.

For a change to an *already installed* module, use **Apps → Paystack →
Upgrade** instead, which re-runs its data files.

Then **Settings → Payment Providers → Paystack**: paste the public and
secret keys, set it to Enabled, and register
`https://odoo-production-2cb7.up.railway.app/payment/paystack/webhook` as the
webhook URL in the Paystack dashboard.

## What is deliberately not here

No `odoo.conf`. The official image ships one at `/etc/odoo/odoo.conf` that
already has `addons_path = /mnt/extra-addons` and `data_dir = /var/lib/odoo`,
and the Railway service passes its database settings as environment
variables. Overriding the config file would mean re-stating all of that, with
one more place for it to drift.
