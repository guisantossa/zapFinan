import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import UUID, Column, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base


class ExpressionEmbedding(Base):
    __tablename__ = "expressions_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    document = Column(Text, nullable=False)
    metadata_info = Column(JSONB, nullable=True, name="metadata")
    embedding = Column(Vector(1536), nullable=True)  # OpenAI embedding dimension
