import os

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from config import settings


SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

connect_args = {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}

engine_kwargs: dict = {"connect_args": connect_args}
if "sqlite" not in SQLALCHEMY_DATABASE_URL:
    # One pool per uvicorn worker. 5 + 2 keeps two workers near 14 connections,
    # inside the landing share of Postgres max_connections=200.
    engine_kwargs["pool_size"] = int(os.environ.get("LANDING_DB_POOL_SIZE", "5"))
    engine_kwargs["max_overflow"] = int(os.environ.get("LANDING_DB_MAX_OVERFLOW", "2"))
    engine_kwargs["pool_timeout"] = int(os.environ.get("LANDING_DB_POOL_TIMEOUT", "15"))

engine = create_async_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)
AsyncSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)
Base = declarative_base()

# get_db is now an async generator
async def get_db():
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()