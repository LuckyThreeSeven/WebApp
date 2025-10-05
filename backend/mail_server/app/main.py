from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr
from send_email import send_gmail
import os
import httpx
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

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
