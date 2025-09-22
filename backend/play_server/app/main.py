import datetime
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from botocore.signers import CloudFrontSigner
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding

# -----------------------------
# 환경 설정
# -----------------------------
cloudfront_domain = "https://d122i4q6sbxucu.cloudfront.net"
key_pair_id = "K16D11NNOJ3QQQ"
private_key_path = "/app/private_key.pem"  # ← 경로는 환경에 맞게 조정

# -----------------------------
# 프라이빗 키 로드 및 서명자 생성
# -----------------------------
with open(private_key_path, "rb") as key_file:
    private_key = serialization.load_pem_private_key(
        key_file.read(),
        password=None,
    )


# 서명 함수 정의
def rsa_signer(message):
    return private_key.sign(
        message,
        padding.PKCS1v15(),
        hashes.SHA1(),  # CloudFront는 SHA1 해시를 요구
    )


# CloudFront 서명자 객체 생성
signer = CloudFrontSigner(key_pair_id, rsa_signer)

# -----------------------------
# FastAPI 앱 생성
# -----------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Signed URL 생성 함수
# -----------------------------
def generate_signed_url(object_key: str, expire_minutes: int = 2):
    expire_time = datetime.datetime.utcnow() + datetime.timedelta(
        minutes=expire_minutes
    )

    signed_url = signer.generate_presigned_url(
        f"{cloudfront_domain}/{object_key}",
        date_less_than=expire_time,
    )
    return signed_url


class SignedURLResponse(BaseModel):
    signed_url: str


# -----------------------------
# API 엔드포인트
# -----------------------------
@app.get("/get-url", response_model=SignedURLResponse)
def get_signed_url(object_key: str = Query(..., description="S3 object key")):
    signed_url = generate_signed_url(object_key)
    return {"signed_url": signed_url}


@app.get("/api/videos/signed-url", response_model=SignedURLResponse)
def get_new_signed_url(object_key: str = Query(..., description="S3 object key")):
    signed_url = generate_signed_url(object_key)
    return {"signed_url": signed_url}
