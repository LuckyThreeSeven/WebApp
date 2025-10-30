import smtplib
import os
from email.mime.text import MIMEText


def send_gmail(smtp_server: smtplib.SMTP, to: str, subject: str, context: str):
    GMAIL_USER = os.getenv("GMAIL_USER")

    if not GMAIL_USER:
        raise ValueError("Gmail user is not configured on the server.")

    msg = MIMEText(context)
    msg["Subject"] = subject
    msg["From"] = GMAIL_USER
    msg["To"] = to

    try:
        smtp_server.sendmail(GMAIL_USER, to, msg.as_string())
    except Exception as e:
        raise e
