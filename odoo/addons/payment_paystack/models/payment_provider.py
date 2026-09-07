# Part of the kakitahi.com Odoo deployment.

from odoo import api, fields, models
from odoo.tools.urls import urljoin as url_join

from odoo.addons.payment import utils as payment_utils
from odoo.addons.payment.const import REPORT_REASONS_MAPPING
from odoo.addons.payment.logging import get_payment_logger
from odoo.addons.payment_paystack import const


_logger = get_payment_logger(__name__)


class PaymentProvider(models.Model):
    _inherit = 'payment.provider'

    code = fields.Selection(
        selection_add=[('paystack', "Paystack")], ondelete={'paystack': 'set default'}
    )
    paystack_public_key = fields.Char(
        string="Paystack Public Key",
        help="The key solely used to identify the account with Paystack.",
        required_if_provider='paystack',
        copy=False,
    )
    paystack_secret_key = fields.Char(
        string="Paystack Secret Key",
        help=(
            "Used both to authenticate API calls and to verify the signature on Paystack's "
            "webhooks. Paystack does not issue a separate webhook secret."
        ),
        required_if_provider='paystack',
        copy=False,
        groups='base.group_system',
    )

    # === COMPUTE METHODS === #

    def _compute_feature_support_fields(self):
        """Override of `payment` to enable additional features."""
        super()._compute_feature_support_fields()
        # Tokenisation is deliberately left off. Paystack supports charging a
        # saved authorization, but storing card tokens raises the compliance
        # bar considerably and this deployment sells one-off digital goods.
        self.filtered(lambda p: p.code == 'paystack').update({
            'support_tokenization': False,
        })

    def _get_supported_currencies(self):
        """Override of `payment` to return the supported currencies."""
        supported_currencies = super()._get_supported_currencies()
        if self.code == 'paystack':
            supported_currencies = supported_currencies.filtered(
                lambda c: c.name in const.SUPPORTED_CURRENCIES
            )
        return supported_currencies

    # === CRUD METHODS === #

    def _get_default_payment_method_codes(self):
        """Override of `payment` to return the default payment method codes."""
        self.ensure_one()
        if self.code != 'paystack':
            return super()._get_default_payment_method_codes()
        return const.DEFAULT_PAYMENT_METHOD_CODES

    # === BUSINESS METHODS === #

    @api.model
    def _get_compatible_providers(self, *args, is_validation=False, report=None, **kwargs):
        """Override of `payment` to filter out Paystack providers for validation operations.

        Validation operations charge a token a nominal amount to check the card
        is live. Without tokenisation there is nothing to validate, so Paystack
        is not offered for them.
        """
        providers = super()._get_compatible_providers(
            *args, is_validation=is_validation, report=report, **kwargs
        )

        if is_validation:
            unfiltered_providers = providers
            providers = providers.filtered(lambda p: p.code != 'paystack')
            payment_utils.add_to_report(
                report,
                unfiltered_providers - providers,
                available=False,
                reason=REPORT_REASONS_MAPPING['validation_not_supported'],
            )

        return providers

    # === REQUEST HELPERS === #

    def _build_request_url(self, endpoint, **kwargs):
        """Override of `payment` to build the request URL."""
        if self.code != 'paystack':
            return super()._build_request_url(endpoint, **kwargs)
        return url_join('https://api.paystack.co/', endpoint)

    def _build_request_headers(self, *args, **kwargs):
        """Override of `payment` to build the request headers."""
        if self.code != 'paystack':
            return super()._build_request_headers(*args, **kwargs)
        return {'Authorization': f'Bearer {self.paystack_secret_key}'}

    def _parse_response_error(self, response):
        """Override of `payment` to parse the error message."""
        if self.code != 'paystack':
            return super()._parse_response_error(response)
        return response.json().get('message', '')

    def _parse_response_content(self, response, **kwargs):
        """Override of `payment` to parse the response content.

        Paystack wraps every payload in `{status, message, data}`; the rest of
        this module only ever wants `data`.
        """
        if self.code != 'paystack':
            return super()._parse_response_content(response, **kwargs)
        return response.json()['data']
