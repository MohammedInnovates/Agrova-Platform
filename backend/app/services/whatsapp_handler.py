from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.custom_shopping_list import CustomShoppingList
from app.models.order import Order
from app.models.pickup_pin import PickupPin
from app.models.user import User
from app.services.ai_parser_service import parse_shopping_list
from app.services.whatsapp_service import send_whatsapp_text


async def handle_incoming_message(
    db: AsyncSession, from_phone: str, message: dict
) -> None:
    """
    Route an incoming WhatsApp message to the right handler.
    `from_phone` is E.164 without '+' (e.g. "2348012345678").
    """
    msg_type = message.get("type")

    # Get or create the user
    user = await _get_or_create_user(db, from_phone)
    if not user:
        await send_whatsapp_text(
            from_phone,
            "Welcome to Agrova! 🌾\n\n"
            "Please try again in a moment.",
        )
        return

    # Route by message type
    if msg_type == "text":
        body = message["text"]["body"].strip().lower()
        await _handle_text_message(db, user, from_phone, body)
        return

    if msg_type == "image":
        await send_whatsapp_text(
            from_phone,
            "📸 Photo received! Our AI is reading your list...\n\n"
            "(Vision parsing will be live soon. For now, please type your list.)",
        )
        return

    if msg_type == "audio":
        await send_whatsapp_text(
            from_phone,
            "🎤 Voice note received! Our AI is transcribing...\n\n"
            "(Voice parsing will be live soon. For now, please type your list.)",
        )
        return

    await send_whatsapp_text(
        from_phone,
        "I can help with:\n"
        "• 📝 Type your shopping list for an instant quote\n"
        "• 📦 Type 'orders' to see your order history\n"
        "• 🔐 Type 'pin' to get your pickup PIN\n"
        "• 👤 Type 'help' for more options",
    )


async def _handle_text_message(
    db: AsyncSession, user: User, from_phone: str, body: str
) -> None:
    """Handle text-based commands."""
    if body in ["hi", "hello", "start", "menu", "help"]:
        await _send_welcome_menu(from_phone)
        return

    if body in ["orders", "order", "my orders", "history"]:
        await _send_order_history(db, user, from_phone)
        return

    if body in ["pin", "pickup", "pickup pin", "my pin"]:
        await _send_pickup_pin(db, user, from_phone)
        return

    if body in ["balance", "wallet", "my wallet"]:
        from app.services.wallet_service import get_or_create_wallet
        wallet = await get_or_create_wallet(db, user.id)
        await send_whatsapp_text(
            from_phone,
            f"💰 Wallet Balance: ₦{wallet.balance_kobo / 100:,.0f}\n\n"
            "Reply 'topup' to add funds.",
        )
        return

    escalation_keywords = [
        "damaged", "broken", "missing", "refund", "angry", "complain",
        "human", "agent", "manager", "support",
    ]
    if any(kw in body for kw in escalation_keywords):
        await send_whatsapp_text(
            from_phone,
            "🙋 Our support team has been notified. "
            "Someone will reply within 30 minutes.\n\n"
            "For urgent issues, call +234-800-AGROVA.",
        )
        return

    # Default: treat as shopping list
    await _handle_shopping_list(db, user, from_phone, body)


async def _handle_shopping_list(
    db: AsyncSession, user: User, from_phone: str, body: str
) -> None:
    """Parse the message as a shopping list and send a quote."""
    parsed = await parse_shopping_list(db, body)

    if not parsed.items:
        await send_whatsapp_text(
            from_phone,
            "🤔 I couldn't match any items from your list. Try:\n\n"
            "'2 bags of rice and 5 dericas of beans'\n\n"
            "Or type 'help' to see what I can do.",
        )
        return

    lines = ["🛒 *Your Instant Quote*\n"]
    for item in parsed.items:
        name = item.product_name or "Unknown"
        qty = float(item.quantity)
        total = item.line_total_kobo / 100
        lines.append(f"• {qty:g} × {name} = ₦{total:,.0f}")

    if parsed.unmatched:
        lines.append(f"\n⚠️ Not found: {', '.join(parsed.unmatched)}")

    lines.append(f"\n*Total Estimate: ₦{parsed.total_kobo / 100:,.0f}*")
    lines.append("\nReply *'confirm'* to submit for admin quote.")
    lines.append("Or type *'help'* for more options.")

    parsed_json = {
        "items": [
            {
                "raw_text": i.raw_text,
                "product_name": i.product_name,
                "quantity": float(i.quantity),
                "unit_price_kobo": i.unit_price_kobo,
                "line_total_kobo": i.line_total_kobo,
            }
            for i in parsed.items
        ],
        "unmatched": parsed.unmatched,
        "estimated_total_kobo": parsed.total_kobo,
    }

    cl = CustomShoppingList(
        user_id=user.id,
        raw_text=body,
        source_type="TEXT",
        status="PENDING_QUOTE",
        parsed_items=parsed_json,
        quoted_total_kobo=parsed.total_kobo if parsed.items else None,
    )
    db.add(cl)
    await db.commit()

    await send_whatsapp_text(from_phone, "\n".join(lines))


async def _send_welcome_menu(from_phone: str) -> None:
    await send_whatsapp_text(
        from_phone,
        "🌾 *Welcome to Agrova!*\n\n"
        "I'm your personal grocery assistant.\n\n"
        "📝 *Type a shopping list:*\n"
        "Example: '2 bags rice, 5 dericas beans'\n\n"
        "📦 *Commands:*\n"
        "• 'orders' — view order history\n"
        "• 'pin' — get pickup PIN\n"
        "• 'balance' — wallet balance\n"
        "• 'help' — show this menu",
    )


async def _send_order_history(
    db: AsyncSession, user: User, from_phone: str
) -> None:
    result = await db.execute(
        select(Order)
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .limit(3)
    )
    orders = result.scalars().all()

    if not orders:
        await send_whatsapp_text(
            from_phone,
            "📭 You have no orders yet.\n\n"
            "Type a shopping list to get started!",
        )
        return

    lines = ["📦 *Your Recent Orders*\n"]
    for o in orders:
        lines.append(
            f"\n*#{str(o.id)[:8]}* — {o.status}\n"
            f"₦{o.total_kobo / 100:,.0f} • {o.delivery_type}"
        )

    lines.append("\n\nReply with an order number for details.")
    await send_whatsapp_text(from_phone, "\n".join(lines))


async def _send_pickup_pin(
    db: AsyncSession, user: User, from_phone: str
) -> None:
    result = await db.execute(
        select(PickupPin)
        .join(Order, Order.id == PickupPin.order_id)
        .where(Order.user_id == user.id)
        .where(PickupPin.status == "ACTIVE")
        .order_by(PickupPin.created_at.desc())
        .limit(1)
    )
    pin = result.scalar_one_or_none()

    if not pin:
        await send_whatsapp_text(
            from_phone,
            "🔐 No active pickup PIN found.\n\n"
            "PINs are sent when your order is ready for pickup.",
        )
        return

    await send_whatsapp_text(
        from_phone,
        "🔐 *Your Pickup PIN*\n\n"
        "Your 4-digit pickup PIN is available in the Agrova app under "
        "your Order History. Show it to your hub coordinator on delivery.",
    )


async def _get_or_create_user(
    db: AsyncSession, phone: str
) -> User | None:
    clean_phone = "+" + phone.lstrip("+")

    result = await db.execute(
        select(User).where(User.phone == clean_phone)
    )
    user = result.scalar_one_or_none()

    if user:
        return user

    user = User(
        phone=clean_phone,
        full_name=None,
        role="customer",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user