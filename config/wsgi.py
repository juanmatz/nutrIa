"""
WSGI bridge from repository root to nutria-backend/config/wsgi.py.
Handles gunicorn config.wsgi:application executed from root directory.
"""
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / 'nutria-backend'

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from config.wsgi import application  # noqa: E402

