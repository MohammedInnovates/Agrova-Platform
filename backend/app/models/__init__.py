"""
Central model registry. Every model MUST be imported here.
"""
from app.models.base import Base
from app.models.zone import Zone
from app.models.estate import Estate
from app.models.user import HubCoordinator, User
from app.models.otp import OTPCode
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.product_price_tier import ProductPriceTier
from app.models.product_price_history import ProductPriceHistory
from app.models.batch_window import BatchWindow
from app.models.delivery_route import DeliveryRoute
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.custom_shopping_list import CustomShoppingList
from app.models.supplier_price_history import SupplierPriceHistory
from app.models.payment import Payment, WebhookEvent
from app.models.procurement import Delivery, POLine, PurchaseOrder
from app.models.wallet import WalletAccount, WalletTransaction
from app.models.pickup_pin import PickupPin
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.models.category import Category, SubCategory
from app.models.settings import GlobalSettings

__all__ = [
    "Base", "Zone", "Estate", "User", "HubCoordinator", "OTPCode",
    "Supplier", "Product", "ProductPriceTier", "ProductPriceHistory",
    "BatchWindow", "DeliveryRoute", "Order", "OrderItem", "CustomShoppingList", 
    "SupplierPriceHistory", "Payment", "WebhookEvent",
    "PurchaseOrder", "POLine", "Delivery", "WalletAccount",
    "WalletTransaction", "PickupPin", "Notification", "AuditLog",
    "Category", "SubCategory", "GlobalSettings"
]