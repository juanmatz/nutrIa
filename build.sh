#!/usr/bin/env bash
# Exit on error
set -o errexit

if [ -d "nutria-backend" ]; then
    cd nutria-backend
fi

pip install -r requirements.txt
python manage.py collectstatic --noinput || true
python manage.py migrate --noinput || true
python manage.py seed || true

