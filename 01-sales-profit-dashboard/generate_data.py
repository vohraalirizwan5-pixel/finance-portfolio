"""
Creates a realistic, MESSY sales file - the kind a small business exports
from Tally / Excel / a POS system.

Problems we add on purpose (cleaning.py fixes all of them):
  - dates in 3 different formats
  - prices stored as text like "Rs 1,250" or "₹1,250.00"
  - product / region names with random spaces and CAPS
  - duplicate rows
  - empty rows and missing quantities

Run:  python generate_data.py
"""
import random
from datetime import date, timedelta

import pandas as pd

random.seed(42)

# product -> (category, selling price, cost price)
PRODUCTS = {
    "Wireless Mouse": ("Electronics", 650, 410),
    "USB-C Charger": ("Electronics", 1200, 780),
    "Bluetooth Speaker": ("Electronics", 2499, 1650),
    "Office Chair": ("Furniture", 7800, 5200),
    "Study Table": ("Furniture", 5400, 3900),
    "A4 Paper Ream": ("Stationery", 320, 240),
    "Gel Pen Pack": ("Stationery", 150, 85),
    "Notebook Set": ("Stationery", 280, 170),
    "Desk Lamp": ("Furniture", 1450, 900),
    "Laptop Stand": ("Electronics", 1899, 1100),
}
REGIONS = ["Mumbai", "Pune", "Ahmedabad", "Surat", "Delhi"]


def messy_date(d: date) -> str:
    """Return the same date in one of three formats."""
    fmt = random.choice(["%d-%m-%Y", "%Y/%m/%d", "%d %b %Y"])
    return d.strftime(fmt)


def messy_price(p: float) -> str:
    """Return the price as text, the way exports often do."""
    style = random.choice(["plain", "rs", "rupee", "comma"])
    if style == "plain":
        return str(p)
    if style == "rs":
        return f"Rs {p:,.0f}"
    if style == "rupee":
        return f"₹{p:,.2f}"
    return f"{p:,.0f}"


def messy_text(s: str) -> str:
    """Add random extra spaces / wrong letter case."""
    s = random.choice([s, s.upper(), s.lower(), f"  {s} ", f"{s}  "])
    return s


def build_rows(n_orders: int = 1500) -> list[dict]:
    start = date(2025, 4, 1)  # Indian financial year start
    rows = []
    for i in range(n_orders):
        d = start + timedelta(days=random.randint(0, 364))
        product = random.choice(list(PRODUCTS))
        category, price, cost = PRODUCTS[product]

        # festive season (Oct-Nov) sells more
        qty = random.randint(1, 6) + (3 if d.month in (10, 11) else 0)

        # small random discount
        sell_price = round(price * random.uniform(0.9, 1.0), 2)

        rows.append({
            "Invoice No": f"INV-{1000 + i}",
            "Date": messy_date(d),
            "Product": messy_text(product),
            "Category": category,
            "Region": messy_text(random.choice(REGIONS)),
            "Qty": qty if random.random() > 0.02 else None,  # 2% missing
            "Unit Price": messy_price(sell_price),
            "Unit Cost": messy_price(cost),
        })
    return rows


def main():
    rows = build_rows()

    # add ~3% duplicate rows (same invoice entered twice)
    dupes = random.sample(rows, k=len(rows) // 33)
    rows.extend(dupes)

    # add some completely empty rows
    for _ in range(10):
        rows.append({k: None for k in rows[0]})

    random.shuffle(rows)
    df = pd.DataFrame(rows)
    df.to_csv("data/sales_raw.csv", index=False, encoding="utf-8-sig")
    print(f"Created data/sales_raw.csv with {len(df)} rows (messy on purpose)")


if __name__ == "__main__":
    main()
