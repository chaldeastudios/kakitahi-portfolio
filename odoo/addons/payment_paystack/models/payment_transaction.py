# Part of the kakitahi.com Odoo deployment.

from odoo import _, api, models
from odoo.exceptions import ValidationError
from odoo.tools import urls

from odoo.addons.payment import utils as payment_utils
from odoo.addons.payment.logging import get_payment_logger
from odoo.addons.payment_paystack import const
from odoo.addons.payment_paystack.controllers.main import PaystackController


_logger = get_payment_logger(__name__)


class PaymentTransaction(models.Model):
    _inherit = 'payment.transaction'

    @api.model
    def _compute_reference(self, provider_code, prefix=None, separator='-', **kwargs):
        """Override of `payment` to satisfy Paystack's requirements for references.

        Paystack requires a transaction reference to be unique across the whole
        merchant account, forever — a repeated reference is rejected outright.
        Singularising the prefix with the current datetime gives that, and
        `_compute_reference` still suffixes a sequence number if two
        transactions are created in the same instant.
        """
        if provider_code == 'paystack':
            if not prefix:
                prefix = self.sudo()._compute_reference_prefix(separator, **kwargs) or None
            prefix = payment_utils.singularize_reference_prefix(prefix=prefix, separator=separator)
        return super()._compute_reference(
            provider_code, prefix=prefix, separator=separator, **kwargs
        )

    def _get_specific_rendering_values(self, processing_values):
        """Override of `payment` to return Paystack-specific rendering values.

        Paystack is a redirect provider: this initialises the transaction and
        hands back the hosted checkout URL, which the redirect form GETs.
        """
        res = super()._get_specific_rendering_values(processing_values)
        if self.provider_code != 'paystack':
            return res

        base_url = self.provider_id.get_base_url()
        payload = {
            'reference': self.reference,
            # Paystack takes the amount in the currency's subunit.
            'amount': int(round(self.amount * const.CURRENCY_MINOR_UNITS)),
            'currency': self.currency_id.name,
            'email': self.partner_email,
            'callback_url': urls.urljoin(base_url, PaystackController._return_url),
            'metadata': {
                'odoo_reference': self.reference,
                'customer_name': self.partner_name,
            },
        }
        try:
            payment_data = self._send_api_request(
                'POST', 'transaction/initialize', json=payload
            )
        except ValidationError as error:
            self._set_error(str(error))
            return {}

        return {'api_url': payment_data['authorization_url']}

    @api.model
    def _extract_reference(self, provider_code, payment_data):
        """Override of `payment` to extract the reference from the payment data.

        Paystack echoes the reference we sent, both on the redirect back and in
        the webhook body.
        """
        if provider_code != 'paystack':
            return super()._extract_reference(provider_code, payment_data)
        return payment_data.get('reference')

    def _extract_amount_data(self, payment_data):
        """Override of `payment` to extract the amount and currency.

        Odoo compares this against the transaction to catch a payment that
        does not match what was asked for — so the subunit has to be converted
        back, or every payment would look like an overpayment by a hundredfold.
        """
        if self.provider_code != 'paystack':
            return super()._extract_amount_data(payment_data)

        amount = payment_data.get('amount')
        return {
            'amount': float(amount) / const.CURRENCY_MINOR_UNITS if amount is not None else 0.0,
            'currency_code': payment_data.get('currency'),
        }

    def _apply_updates(self, payment_data):
        """Override of `payment` to update the transaction based on the payment data."""
        if self.provider_code != 'paystack':
            return super()._apply_updates(payment_data)

        # Paystack's own numeric id for the transaction.
        if payment_data.get('id'):
            self.provider_reference = str(payment_data['id'])

        # Update the payment method from the channel Paystack reports.
        channel = (payment_data.get('channel') or '').lower()
        card_brand = (payment_data.get('authorization') or {}).get('brand')
        method_code = (card_brand or channel or '').lower().replace(' ', '_')
        if method_code:
            payment_method = self.env['payment.method']._get_from_code(
                method_code, mapping=const.PAYMENT_METHODS_MAPPING
            )
            self.payment_method_id = payment_method or self.payment_method_id

        payment_status = (payment_data.get('status') or '').lower()
        if payment_status in const.PAYMENT_STATUS_MAPPING['pending']:
            self._set_pending()
        elif payment_status in const.PAYMENT_STATUS_MAPPING['done']:
            self._set_done()
        elif payment_status in const.PAYMENT_STATUS_MAPPING['cancel']:
            self._set_canceled()
        elif payment_status in const.PAYMENT_STATUS_MAPPING['error']:
            self._set_error(_(
                "An error occurred during the processing of your payment (status %s). Please try "
                "again.", payment_status
            ))
        else:
            _logger.warning(
                "Received data with invalid payment status (%s) for transaction %s.",
                payment_status, self.reference
            )
            self._set_error(_("Unknown payment status: %s", payment_status))
