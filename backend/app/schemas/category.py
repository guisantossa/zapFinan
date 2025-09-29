from typing import Literal

from pydantic import BaseModel


class CategoryBase(BaseModel):
    nome: str
    tipo: Literal["despesa", "receita"]


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    nome: str


class CategoryInDB(CategoryBase):
    id: int

    class Config:
        from_attributes = True


class Category(CategoryInDB):
    pass
