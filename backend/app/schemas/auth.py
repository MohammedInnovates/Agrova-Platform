import uuid
from pydantic import BaseModel, Field


class RegisterInput(BaseModel):
    phone: str = Field(min_length=10, max_length=20)
    password: str = Field(min_length=6, max_length=100)
    full_name: str = Field(min_length=2, max_length=200)


class LoginInput(BaseModel):
    phone: str
    password: str


class UserOutput(BaseModel):
    id: uuid.UUID
    phone: str
    full_name: str | None
    role: str
    estate_id: uuid.UUID | None = None
    default_address_directions: str | None = None

    model_config = {"from_attributes": True}


class TokenOutput(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOutput