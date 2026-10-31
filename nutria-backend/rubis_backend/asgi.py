"""
ASGI compatibility bridge for deployments looking for rubis_backend.asgi.
Directs requests to config.asgi.application.
"""
import os
import sys
from pathlib import Path

# Asegurar que nutria-backend esté en sys.path
CURRENT_DIR = Path(__file__).resolve().parent.parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from config.asgi import application  # noqa: E402

