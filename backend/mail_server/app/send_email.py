import smtplib
import os
from email.mime.text import MIMEText


def send_gmail(to: str, subject: str, context: str):
    GMAIL_USER = os.getenv("GMAIL_USER")
    GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD")

    if not GMAIL_USER or not GMAIL_PASSWORD:
        raise ValueError("Gmail credentials are not configured on the server.")

    msg = MIMEText(context)
    msg["Subject"] = subject
    msg["From"] = GMAIL_USER
    msg["To"] = to

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp_server:
            smtp_server.login(GMAIL_USER, GMAIL_PASSWORD)
            smtp_server.sendmail(GMAIL_USER, to, msg.as_string())
    except Exception as e:
        raise e
