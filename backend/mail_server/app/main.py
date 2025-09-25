from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr
from send_email import send_gmail

app = FastAPI()


class EmailSchema(BaseModel):
    to: EmailStr
    subject: str
    context: str


class EmailRequest(BaseModel):
    to: str  # user_id
    format: str  # 유형
    parameters: list  # 메타데이터 값


# format 유형 설명
# BLACKBOX_UNCONNECTED: 10시간 이상 블랙박스 연결 끊김
# LOGIN_AUTH: 로그인 인증 요청
# SIGNUP_AUTH: 회원가입 인증 요청


@app.get("/api/email")
def health():
    return {"status": "ok"}


@app.post("/api/email")
async def send_email(email: EmailRequest):
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
