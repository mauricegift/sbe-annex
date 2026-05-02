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


def generate_short_id(length: int = 10) -> str:
    """Generate a short URL-safe alphanumeric ID (lowercase letters + digits)."""
    import string
    alphabet = string.ascii_lowercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))

