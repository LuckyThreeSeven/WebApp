import base64
import datetime
from fastapi import FastAPI, Query
from pydantic import BaseModel
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding

# -----------------------------
# 환경 설정
# -----------------------------
cloudfront_domain = "https://d122i4q6sbxucu.cloudfront.net"
key_pair_id = "K16D11NNOJ3QQQ"
private_key_path = "private_key.pem"

# 프라이빗 키 로드
with open(private_key_path, "rb") as key_file:
    private_key = serialization.load_pem_private_key(
        key_file.read(),
        password=None,
    )

# FastAPI 앱 생성
app = FastAPI()

# -----------------------------
# Signed URL 생성 함수
# -----------------------------
def generate_signed_url(object_key: str, expire_hours: int = 2):
    expire_time = int((datetime.datetime.utcnow() + datetime.timedelta(hours=expire_hours)).timestamp())

    signature = private_key.sign(
        str(expire_time).encode("utf-8"),
        padding.PKCS1v15(),
        hashes.SHA1()
    )

    signature_b64 = (
        base64.b64encode(signature)
        .decode("utf-8")
        .replace("+", "-")
        .replace("=", "_")
        .replace("/", "~")
    )

    signed_url = (
        f"{cloudfront_domain}/{object_key}"
        f"?Expires={expire_time}"
        f"&Signature={signature_b64}"
        f"&Key-Pair-Id={key_pair_id}"
    )
    return signed_url

# -----------------------------
# API 엔드포인트
# -----------------------------
@app.get("/get-url")
def get_signed_url(object_key: str = Query(..., description="S3 object key")):
    signed_url = generate_signed_url(object_key)
    return {"signed_url": signed_url}
