# Part of the kakitahi.com Odoo deployment.

{
    'name': "Payment Provider: Paystack",
    'version': '19.0.1.0.0',
    'category': 'Accounting/Payment Providers',
    'sequence': 350,
    'summary': "An African payment provider covering Kenya, Nigeria, Ghana and South Africa.",
    'description': " ",  # Non-empty string to avoid loading the README file.
    'depends': ['payment'],
    'data': [
        'views/payment_paystack_templates.xml',
        'views/payment_provider_views.xml',

        'data/payment_provider_data.xml',
        'data/payment_method_data.xml',
    ],
    'post_init_hook': 'post_init_hook',
    'uninstall_hook': 'uninstall_hook',
    'author': "Chaldea Studios",
    'license': 'LGPL-3',
}
