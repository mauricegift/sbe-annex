"""
SMS sending via OTS SMS API.
SMS verification uses OTP codes (not links).
"""
import os
import logging
import aiohttp

logger = logging.getLogger(__name__)

SMS_API_KEY: str = os.getenv("SMS_API_KEY", "")
SMS_API_URL: str = os.getenv("SMS_API_URL", "")
SMS_SENDER_ID: str = os.getenv("SMS_SENDER_ID", "")
APP_NAME: str = os.getenv("APP_NAME", "Sbe Annex")


def _format_phone(phone: str) -> str:
    """Convert Kenyan local number to E.164 without the + prefix."""
    if phone.startswith("0"):
        return "254" + phone[1:]
    if phone.startswith("+"):
        return phone[1:]
    return phone


async def send_sms_otp(phone: str, code: str) -> bool:
    """Send a 6-digit OTP via SMS."""
    if not SMS_API_KEY:
        logger.error("SMS_API_KEY not configured")
        return False

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{SMS_API_URL}/sms/send",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {SMS_API_KEY}",
                },
                json={
                    "recipient": _format_phone(phone),
                    "sender_id": SMS_SENDER_ID,
                    "type": "plain",
                    "message": (
                        f"Your {APP_NAME} code is: {code}. "
                        f"Valid for 10 minutes. Do not share this code."
                    ),
                },
                timeout=aiohttp.ClientTimeout(total=15),
            ) as response:
                success = response.status == 200
                if not success:
                    err = await response.text()
                    logger.error(f"SMS API {response.status}: {err}")
                else:
                    logger.info(f"SMS OTP sent to {phone}")
                return success
    except Exception as exc:
        logger.error(f"SMS send error: {exc}")
        return False
