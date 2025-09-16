from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr
from send_email import send_gmail

app = FastAPI()


class EmailSchema(BaseModel):
    to: EmailStr
    subject: str
    context: str


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.post("/send-email")
async def send_email_endpoint(email: EmailSchema):
    try:
        send_gmail(to=email.to, subject=email.subject, context=email.context)
        return {"message": "Email sent successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {e}",
        )
