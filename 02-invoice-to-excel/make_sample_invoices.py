"""
Creates sample GST invoice PDFs in the invoices/ folder.

3 vendors use 3 DIFFERENT layouts and labels ("Invoice No" vs "Bill No." vs "Invoice #"),
just like real life. Two invoices have mistakes on purpose, so the extractor can catch them:
  - one has a total that doesn't match taxable value + GST
  - one has an invalid GSTIN

Run:  python make_sample_invoices.py
"""
import random
from datetime import date, timedelta
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from gstin import make_valid_gstin

random.seed(7)
OUT = Path(__file__).parent / "invoices"
OUT.mkdir(exist_ok=True)

BUYER_GSTIN = make_valid_gstin("27", "AABCV1234K", "1")  # our client, in Maharashtra (27)

VENDORS = [
    # name, state code, PAN, layout style
    ("Shree Ganesh Traders", "27", "ABCPG4521L", "classic"),   # same state -> CGST + SGST
    ("Patel Packaging Pvt Ltd", "24", "AACCP7788M", "modern"),  # Gujarat -> IGST
    ("Sunrise Office Supplies", "27", "BDJPS3310Q", "simple"),  # same state, different labels
]


def money(x: float) -> str:
    return f"Rs. {x:,.2f}"


def draw_classic(c, v, inv):
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 800, v["name"])
    c.setFont("Helvetica", 10)
    c.drawString(50, 785, f"GSTIN: {v['gstin']}")
    c.drawString(50, 770, "TAX INVOICE")
    c.drawString(350, 785, f"Invoice No: {inv['no']}")
    c.drawString(350, 770, f"Invoice Date: {inv['date']:%d-%m-%Y}")
    c.drawString(50, 740, f"Bill To GSTIN: {BUYER_GSTIN}")
    y = 700
    for desc, qty, rate in inv["items"]:
        c.drawString(50, y, f"{desc}   x{qty}   @ {money(rate)}")
        y -= 18
    y -= 10
    c.drawString(300, y, f"Taxable Value: {money(inv['taxable'])}")
    c.drawString(300, y - 18, f"CGST @9%: {money(inv['cgst'])}")
    c.drawString(300, y - 36, f"SGST @9%: {money(inv['sgst'])}")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(300, y - 58, f"Grand Total: {money(inv['total'])}")


def draw_modern(c, v, inv):
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, 800, v["name"].upper())
    c.setFont("Helvetica", 10)
    c.drawString(50, 783, f"GST No. {v['gstin']}")
    c.drawString(50, 750, f"Bill No. {inv['no']}")
    c.drawString(50, 735, f"Dated {inv['date']:%d %b %Y}")
    c.drawString(300, 750, f"Customer GSTIN {BUYER_GSTIN}")
    y = 700
    for desc, qty, rate in inv["items"]:
        c.drawString(50, y, desc)
        c.drawRightString(400, y, str(qty))
        c.drawRightString(540, y, money(qty * rate))
        y -= 18
    y -= 10
    c.drawString(300, y, f"Sub Total {money(inv['taxable'])}")
    c.drawString(300, y - 18, f"IGST 18% {money(inv['igst'])}")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(300, y - 40, f"Amount Payable {money(inv['total'])}")


def draw_simple(c, v, inv):
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 800, v["name"])
    c.setFont("Helvetica", 10)
    c.drawString(50, 785, f"GSTIN/UIN: {v['gstin']}")
    c.drawString(50, 760, f"Invoice # {inv['no']}")
    c.drawString(50, 745, f"Date: {inv['date']:%d/%m/%Y}")
    y = 710
    for desc, qty, rate in inv["items"]:
        c.drawString(50, y, f"- {desc} ({qty} pcs)")
        y -= 16
    y -= 10
    c.drawString(300, y, f"Taxable Amount: {money(inv['taxable'])}")
    c.drawString(300, y - 16, f"Central Tax (CGST): {money(inv['cgst'])}")
    c.drawString(300, y - 32, f"State Tax (SGST): {money(inv['sgst'])}")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(300, y - 52, f"Total Amount: {money(inv['total'])}")


LAYOUTS = {"classic": draw_classic, "modern": draw_modern, "simple": draw_simple}
ITEMS = [("Corrugated Box 12x12", 85), ("Printer Paper A4", 290), ("Packing Tape Roll", 45),
         ("Stapler Heavy Duty", 380), ("Bubble Wrap 50m", 720), ("Whiteboard Marker Set", 160)]


def make_invoice(n: int, vendor) -> dict:
    name, state, pan, style = vendor
    v = {"name": name, "gstin": make_valid_gstin(state, pan, "1")}
    items = [(d, random.randint(5, 60), r) for d, r in random.sample(ITEMS, k=random.randint(2, 4))]
    taxable = round(sum(q * r for _, q, r in items), 2)
    inter_state = state != BUYER_GSTIN[:2]
    inv = {
        "no": f"{name[:2].upper()}/25-26/{100 + n}",
        "date": date(2025, 4, 1) + timedelta(days=random.randint(0, 180)),
        "items": items,
        "taxable": taxable,
        "cgst": 0 if inter_state else round(taxable * 0.09, 2),
        "sgst": 0 if inter_state else round(taxable * 0.09, 2),
        "igst": round(taxable * 0.18, 2) if inter_state else 0,
    }
    inv["total"] = round(taxable + inv["cgst"] + inv["sgst"] + inv["igst"], 2)
    return v, inv, style


def main():
    for f in OUT.glob("*.pdf"):
        f.unlink()

    count = 0
    for n in range(12):
        vendor = VENDORS[n % 3]
        v, inv, style = make_invoice(n, vendor)

        if n == 4:   # mistake 1: total typed wrong by vendor
            inv["total"] += 500
        if n == 8:   # mistake 2: one character wrong in GSTIN
            v["gstin"] = v["gstin"][:-1] + ("X" if v["gstin"][-1] != "X" else "Y")

        path = OUT / f"invoice_{n + 1:02d}.pdf"
        c = canvas.Canvas(str(path), pagesize=A4)
        LAYOUTS[style](c, v, inv)
        c.save()
        count += 1
    print(f"Created {count} sample invoices in {OUT}")


if __name__ == "__main__":
    main()
