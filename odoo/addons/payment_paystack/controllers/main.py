# Part of the kakitahi.com Odoo deployment.

import hashlib
import hmac
import pprint

from werkzeug.exceptions import Forbidden

from odoo import http
from odoo.exceptions import ValidationError
from odoo.http import request

from odoo.addons.payment.logging import get_payment_logger


_logger = get_payment_logger(__name__)


class PaystackController(http.Controller):
    _return_url = '/payment/paystack/return'
    _webhook_url = '/payment/paystack/webhook'

    @http.route(_return_url, type='http', methods=['GET'], auth='public')
    def paystack_return_from_checkout(self, **data):
        """Process the payment data sent by Paystack after redirection from checkout.

        The redirect itself proves nothing — anyone can visit this URL with a
        reference in the query string — so the reference is only used to look
        the transaction up, and the state comes from asking Paystack directly.

        :param dict data: The payment data, carrying `reference` or `trxref`.
        """
        _logger.info("Handling redirection from Paystack with data:\n%s", pprint.pformat(data))

        reference = data.get('reference') or data.get('trxref')
        if reference:
            self._verify_and_process(reference)

        return request.redirect('/payment/status')

    @http.route(_webhook_url, type='http', methods=['POST'], auth='public', csrf=False)
    def paystack_webhook(self):
        """Process the payment data sent by Paystack to the webhook.

        This is the authoritative path: a customer who closes the tab after
        paying still has their transaction settled, because Paystack tells the
        server directly.

        :return: An empty string to acknowledge the notification.
        :rtype: str
        """
        raw_body = request.httprequest.get_data()
        signature = request.httprequest.headers.get('x-paystack-signature')

        data = request.get_json_data()
        _logger.info("Notification received from Paystack with data:\n%s", pprint.pformat(data))

        if data.get('event') == 'charge.success':
            payment_data = data.get('data', {})
            tx_sudo = request.env['payment.transaction'].sudo()._search_by_reference(
                'paystack', payment_data
            )
            if tx_sudo:
                self._verify_signature(raw_body, signature, tx_sudo)
                # Re-verify against Paystack rather than trusting the body:
                # the signature proves who sent it, not that the amounts
                # inside are the ones Paystack holds.
                self._verify_and_process(payment_data.get('reference'))
        return request.make_json_response('')

    @staticmethod
    def _verify_signature(raw_body, received_signature, tx_sudo):
        """Check that the received signature matches the expected one.

        Paystack signs the webhook with HMAC-SHA512 over the raw request body,
        keyed by the account's secret key. The raw bytes must be hashed as
        received — parsing and re-serialising the JSON would change them and
        break every signature.

        :param bytes raw_body: The unparsed request body.
        :param str received_signature: The `x-paystack-signature` header.
        :param payment.transaction tx_sudo: The sudoed transaction referenced.
        :return: None
        :raise Forbidden: If the signatures don't match.
        """
        if not received_signature:
            _logger.warning("Received payment data with missing signature.")
            raise Forbidden()

        secret = tx_sudo.provider_id.paystack_secret_key or ''
        expected_signature = hmac.new(
            secret.encode(), raw_body, hashlib.sha512
        ).hexdigest()
        if not hmac.compare_digest(received_signature, expected_signature):
            _logger.warning("Received payment data with invalid signature.")
            raise Forbidden()

    @staticmethod
    def _verify_and_process(reference):
        """Verify the transaction with Paystack and process the result.

        :param str reference: The transaction reference to verify.
        :return: None
        """
        if not reference:
            return

        tx_sudo = request.env['payment.transaction'].sudo()._search_by_reference(
            'paystack', {'reference': reference}
        )
        if not tx_sudo:
            return

        try:
            verified_data = tx_sudo._send_api_request(
                'GET', f'transaction/verify/{reference}'
            )
        except ValidationError:
            _logger.error("Unable to verify the payment data for reference %s", reference)
        else:
            tx_sudo._process('paystack', verified_data)
