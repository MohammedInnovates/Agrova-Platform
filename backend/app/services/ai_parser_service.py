import re
from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product


# ============================================================
# --- Data structures ---
# ============================================================

@dataclass
class ParsedLine:
    """One parsed item from a shopping list."""
    raw_text: str
    matched_product_id: str | None
    product_name: str | None
    product_brand: str | None
    product_unit: str | None
    quantity: Decimal
    unit_kind: str  # "bulk" | "local"
    unit_price_kobo: int
    line_total_kobo: int
    confidence: float  # 0.0 - 1.0
    note: str | None = None


@dataclass
class ParsedList:
    """Complete parsed shopping list."""
    items: list[ParsedLine] = field(default_factory=list)
    unmatched: list[str] = field(default_factory=list)
    total_kobo: int = 0


# ============================================================
# --- Regex patterns for Nigerian shopping language ---
# ============================================================

# Quantity numbers: "2", "2.5", "half", "quarter", "one", "two"
NUMBER_WORDS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "half": 0.5, "quarter": 0.25,
}

# Units recognized in Nigerian markets
LOCAL_UNITS = {
    "derica": "derica", "dericas": "derica", "derica's": "derica",
    "paint bucket": "paint bucket", "paint buckets": "paint bucket",
    "paint-bucket": "paint bucket", "paint-buckets": "paint bucket",
    "bucket": "bucket", "buckets": "bucket",
    "tuber": "tuber", "tubers": "tuber",
    "crate": "crate", "crates": "crate", "carton": "carton", "cartons": "carton",
}

# Bulk units (also recognized but treated differently)
BULK_UNITS = {
    "bag": "bag", "bags": "bag",
    "keg": "keg", "kegs": "keg",
    "liter": "liter", "liters": "liter", "litre": "liter", "litres": "liter",
    "l": "liter", "kg": "kg", "kgs": "kg", "kilogram": "kg", "kilograms": "kg",
}

ALL_UNITS = {**LOCAL_UNITS, **BULK_UNITS}

# Patterns
QUANTITY_PATTERN = re.compile(
    r"(\d+(?:\.\d+)?|" + "|".join(NUMBER_WORDS.keys()) + r")",
    re.IGNORECASE,
)

# Sentence splitters: "and", "then", newlines, commas
SPLIT_PATTERN = re.compile(r"[\n,]+|\bthen\b|\band\b(?!\s+half\b)", re.IGNORECASE)


# ============================================================
# --- Public API ---
# ============================================================

async def parse_shopping_list(
    db: AsyncSession, raw_text: str
) -> ParsedList:
    """
    Main entry point. Takes raw text, returns structured parsed items
    with prices computed against the current catalog.
    """
    # Load all active products (single query, cached in memory for this call)
    result = await db.execute(select(Product).where(Product.active == True))
    products = list(result.scalars().all())

    parsed = ParsedList()

    # Split raw text into line segments
    segments = [s.strip() for s in SPLIT_PATTERN.split(raw_text) if s.strip()]

    for segment in segments:
        line = _parse_segment(segment, products)
        if line.matched_product_id is not None:
            parsed.items.append(line)
            parsed.total_kobo += line.line_total_kobo
        else:
            parsed.unmatched.append(segment)

    return parsed


# ============================================================
# --- Private helpers ---
# ============================================================

def _parse_segment(segment: str, products: list[Product]) -> ParsedLine:
    """Parse a single segment (e.g. "2 bags of Royal Stallion rice")."""
    text_lower = segment.lower().strip()

    # 1. Extract quantity + unit if present
    quantity, unit, unit_kind = _extract_quantity_and_unit(text_lower)

    # 2. Extract the product keyword (strip numbers and units)
    keyword = _strip_quantity_and_units(text_lower)

    # 3. Match against the catalog
    matched = _match_product(keyword, products)

    if not matched:
        return ParsedLine(
            raw_text=segment,
            matched_product_id=None,
            product_name=None,
            product_brand=None,
            product_unit=None,
            quantity=quantity,
            unit_kind=unit_kind,
            unit_price_kobo=0,
            line_total_kobo=0,
            confidence=0.0,
            note="No matching product found in catalog",
        )

    # 4. Compute price
    if unit_kind == "local":
        # User requested a local unit (e.g. 5 Dericas)
        if not matched.local_unit_multiplier:
            return ParsedLine(
                raw_text=segment,
                matched_product_id=matched.id,
                product_name=matched.name,
                product_brand=matched.brand,
                product_unit=matched.bulk_unit,
                quantity=quantity,
                unit_kind=unit_kind,
                unit_price_kobo=0,
                line_total_kobo=0,
                confidence=0.5,
                note=f"Product '{matched.name}' does not support local units",
            )
        # Price per local unit = bulk_price * multiplier
        per_unit_price = int(
            (Decimal(matched.bulk_unit_price_kobo) * matched.local_unit_multiplier)
            .quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        )
    else:
        # User requested bulk units
        per_unit_price = matched.bulk_unit_price_kobo

    line_total = int(quantity * per_unit_price)

    return ParsedLine(
        raw_text=segment,
        matched_product_id=matched.id,
        product_name=matched.name,
        product_brand=matched.brand,
        product_unit=matched.bulk_unit,
        quantity=quantity,
        unit_kind=unit_kind,
        unit_price_kobo=per_unit_price,
        line_total_kobo=line_total,
        confidence=0.9,
        note=None,
    )


def _extract_quantity_and_unit(text: str) -> tuple[Decimal, str | None, str]:
    """
    Returns (quantity, unit_name, unit_kind).
    unit_kind is "local" for Derica/Paint Bucket/Tuber/Crate, "bulk" otherwise.
    """
    # Find quantity (number or number-word)
    qty_match = QUANTITY_PATTERN.search(text)
    if not qty_match:
        return Decimal("1"), None, "bulk"

    raw_qty = qty_match.group(1).lower()
    if raw_qty in NUMBER_WORDS:
        quantity = Decimal(str(NUMBER_WORDS[raw_qty]))
    else:
        quantity = Decimal(raw_qty)

    # Find unit
    for unit_name, canonical in LOCAL_UNITS.items():
        if re.search(rf"\b{re.escape(unit_name)}\b", text):
            return quantity, canonical, "local"

    for unit_name, canonical in BULK_UNITS.items():
        if re.search(rf"\b{re.escape(unit_name)}\b", text):
            return quantity, canonical, "bulk"

    return quantity, None, "bulk"


def _strip_quantity_and_units(text: str) -> str:
    """Removes numbers and unit words, leaving the product keyword."""
    result = text
    # Remove unit words
    for unit_name in ALL_UNITS.keys():
        result = re.sub(rf"\b{re.escape(unit_name)}\b", " ", result)
    # Remove quantity
    result = QUANTITY_PATTERN.sub(" ", result)
    # Remove filler words
    result = re.sub(r"\b(of|the|a|some|for|please)\b", " ", result)
    # Collapse whitespace
    result = re.sub(r"\s+", " ", result).strip()
    return result


def _match_product(keyword: str, products: list[Product]) -> Product | None:
    """
    Fuzzy match against product names, brands, and categories.
    Simple scoring: exact substring match wins.
    """
    if not keyword:
        return None

    # Score each product
    best_score = 0
    best_product = None

    for product in products:
        score = 0

        # Full name match
        if product.name.lower() in keyword or keyword in product.name.lower():
            score = 100
        # Brand match
        elif product.brand and (
            product.brand.lower() in keyword or keyword in product.brand.lower()
        ):
            score = 80
        # Category match (last resort)
        elif product.category.lower() in keyword:
            score = 40

        # Tie-breaker: keyword matches multiple words of the product name
        if score > 0:
            product_words = set(product.name.lower().split())
            keyword_words = set(keyword.split())
            score += len(product_words & keyword_words) * 5

        if score > best_score:
            best_score = score
            best_product = product

    # Require a minimum score to consider it a match
    return best_product if best_score >= 40 else None