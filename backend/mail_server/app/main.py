from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr
from send_email import send_gmail

app = FastAPI()


class EmailSchema(BaseModel):
    to: EmailStr
    subject: str
    context: str


@app.get("/api/email")
def health():
    return {"status": "ok"}


@app.post("/send-email")
async def send_email_endpoint(email: EmailSchema):
    try:
        send_gmail(to=email.to, subject=email.subject, context=email.context)
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


class VerificationEmailSchema(BaseModel):
    email: EmailStr
    code: str


@app.post("/send-verification-email/")
async def send_verification_email_endpoint(data: VerificationEmailSchema):
    subject = "Your Verification Code"
    context = f"Your verification code is: {data.code}"
    try:
        send_gmail(to=data.email, subject=subject, context=context)
        return {"message": "Verification email sent successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {e}",
        )
