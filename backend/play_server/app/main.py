import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from botocore.signers import CloudFrontSigner
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from typing import List, Tuple

from config import settings
# gitaction test
private_key = serialization.load_pem_private_key(
    settings.S3_PRIVATE_KEY.encode(), password=None
)


def rsa_signer(message: bytes) -> bytes:
    """!
    @brief
    @param
    @return
    """
    return private_key.sign(message, padding.PKCS1v15(), hashes.SHA1())


signer = CloudFrontSigner(settings.KEY_PAIR_ID, rsa_signer)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def generate_signed_url(
    object_key: str, expire_minutes: int = 1
) -> Tuple[str, datetime.datetime]:
    """!
    @brief
    @param
    @param
    @return
    """
    expire_time = datetime.datetime.utcnow() + datetime.timedelta(
        minutes=expire_minutes
    )

    signed_url = signer.generate_presigned_url(
        f"{settings.CLOUDFRONT_DOMAIN}/{object_key}", date_less_than=expire_time
    )
    return signed_url, expire_time


class SignedURLResponse(BaseModel):
    """! @brief"""

    signed_url: str
    expire_time: datetime.datetime


class ObjectKeyRequest(BaseModel):
    """! @brief"""

    object_key: str


class ObjectKeysRequest(BaseModel):
    """! @brief"""

    object_keys: List[str]


class SignedURLListResponse(BaseModel):
    """! @brief"""

    signed_urls: List[SignedURLResponse]


@app.get("/api/videos")
def health():
    return {"status": "ok"}


@app.post("/api/videos/url", response_model=SignedURLResponse)
def get_signed_url(request: ObjectKeyRequest):
    """!
    @brief
    @param
    @return
    """
    signed_url, expire_time = generate_signed_url(
        request.object_key, settings.CLOUDFRONT_EXPIRE_TIME
    )
    return {"signed_url": signed_url, "expire_time": expire_time}


@app.post("/api/videos/urls", response_model=SignedURLListResponse)
def get_signed_urls(request: ObjectKeysRequest):
    """!
    @brief
    @param
    @return
    """
    response_urls = []
    for key in request.object_keys:
        signed_url, expire_time = generate_signed_url(key)
        response_urls.append({"signed_url": signed_url, "expire_time": expire_time})
    return {"signed_urls": response_urls}
