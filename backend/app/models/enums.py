from enum import Enum

class UserRole(str, Enum):
    CUSTOMER = "customer"
    HUB_COORDINATOR = "hub_coordinator"
    DRIVER = "driver" # <-- NEW ROLE
    ADMIN = "admin"
    SOURCING = "sourcing"

class HubVerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

# ... (rest of your enums stay exactly the same) ...
class OrderMode(str, Enum):
    DIRECT_CART = "DIRECT_CART"
    CUSTOM_LIST = "CUSTOM_LIST"

class DeliveryType(str, Enum):
    WEEKLY_BATCH = "WEEKLY_BATCH"
    MONTHLY_BATCH = "MONTHLY_BATCH"
    EXPRESS_URGENT = "EXPRESS_URGENT"

class SubstitutionPreference(str, Enum):
    AUTO_SUBSTITUTE = "AUTO_SUBSTITUTE"
    CONTACT_ME = "CONTACT_ME"
    CANCEL_ITEM = "CANCEL_ITEM"

class OrderFulfillmentMethod(str, Enum):
    HOME_DELIVERY = "HOME_DELIVERY"
    ESTATE_HUB = "ESTATE_HUB"

class OrderStatus(str, Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAID = "PAID"
    PROCURED = "PROCURED"
    DISPATCHED = "DISPATCHED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class CustomListStatus(str, Enum):
    PENDING_QUOTE = "PENDING_QUOTE"
    QUOTED = "QUOTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"

class PaymentProvider(str, Enum):
    PAYSTACK = "paystack"
    MONNIFY = "monnify"

class PaymentStatus(str, Enum):
    INITIATED = "INITIATED"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

class PurchaseOrderStatus(str, Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    CONFIRMED = "CONFIRMED"
    RECEIVED = "RECEIVED"
    SETTLED = "SETTLED"

class DeliveryStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    IN_TRANSIT = "IN_TRANSIT"
    AT_HUB = "AT_HUB"
    CONFIRMED = "CONFIRMED"

class DeliveryRouteStatus(str, Enum):
    PLANNED = "PLANNED"
    DISPATCHED = "DISPATCHED"
    IN_TRANSIT = "IN_TRANSIT"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class BatchWindowStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    CUTOFF_REACHED = "CUTOFF_REACHED"
    LOCKED = "LOCKED"
    DISPATCHING = "DISPATCHING"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"

class WalletDirection(str, Enum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"

class WalletReason(str, Enum):
    REFUND = "REFUND"
    ORDER_PAYMENT = "ORDER_PAYMENT"
    WITHDRAWAL = "WITHDRAWAL"
    ADJUSTMENT = "ADJUSTMENT"
    TOPUP = "TOPUP"

class WalletTransactionStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class PickupPinStatus(str, Enum):
    ACTIVE = "ACTIVE"
    VERIFIED = "VERIFIED"
    EXPIRED = "EXPIRED"
    LOCKED = "LOCKED"

class NotificationChannel(str, Enum):
    WHATSAPP = "whatsapp"
    SMS = "sms"

class NotificationStatus(str, Enum):
    QUEUED = "QUEUED"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"