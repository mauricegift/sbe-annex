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
BRAND_COLOR: str = os.getenv("BRAND_COLOR", "#22c55e")   # Deep educational green
BRAND_LIGHT: str = "#f0fdf4"   # green-50
BRAND_BORDER: str = "#86efac"  # green-300


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
        f'<body style="margin:0;padding:0;background:{BRAND_LIGHT};'
        f'font-family:Inter,-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;">'
        f'<span style="display:none;max-height:0;overflow:hidden;">{preheader}</span>'
        f'<table width="100%" cellpadding="0" cellspacing="0" style="background:{BRAND_LIGHT};padding:32px 16px;">'
        '<tr><td align="center">'
        '<table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;'
        f'overflow:hidden;border:1px solid {BRAND_BORDER};" cellpadding="0" cellspacing="0">'
        f'<tr><td style="background:{BRAND_COLOR};padding:28px 32px;">'
        f'<p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;">{APP_NAME}</p>'
        f'<p style="margin:4px 0 0;color:#bbf7d0;font-size:12px;">{title}</p>'
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


def _change_email_html(username: str, link: str, new_email: str = "") -> str:
    body = (
        f'<p style="color:#374151;font-size:15px;margin:0 0 12px;">'
        f'Hi <strong>{username}</strong>,</p>'
        f'<p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 4px;">'
        f'You requested to change your {APP_NAME} account email address'
        f'{f" to <strong>{new_email}</strong>" if new_email else ""}. '
        f'Click the button below to confirm this change. '
        f'This link expires in <strong>30 minutes</strong>.</p>'
        f'{_link_block(link, "Confirm Email Change")}'
        f'<p style="color:#9ca3af;font-size:12px;margin:12px 0 0;">'
        f'If you did not request this change, you can safely ignore this email — your account remains secure.</p>'
    )
    return _base_html("Confirm Email Change", f"Confirm your {APP_NAME} email change", body)


def _upload_accepted_html(username: str, doc_type: str, title: str) -> str:
    body = (
        f'<p style="color:#374151;font-size:15px;margin:0 0 12px;">'
        f'Hi <strong>{username}</strong>,</p>'
        f'<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:16px 0;">'
        f'<p style="color:#15803d;font-size:14px;font-weight:700;margin:0 0 6px;">✓ Your upload has been approved!</p>'
        f'<p style="color:#374151;font-size:14px;margin:0;"><strong>{doc_type.title()}:</strong> {title}</p>'
        f'</div>'
        f'<p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">'
        f'Your {doc_type} is now live on the platform and accessible to other students. Thank you for contributing!</p>'
    )
    return _base_html("Upload Approved", f"Your {APP_NAME} upload has been approved", body)


def _upload_rejected_html(username: str, doc_type: str, title: str, feedback: str) -> str:
    feedback_block = ""
    if feedback:
        feedback_block = (
            f'<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;'
            f'padding:14px 16px;margin:16px 0;">'
            f'<p style="color:#991b1b;font-size:13px;font-weight:700;margin:0 0 6px;">Admin remarks:</p>'
            f'<p style="color:#7f1d1d;font-size:14px;margin:0;">{feedback}</p>'
            f'</div>'
        )
    body = (
        f'<p style="color:#374151;font-size:15px;margin:0 0 12px;">'
        f'Hi <strong>{username}</strong>,</p>'
        f'<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">'
        f'<p style="color:#991b1b;font-size:14px;font-weight:700;margin:0 0 6px;">✗ Your upload was not approved</p>'
        f'<p style="color:#374151;font-size:14px;margin:0;"><strong>{doc_type.title()}:</strong> {title}</p>'
        f'</div>'
        f'{feedback_block}'
        f'<p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">'
        f'You may make the necessary corrections and re-upload. If you have questions, please contact support.</p>'
    )
    return _base_html("Upload Not Approved", f"Your {APP_NAME} upload was not approved", body)


TEMPLATES = {
    "verify": ("Verify your account", _verify_account_html),
    "resend_verify": ("New verification link", _resend_verify_html),
    "reset": ("Reset your password", _reset_password_html),
    "delete": ("Confirm account deletion", _delete_account_html),
    "change_email": ("Confirm email change", _change_email_html),
}


# ── Public send functions ─────────────────────────────────────────────────────────

async def _post_email(to: str, subject: str, html: str) -> bool:
    """Internal: send an email via Resend."""
    try:
        payload = {
            "from": RESEND_FROM,
            "to": [to],
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
                    logger.info(f"Email sent to {to}")
                    return True
                err = await response.text()
                logger.error(f"Resend API {response.status}: {err}")
                return False
    except Exception as exc:
        logger.error(f"Email send error: {exc}")
        return False


async def send_email_link(
    email: str,
    username: str,
    link: str,
    email_type: str,  # 'verify' | 'resend_verify' | 'reset' | 'delete' | 'change_email'
    extra_kwargs: dict | None = None,
) -> bool:
    """Send a link-based email (verification / reset / deletion / email-change)."""
    subject, html_fn = TEMPLATES.get(email_type, TEMPLATES["verify"])
    kwargs = extra_kwargs or {}
    html = html_fn(username, link, **kwargs)
    return await _post_email(email, subject, html)


async def send_upload_notification(
    email: str,
    username: str,
    doc_type: str,   # 'note' | 'past paper'
    title: str,
    decision: str,   # 'approved' | 'rejected'
    feedback: str = "",
) -> bool:
    """Send an upload approval/rejection notification email."""
    if decision == "approved":
        subject = f"Your {doc_type} has been approved — {APP_NAME}"
        html = _upload_accepted_html(username, doc_type, title)
    else:
        subject = f"Your {doc_type} was not approved — {APP_NAME}"
        html = _upload_rejected_html(username, doc_type, title, feedback)
    return await _post_email(email, subject, html)
