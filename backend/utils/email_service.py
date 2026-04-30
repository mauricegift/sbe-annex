"""
Email sending via Resend API.
Signup/account verification uses LINKS (not codes).
Password reset via email also uses LINKS.
"""
import os
import logging
import aiohttp

logger = logging.getLogger(__name__)

RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
RESEND_FROM: str = os.getenv("RESEND_FROM", "Sbe Annex <noreply@sbeannex.giftedtech.co.ke>")
RESEND_REPLY_TO: str = os.getenv("RESEND_REPLY_TO", "support@giftedtech.co.ke")
APP_NAME: str = os.getenv("APP_NAME", "Sbe Annex")
BRAND_COLOR: str = os.getenv("BRAND_COLOR", "#16a34a")
BRAND_LIGHT = "#f0fdf4"
BRAND_BORDER = "#bbf7d0"


# ── HTML building blocks ────────────────────────────────────────────────────────

def _link_block(href: str, label: str) -> str:
    return (
        f'<div style="text-align:center;margin:24px 0;">'
        f'<a href="{href}" style="background:{BRAND_COLOR};color:#fff;text-decoration:none;'
        f'font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;display:inline-block;">'
        f'{label}</a></div>'
        f'<p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">'
        f'Or copy this link: <a href="{href}" style="color:{BRAND_COLOR};word-break:break-all;">{href}</a></p>'
    )


def _base_html(title: str, preheader: str, body: str) -> str:
    return (
        '<!DOCTYPE html><html lang="en"><head>'
        '<meta charset="UTF-8"/>'
        '<meta name="viewport" content="width=device-width,initial-scale=1"/>'
        f'<title>{title}</title></head>'
        f'<body style="margin:0;padding:0;background:#f5f4ff;'
        f'font-family:Inter,-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;">'
        f'<span style="display:none;max-height:0;overflow:hidden;">{preheader}</span>'
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4ff;padding:32px 16px;">'
        '<tr><td align="center">'
        '<table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;'
        'overflow:hidden;border:1px solid #e5e7eb;" cellpadding="0" cellspacing="0">'
        f'<tr><td style="background:{BRAND_COLOR};padding:28px 32px;">'
        f'<p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;">{APP_NAME}</p>'
        f'<p style="margin:4px 0 0;color:#d8d1ff;font-size:12px;">{title}</p>'
        '</td></tr>'
        '<tr><td style="padding:32px;">'
        f'{body}'
        '<hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0 16px;"/>'
        f'<p style="color:#d1d5db;font-size:11px;margin:0;">{APP_NAME} &bull; '
        f'Learning Platform &bull; Do not reply to this email</p>'
        '</td></tr>'
        '</table></td></tr></table>'
        '</body></html>'
    )


# ── Template builders ────────────────────────────────────────────────────────────

def _verify_account_html(username: str, link: str) -> str:
    body = (
        f'<p style="color:#374151;font-size:15px;margin:0 0 12px;">'
        f'Hi <strong>{username}</strong>,</p>'
        f'<p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 4px;">'
        f'Welcome to {APP_NAME}! Click the button below to verify your account. '
        f'This link expires in <strong>10 minutes</strong>.</p>'
        f'{_link_block(link, "Verify My Account")}'
        f'<p style="color:#9ca3af;font-size:12px;margin:12px 0 0;">'
        f'If you did not create an account, you can safely ignore this email.</p>'
    )
    return _base_html("Account Verification", f"Verify your {APP_NAME} account", body)


def _resend_verify_html(username: str, link: str) -> str:
    body = (
        f'<p style="color:#374151;font-size:15px;margin:0 0 12px;">'
        f'Hi <strong>{username}</strong>,</p>'
        f'<p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 4px;">'
        f'Here is your new verification link. Any previous link has been invalidated. '
        f'This link expires in <strong>10 minutes</strong>.</p>'
        f'{_link_block(link, "Verify My Account")}'
        f'<p style="color:#9ca3af;font-size:12px;margin:12px 0 0;">'
        f'If you did not request this, please contact support.</p>'
    )
    return _base_html("New Verification Link", f"New verification link for {APP_NAME}", body)


def _reset_password_html(username: str, link: str) -> str:
    body = (
        f'<p style="color:#374151;font-size:15px;margin:0 0 12px;">'
        f'Hi <strong>{username}</strong>,</p>'
        f'<p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 4px;">'
        f'We received a password reset request. Click the button below to set a new password. '
        f'This link expires in <strong>10 minutes</strong>.</p>'
        f'{_link_block(link, "Reset My Password")}'
        f'<p style="color:#9ca3af;font-size:12px;margin:12px 0 0;">'
        f'If you did not request a reset, no action is needed — your account is secure.</p>'
    )
    return _base_html("Password Reset", f"Reset your {APP_NAME} password", body)


def _delete_account_html(username: str, link: str) -> str:
    warning = (
        '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;'
        'padding:14px 16px;margin:16px 0;">'
        '<p style="color:#b91c1c;font-size:13px;margin:0;"><strong>Warning:</strong> '
        'This action permanently deletes all your data.</p></div>'
    )
    body = (
        f'<p style="color:#374151;font-size:15px;margin:0 0 12px;">'
        f'Hi <strong>{username}</strong>,</p>'
        f'<p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 4px;">'
        f'We received a request to permanently delete your {APP_NAME} account. '
        f'Click the link below to confirm. This link expires in <strong>10 minutes</strong>.</p>'
        f'{_link_block(link, "Confirm Account Deletion")}'
        f'{warning}'
        f'<p style="color:#9ca3af;font-size:12px;margin:0;">'
        f'If you did not request this, change your password immediately and contact support.</p>'
    )
    return _base_html("Account Deletion Confirmation", f"Confirm {APP_NAME} account deletion", body)


TEMPLATES = {
    "verify": ("Verify your account", _verify_account_html),
    "resend_verify": ("New verification link", _resend_verify_html),
    "reset": ("Reset your password", _reset_password_html),
    "delete": ("Confirm account deletion", _delete_account_html),
}


# ── Public send function ─────────────────────────────────────────────────────────

async def send_email_link(
    email: str,
    username: str,
    link: str,
    email_type: str,  # 'verify' | 'resend_verify' | 'reset' | 'delete'
) -> bool:
    """Send a link-based email (verification / reset / deletion)."""
    try:
        subject, html_fn = TEMPLATES.get(email_type, TEMPLATES["verify"])
        html = html_fn(username, link)

        payload = {
            "from": RESEND_FROM,
            "to": [email],
            "reply_to": RESEND_REPLY_TO,
            "subject": subject,
            "html": html,
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.resend.com/emails",
                json=payload,
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=aiohttp.ClientTimeout(total=15),
            ) as response:
                if response.status in (200, 201):
                    logger.info(f"Email '{email_type}' sent to {email}")
                    return True
                err = await response.text()
                logger.error(f"Resend API {response.status}: {err}")
                return False

    except Exception as exc:
        logger.error(f"Email send error: {exc}")
        return False
