from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr
from send_email import send_gmail
from smtp_connection_pool import *
import os
import httpx
from prometheus_fastapi_instrumentator import Instrumentator
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
smtp_cp = None

@asynccontextmanager
async def startup_event(app: FastAPI):
    global smtp_cp
    GMAIL_USER = os.getenv("GMAIL_USER")
    GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD")
    if not GMAIL_USER or not GMAIL_PASSWORD:
        raise ValueError("Gmail credentials are not configured on the server.")
    smtp_config = SMTPConfig("smtp.gmail.com", 465, GMAIL_USER, GMAIL_PASSWORD)
    smtp_cp = SMTPConnectionPool(smtp_config, pool_size=5)
    logger.info("SMTP server connected and logged in")
    yield
    smtp_cp.quit()

app = FastAPI(lifespan=startup_event)
Instrumentator().instrument(app).expose(app)  # Add prometheus

class EmailSchema(BaseModel):
    to: EmailStr
    subject: str
    context: str

class EmailRequest(BaseModel):
    to: str
    format: str
    parameters: list

user_server_url = os.getenv("USER_SERVER_URL", "http://user-server:8000")

@app.get("/email")
def health():
    return {"status": "ok"}


@app.post("/email/users")
async def send_email_users(email: EmailRequest):
    try:
        email_to_send = EmailSchema(
            to=email.to,
            subject=f"[{email.format}] {email.to}",
            context=str(email.parameters),
        )
        send_gmail(
            smtp_cp=smtp_cp,
            to=email_to_send.to,
            subject=email_to_send.subject,
            context=email_to_send.context,
        )
        return {"message": "Email sent successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {e}",
        )


@app.post("/email/status")
async def send_email_status(email: EmailRequest):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{user_server_url}/users/email/?uid={email.to}"
            )
            response.raise_for_status()
            receiver = response.json()["email"]

        email_to_send = EmailSchema(
            to=receiver,
            subject=f"[{email.format}] {email.to}",
            context=str(email.parameters),
        )
        send_gmail(
            smtp_cp=smtp_cp,
            to=email_to_send.to,
            subject=email_to_send.subject,
            context=email_to_send.context,
        )
        return {"message": "Email sent successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Failed to get user email: {e.response.text}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {e}",
        )
