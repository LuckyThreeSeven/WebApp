import os
import aiomysql
import jwt
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database configuration
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

app = FastAPI()

# CORS Middleware
origins = [
    "http://localhost",
    "http://localhost:3000",  # React App
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection pool
pool = None

@app.on_event("startup")
async def startup():
    global pool
    pool = await aiomysql.create_pool(
        host=DB_HOST, port=DB_PORT,
        user=DB_USER, password=DB_PASSWORD,
        db=DB_NAME, autocommit=True
    )

@app.on_event("shutdown")
async def shutdown():
    pool.close()
    await pool.wait_closed()

from datetime import datetime

class Blackbox(BaseModel):
    uuid: str
    nickname: str

class BlackboxInfo(BaseModel):
    uuid: str
    nickname: str
    created_at: datetime
    health_status: str
    last_connected_at: datetime | None = None

# OAuth2 scheme for extracting the token from the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
        return user_id
    except jwt.PyJWTError:
        raise credentials_exception

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.get("/api/status/blackboxes", response_model=list[BlackboxInfo])
async def get_user_blackboxes(user_id: str = Depends(get_current_user_id)):
    sql = "SELECT uuid, nickname, created_at, health_status, last_connected_at FROM blackboxes WHERE user_id = %s"
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(sql, (user_id,))
            result = await cur.fetchall()
            return result

@app.post("/api/status/blackboxes")
async def register_blackbox(blackbox: Blackbox, user_id: str = Depends(get_current_user_id)):
    sql = "INSERT INTO blackboxes (uuid, user_id, nickname) VALUES (%s, %s, %s)"
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute(sql, (blackbox.uuid, user_id, blackbox.nickname))
                return {"message": f"Blackbox '{blackbox.nickname}' registered successfully for user {user_id}."}
            except aiomysql.Error as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Database error: {e}"
                )