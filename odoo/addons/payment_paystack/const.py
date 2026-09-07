# Part of the kakitahi.com Odoo deployment.

# The currencies supported by Paystack, in ISO 4217 format.
# Paystack settles in the currencies of the markets it operates in; an
# account is enabled for a subset of these, so listing them all here lets
# Odoo offer whichever the merchant account actually supports.
SUPPORTED_CURRENCIES = [
    'GHS',
    'KES',
    'NGN',
    'USD',
    'ZAR',
]

# Paystack takes and reports amounts in the currency's subunit — kobo for
# NGN, cents for KES/ZAR/USD, pesewas for GHS — so every amount crossing
# this boundary is multiplied or divided by this.
CURRENCY_MINOR_UNITS = 100

# Mapping of Odoo transaction states to Paystack transaction statuses.
# https://paystack.com/docs/payments/verify-payments/
PAYMENT_STATUS_MAPPING = {
    'pending': ['pending', 'ongoing', 'processing', 'queued'],
    'done': ['success'],
    'cancel': ['abandoned'],
    'error': ['failed', 'reversed'],
}

# The codes of the payment methods to activate when Paystack is activated.
DEFAULT_PAYMENT_METHOD_CODES = {
    # Primary payment methods.
    'card',
    'mpesa',
    'bank_transfer',
    # Brand payment methods.
    'visa',
    'mastercard',
    'amex',
}

# Paystack's channel names, where they differ from Odoo's payment method codes.
PAYMENT_METHODS_MAPPING = {
    'bank': 'bank_transfer',
    'bank_transfer': 'bank_transfer',
    'mobile_money': 'mpesa',
    'ussd': 'ussd',
    'qr': 'qr',
}
