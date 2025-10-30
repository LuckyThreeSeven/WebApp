import smtplib
import os
from email.mime.text import MIMEText
import time
from prometheus_client import Histogram

# Prometheus Histogram to measure the duration of sending emails
EMAIL_SEND_DURATION = Histogram(
    "email_send_duration_seconds", "Time spent sending an email"
)


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
            start_time = time.time()
            smtp_server.sendmail(GMAIL_USER, to, msg.as_string())
            duration = time.time() - start_time
            EMAIL_SEND_DURATION.observe(duration)
    except Exception as e:
        raise e
