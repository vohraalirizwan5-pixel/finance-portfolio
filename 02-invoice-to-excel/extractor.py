"""
Reads GST invoice PDFs and pulls out the important fields.

extract_text(pdf)  -> raw text from the PDF
parse_invoice(text) -> dict of fields
validate(invoice)   -> list of problems (empty list = all good)
"""
import re
from datetime import datetime
from pathlib import Path

from pypdf import PdfReader

from gstin import is_valid_gstin

# Different vendors write the same thing in different ways.
# Each field has a list of labels we accept.
LABELS = {
    "invoice_no": r"Invoice\s*No\.?|Bill\s*No\.?|Invoice\s*#",
    "date": r"Invoice\s*Date|Dated|Date",
    "taxable": r"Taxable\s*Value|Taxable\s*Amount|Sub\s*Total",
    "cgst": r"CGST",
    "sgst": r"SGST",
    "igst": r"IGST",
    "total": r"Grand\s*Total|Amount\s*Payable|Total\s*Amount",
}
DATE_FORMATS = ["%d-%m-%Y", "%d/%m/%Y", "%d %b %Y", "%Y-%m-%d"]
GSTIN_LIKE = r"\b\d{2}[A-Z0-9]{13}\b"  # loose on purpose, so we can catch invalid ones too
TOLERANCE = 1.00  # allow ₹1 difference for rounding


def extract_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def find_amount(label: str, text: str) -> float | None:
    """Find 'Label ... Rs. 1,234.56' on one line and return 1234.56"""
    match = re.search(rf"(?:{label})[^\n]*?(?:Rs\.?|₹)\s*([\d,]+\.\d{{2}})", text, re.IGNORECASE)
    return float(match.group(1).replace(",", "")) if match else None


def find_date(text: str):
    match = re.search(rf"(?:{LABELS['date']})\s*:?\s*(\d{{1,2}}[-/ ][A-Za-z0-9]{{2,3}}[-/ ]\d{{4}})", text)
    if not match:
        return None
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(match.group(1), fmt).date()
        except ValueError:
            continue
    return None


def parse_invoice(text: str) -> dict:
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    # buyer GSTIN is the one written after "Bill To" / "Customer"
    buyer = re.search(rf"(?:Bill\s*To|Customer)\s*GSTIN\s*:?\s*({GSTIN_LIKE})", text)
    buyer_gstin = buyer.group(1) if buyer else None
    # seller GSTIN is the first GSTIN on the page that isn't the buyer's
    all_gstins = re.findall(GSTIN_LIKE, text)
    seller_gstin = next((g for g in all_gstins if g != buyer_gstin), None)

    inv_no = re.search(rf"(?:{LABELS['invoice_no']})\s*:?\s*([A-Z0-9/\-]+)", text, re.IGNORECASE)

    return {
        "vendor": lines[0].title() if lines else None,
        "vendor_gstin": seller_gstin,
        "buyer_gstin": buyer_gstin,
        "invoice_no": inv_no.group(1) if inv_no else None,
        "invoice_date": find_date(text),
        "taxable_value": find_amount(LABELS["taxable"], text),
        "cgst": find_amount(LABELS["cgst"], text) or 0.0,
        "sgst": find_amount(LABELS["sgst"], text) or 0.0,
        "igst": find_amount(LABELS["igst"], text) or 0.0,
        "total": find_amount(LABELS["total"], text),
    }


def validate(inv: dict, our_state_code: str = "27") -> list[str]:
    """Return a list of human-readable problems with this invoice."""
    issues = []

    for field in ["vendor_gstin", "invoice_no", "invoice_date", "taxable_value", "total"]:
        if inv.get(field) in (None, ""):
            issues.append(f"Missing {field.replace('_', ' ')}")

    gstin = inv.get("vendor_gstin")
    if gstin and not is_valid_gstin(gstin):
        issues.append(f"Invalid vendor GSTIN ({gstin})")

    if inv.get("taxable_value") is not None and inv.get("total") is not None:
        expected = inv["taxable_value"] + inv["cgst"] + inv["sgst"] + inv["igst"]
        diff = inv["total"] - expected
        if abs(diff) > TOLERANCE:
            issues.append(f"Total mismatch: invoice says {inv['total']:,.2f}, calculated {expected:,.2f} "
                          f"(difference {diff:+,.2f})")

    # same state -> CGST + SGST, different state -> IGST
    if gstin and len(gstin) >= 2:
        same_state = gstin[:2] == our_state_code
        if same_state and inv["igst"] > 0:
            issues.append("IGST charged on an intra-state purchase (should be CGST + SGST)")
        if not same_state and (inv["cgst"] > 0 or inv["sgst"] > 0):
            issues.append("CGST/SGST charged on an inter-state purchase (should be IGST)")

    return issues


def process_pdf(pdf_path: Path) -> dict:
    inv = parse_invoice(extract_text(pdf_path))
    issues = validate(inv)
    inv["file"] = pdf_path.name
    inv["status"] = "OK" if not issues else "Needs review"
    inv["issues"] = "; ".join(issues)
    return inv
