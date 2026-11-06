import uuid
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.product_price_tier import ProductPriceTier
from app.models.settings import GlobalSettings
from app.schemas.order import CartItemInput, OrderCreateInput

@dataclass
class PricedLine:
    product_id: uuid.UUID
    product_name: str
    product_brand: str | None
    product_unit: str
    quantity: Decimal
    unit_price_kobo: int
    original_unit_price_kobo: int
    line_subtotal_kobo: int
    line_discount_kobo: int
    line_total_kobo: int
    applied_tier_id: uuid.UUID | None

@dataclass
class PricedOrder:
    lines: list[PricedLine]
    total_quantity: Decimal
    subtotal_kobo: int
    discount_kobo: int
    service_fee_kobo: int
    delivery_fee_kobo: int
    total_kobo: int

async def price_order(db: AsyncSession, order_input: OrderCreateInput) -> PricedOrder:
    if not order_input.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # 1. GET DYNAMIC SETTINGS FROM DB
    settings_res = await db.execute(select(GlobalSettings).limit(1))
    config = settings_res.scalar_one_or_none()
    if not config:
        config = GlobalSettings()
        db.add(config)
        await db.flush()

    priced_lines: list[PricedLine] = []
    total_quantity = Decimal("0")
    subtotal = 0
    total_discount = 0

    for item in order_input.items:
        line = await _price_line(db, item)
        priced_lines.append(line)
        total_quantity += line.quantity
        subtotal += line.line_subtotal_kobo
        total_discount += line.line_discount_kobo

    discounted_subtotal = subtotal - total_discount
    
    # 2. CALCULATE SERVICE FEE USING DYNAMIC PERCENTAGE
    service_fee = int(
        (Decimal(discounted_subtotal) * config.service_fee_percent).to_integral_value(rounding=ROUND_HALF_UP)
    )

    # 3. CALCULATE DELIVERY FEE USING DYNAMIC VARIABLES
    if order_input.fulfillment_method == "ESTATE_HUB":
        base_delivery = config.delivery_fee_hub_kobo
    else:
        base_delivery = config.delivery_fee_home_kobo

    if order_input.delivery_type == "WEEKLY_BATCH":
        surcharge = 0
    elif order_input.delivery_type == "MONTHLY_BATCH":
        surcharge = -config.monthly_discount_kobo
    else: # EXPRESS_URGENT
        surcharge = config.express_surcharge_kobo

    delivery_fee = base_delivery + surcharge
    total = discounted_subtotal + service_fee + delivery_fee

    return PricedOrder(
        lines=priced_lines, total_quantity=total_quantity, subtotal_kobo=subtotal,
        discount_kobo=total_discount, service_fee_kobo=service_fee,
        delivery_fee_kobo=delivery_fee, total_kobo=total,
    )

async def _price_line(db: AsyncSession, item: CartItemInput) -> PricedLine:
    result = await db.execute(select(Product).where(Product.id == item.product_id))
    product = result.scalar_one_or_none()

    if not product: raise HTTPException(status_code=404, detail=f"Product not found")
    if not product.active: raise HTTPException(status_code=400, detail=f"Product '{product.name}' is not available")

    quantity = Decimal(str(item.quantity))
    if item.unit_kind == "local":
        if not product.local_unit_multiplier:
            raise HTTPException(status_code=400, detail=f"Product '{product.name}' does not support local units")
        quantity = quantity * product.local_unit_multiplier

    quantity = quantity.quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)

    original_unit_price = product.bulk_unit_price_kobo
    applied_tier_id = None
    unit_price = original_unit_price

    tier_result = await db.execute(
        select(ProductPriceTier).where(ProductPriceTier.product_id == product.id)
        .where(ProductPriceTier.is_active == True).where(ProductPriceTier.min_quantity <= quantity)
        .order_by(ProductPriceTier.min_quantity.desc()).limit(1)
    )
    tier = tier_result.scalar_one_or_none()
    if tier:
        unit_price = tier.unit_price_kobo
        applied_tier_id = tier.id

    line_subtotal = int(original_unit_price * quantity)
    line_total = int(unit_price * quantity)
    line_discount = line_subtotal - line_total

    return PricedLine(
        product_id=product.id, product_name=product.name, product_brand=product.brand,
        product_unit=product.bulk_unit, quantity=quantity, unit_price_kobo=unit_price,
        original_unit_price_kobo=original_unit_price, line_subtotal_kobo=line_subtotal,
        line_discount_kobo=line_discount, line_total_kobo=line_total, applied_tier_id=applied_tier_id,
    )