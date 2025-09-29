import jwt
import os
import datetime
from datetime import timedelta
from zoneinfo import ZoneInfo

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

def generate_rsa_keys():
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    public_key = private_key.public_key()

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

private, public = generate_rsa_keys()

PRIVATE_KEY = os.environ.get("PRIVATE_KEY", private)
PUBLIC_KEY = os.environ.get("PUBLIC_KEY", public)
ISSUER = os.environ.get("ISSUER", "neves.com")
TOKEN_LIFETIME_DAY = os.environ.get("TOKEN_LIFETIME_DAY", 3)
KEY_ID = 'simple'

class JwtTokenManager:
    def __init__(self, private_key: str, public_key: str, algorithm: str, key_id: str, issuer: str, lifetime_minutes):
        self.private_key = private_key
        self.public_key = public_key
        self.algorithm = algorithm
        self.key_id = key_id
        self.issuer = issuer
        self.lifetime = timedelta(minutes=lifetime_minutes)

    def get_validation_key(self):
        return {
            'keys': [ self.public_key ]
        }

    def create_token(self, payload_data: dict) -> str:
        now = datetime.datetime.now(ZoneInfo("Asia/Seoul"))
        token_id = os.urandom(16).hex()
        payload = {
            'iss': self.issuer,
            'iat': now,
            'exp': now + self.lifetime,
            'sub': 'access',
            'jti': token_id
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

jwtManager = JwtTokenManager(PRIVATE_KEY, PUBLIC_KEY, 'RS256', KEY_ID, ISSUER, TOKEN_LIFETIME_DAY)