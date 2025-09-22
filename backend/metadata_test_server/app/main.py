import os
from datetime import datetime, date
from typing import List
import aiomysql
import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel


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
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        db=DB_NAME,
        autocommit=True,
    )


@app.on_event("shutdown")
async def shutdown():
    pool.close()
    await pool.wait_closed()


class Blackbox(BaseModel):
    uuid: str
    nickname: str


class BlackboxInfo(BaseModel):
    uuid: str
    nickname: str
    created_at: datetime
    health_status: str
    last_connected_at: datetime | None = None


class VideoMetadataInfo(BaseModel):
    id: int
    object_key: str
    duration: float
    created_at: datetime
    file_size: int
    file_type: str
    recorded_at: datetime


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


@app.get("/api/status/blackboxes", response_model=List[BlackboxInfo])
async def get_user_blackboxes(user_id: str = Depends(get_current_user_id)):
    sql = "SELECT uuid, nickname, created_at, health_status, last_connected_at FROM blackboxes WHERE user_id = %s"
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(sql, (user_id,))
            result = await cur.fetchall()
            return result


@app.get("/api/status/metadata", response_model=List[VideoMetadataInfo])
async def get_video_metadata(
    blackbox_id: str = Query(..., alias="blackbox_id"),
    date: date = Query(..., alias="date"),
):
    # Then, fetch video metadata for that blackbox and date
    sql = """
        SELECT id, file_path as object_key, duration, created_at, file_size, file_type, stream_started_at as recorded_at
        FROM video_metadata
        WHERE blackbox_uuid = %s AND DATE(stream_started_at) = %s
    """
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(sql, (blackbox_id, date))
            result = await cur.fetchall()
            return result


@app.post("/api/status/blackboxes")
async def register_blackbox(
    blackbox: Blackbox, user_id: str = Depends(get_current_user_id)
):
    sql = "INSERT INTO blackboxes (uuid, user_id, nickname) VALUES (%s, %s, %s)"
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute(sql, (blackbox.uuid, user_id, blackbox.nickname))
                return {
                    "message": f"Blackbox '{blackbox.nickname}' registered successfully for user {user_id}."
                }
            except aiomysql.Error as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Database error: {e}",
                )


@app.delete("/api/status/blackboxes/{blackbox_id}")
async def delete_blackbox(
    blackbox_id: str, user_id: str = Depends(get_current_user_id)
):
    # Check if the blackbox belongs to the user
    check_sql = "SELECT user_id FROM blackboxes WHERE uuid = %s"
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(check_sql, (blackbox_id,))
            result = await cur.fetchone()
            if not result or result[0] != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to delete this blackbox.",
                )

    # Delete the blackbox
    delete_sql = "DELETE FROM blackboxes WHERE uuid = %s"
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute(delete_sql, (blackbox_id,))
                if cur.rowcount == 0:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Blackbox not found.",
                    )
                return {"message": f"Blackbox '{blackbox_id}' deleted successfully."}
            except aiomysql.Error as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Database error: {e}",
                )
