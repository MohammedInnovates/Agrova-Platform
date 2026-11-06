import uuid
from pydantic import BaseModel

class WalletTopUpInput(BaseModel):
    user_id: uuid.UUID
    amount_kobo: int

class WalletResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    balance_kobo: int
    currency: str