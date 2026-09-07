# The Odoo image this deployment runs, with the Paystack provider baked in.
#
# The Railway service previously ran the stock `odoo:19.0` image. A stock
# image cannot carry a custom addon, and Odoo has no runtime module upload —
# an addon has to be on the addons path when the server starts. So the image
# is now built from this file, which is the smallest possible change: the
# same upstream image, plus one directory.
#
# Everything else is left exactly as it was. The data lives in Postgres (a
# separate Railway service) and the filestore on the volume mounted at
# /var/lib/odoo, neither of which this touches.
FROM odoo:19.0

# /mnt/extra-addons is already on the addons path in the official image's
# /etc/odoo/odoo.conf, so nothing else has to be configured for Odoo to find
# what lands here.
COPY --chown=odoo:odoo addons/ /mnt/extra-addons/

USER odoo
