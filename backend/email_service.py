import os
import asyncio
import logging
import resend

logger = logging.getLogger(__name__)


def _reset_email_html(reset_url: str) -> str:
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDFBF7;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
      <tr><td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #E8E3D9;border-radius:16px;padding:36px;">
          <tr><td style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#6E6860;padding-bottom:8px;">Collaborative Democracy Lab</td></tr>
          <tr><td style="font-size:24px;color:#2D2A26;font-weight:bold;padding-bottom:16px;">Reset your password</td></tr>
          <tr><td style="font-size:15px;color:#2D2A26;line-height:1.6;padding-bottom:24px;">
            We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
          </td></tr>
          <tr><td style="padding-bottom:24px;">
            <a href="{reset_url}" style="display:inline-block;background-color:#4A5D4E;color:#FDFBF7;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:bold;">Reset password</a>
          </td></tr>
          <tr><td style="font-size:13px;color:#6E6860;line-height:1.6;">
            Or paste this link into your browser:<br/>
            <a href="{reset_url}" style="color:#4A5D4E;word-break:break-all;">{reset_url}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
    """


async def send_reset_email(recipient: str, reset_url: str) -> bool:
    api_key = os.environ.get("RESEND_API_KEY")
    sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    if not api_key:
        logger.warning("RESEND_API_KEY not set; skipping email send.")
        return False
    resend.api_key = api_key
    params = {
        "from": f"Collaborative Democracy Lab <{sender}>",
        "to": [recipient],
        "subject": "Reset your Collaborative Democracy Lab password",
        "html": _reset_email_html(reset_url),
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Reset email sent to {recipient}: {result.get('id') if isinstance(result, dict) else result}")
        return True
    except Exception as e:
        logger.error(f"Failed to send reset email to {recipient}: {e}")
        return False
