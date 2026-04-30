"""
Gunicorn configuration for production.
"""
import os

bind = f"0.0.0.0:{os.getenv('PORT', '3192')}"
workers = int(os.getenv("WEB_CONCURRENCY", "4"))
threads = 2
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5
loglevel = "info"
accesslog = "-"
errorlog = "-"
