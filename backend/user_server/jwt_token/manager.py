import jwt
import os
import base64
import datetime
from datetime import timedelta
from zoneinfo import ZoneInfo

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

"""
JWT Token을 생성하기 위해 필요한 환경변수
PRIVATE_KEY: PEM 형식의 RSA 개인키 (없을 경우 자동 생성)
PUBLIC_KEY: PEM 형식의 RSA 공개키 (없을 경우 자동 생성)
ISSUER: 토큰 발급자 (기본값: neves.com)
TOKEN_LIFETIME_DAY: 토큰 유효기간 (기본값: 3일)
"""

def generate_rsa_keys():
    if "PRIVATE_KEY" in os.environ and "PUBLIC_KEY" in os.environ:
        private_key = serialization.load_pem_private_key(
            os.environ["PRIVATE_KEY"].encode('utf-8'),
            password=None,
        )
        public_key = serialization.load_pem_public_key(
            os.environ["PUBLIC_KEY"].encode('utf-8')
        )
        return private_key, public_key
    else:
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        public_key = private_key.public_key()

    return private_key, public_key

def convert_keys_to_pem(private_key: rsa.RSAPrivateKey, public_key: rsa.RSAPublicKey):
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')

    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')
    return private_pem, public_pem

def to_base64url(n: int):
    num_bytes = n.to_bytes((n.bit_length() + 7) // 8, 'big')
    return base64.urlsafe_b64encode(num_bytes).rstrip(b'=').decode('ascii')



private_key, public_key = generate_rsa_keys()
ISSUER = os.environ.get("ISSUER", "neves.com")
TOKEN_LIFETIME_DAY = int(os.environ.get("TOKEN_LIFETIME_DAY", 3))
KEY_ID = 'simple'

class JwtTokenManager:
    def __init__(self, private_key: rsa.RSAPrivateKey, public_key: rsa.RSAPublicKey, algorithm: str, key_id: str, issuer: str, lifetime_day: int):
        self.private_key = private_key
        self.public_key = public_key
        self.algorithm = algorithm
        self.key_id = key_id
        self.issuer = issuer
        self.lifetime = timedelta(days=lifetime_day)

    def get_validation_key(self):
        return {
            'keys': [{
                'kty': 'RSA',
                'kid': self.key_id,
                'use': 'sig',
                'alg': self.algorithm,
                'n': to_base64url(self.public_key.public_numbers().n),
                'e': to_base64url(self.public_key.public_numbers().e),
            }]
        }

    def create_token(self, user_id: str,  payload_data: dict={}) -> str:
        now = datetime.datetime.now(ZoneInfo("Asia/Seoul"))
        token_id = os.urandom(16).hex()
        payload = {
            'iss': self.issuer,
            'iat': now,
            'exp': now + self.lifetime,
            'sub': user_id,
            'uid': user_id,
            'jti': token_id,
        }

        payload.update(payload_data)

        headers = {
            'kid': self.key_id,
            'alg': self.algorithm,
        }

        encoded_token = jwt.encode(
            payload,
            self.private_key,
            algorithm=self.algorithm,
            headers=headers
        )

        return encoded_token

jwtManager = JwtTokenManager(private_key, public_key, 'RS256', KEY_ID, ISSUER, TOKEN_LIFETIME_DAY)