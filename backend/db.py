import asyncpg
import os
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

async def get_db_connection():
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASS")
    database = os.getenv("DB_NAME")
    
    try:
        conn = await asyncpg.connect(
            host=host,
            port=int(port) if port else 5432,
            user=user,
            password=password,
            database=database,
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        logger.error(f"Connection details: host={host}, port={port}, user={user}, database={database}")
        raise
