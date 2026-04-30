"""
General utility helpers.
"""
import secrets
from datetime import datetime
from pytz import timezone

nairobi_tz = timezone("Africa/Nairobi")


def generate_otp() -> str:
    """Generate a 6-digit numeric OTP."""
    return str(secrets.randbelow(900000) + 100000)


def get_greeting() -> str:
    """Return a time-appropriate greeting in the Nairobi timezone."""
    hour = datetime.now(nairobi_tz).hour
    if 5 <= hour < 12:
        return "Good morning"
    if 12 <= hour < 17:
        return "Good afternoon"
    if 17 <= hour < 21:
        return "Good evening"
    return "Good night"
