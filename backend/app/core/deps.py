from typing import Generator

from sqlalchemy.orm import Session

from .database import get_db


# Database dependency
def get_database() -> Generator[Session, None, None]:
    yield from get_db()
