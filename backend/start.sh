#!/usr/bin/env bash
set -e

VENV_DIR="$(dirname "$0")/venv"
GUNICORN="$VENV_DIR/bin/gunicorn"

if [ ! -f "$GUNICORN" ]; then
  echo "ERROR: gunicorn not found at $GUNICORN" >&2
  exit 1
fi

export PATH="$VENV_DIR/bin:$PATH"
export PYTHONPATH="$(dirname "$0"):$PYTHONPATH"

exec "$GUNICORN" -c gunicorn_conf.py app:app
