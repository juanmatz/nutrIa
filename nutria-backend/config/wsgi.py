"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.1/howto/deployment/wsgi/
"""

import logging
import os

from django.core.management import call_command
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()

# Auto-migración y seed idempotente al iniciar Gunicorn/WSGI en Render
try:
    call_command('migrate', interactive=False, verbosity=1)
    call_command('seed', verbosity=0)
except Exception as exc:
    logging.getLogger(__name__).warning("Advertencia en auto-migrate/seed WSGI: %s", exc)

