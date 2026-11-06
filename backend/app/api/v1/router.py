from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    categories,
    products,
    orders,
    payments,
    custom_lists,
    wallet,
    whatsapp,
    uploads,
    estates,
    batches,
    settings,
    driver, # <-- Driver router added
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(custom_lists.router, prefix="/custom-lists", tags=["Custom Lists"])
api_router.include_router(wallet.router, prefix="/wallet", tags=["Wallet"])
api_router.include_router(whatsapp.router, prefix="/whatsapp", tags=["WhatsApp"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
api_router.include_router(estates.router, prefix="/estates", tags=["Estates"])
api_router.include_router(batches.router, prefix="/batches", tags=["Batches"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
api_router.include_router(driver.router, prefix="/driver", tags=["Driver"])