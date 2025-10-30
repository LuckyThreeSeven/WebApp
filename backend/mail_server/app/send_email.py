import smtplib
import os
from email.mime.text import MIMEText
import time
from prometheus_client import Histogram

# Prometheus Histogram to measure the duration of sending emails
EMAIL_SEND_DURATION = Histogram(
    "email_send_duration_seconds", "Time spent sending an email"
)


def send_gmail(smtp_server: smtplib.SMTP_SSL, to: str, subject: str, context: str):
    GMAIL_USER = os.getenv("GMAIL_USER")

    if not GMAIL_USER:
        raise ValueError("Gmail credentials are not configured on the server.")

    msg = MIMEText(context)
    msg["Subject"] = subject
    msg["From"] = GMAIL_USER
    msg["To"] = to

    start_time = time.time()
    try:
        smtp_server.sendmail(GMAIL_USER, to, msg.as_string())
    except Exception as e:
        raise e
    finally:
        duration = time.time() - start_time
        EMAIL_SEND_DURATION.observe(duration)
