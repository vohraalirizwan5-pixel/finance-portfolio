import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from extractor import parse_invoice, validate  # noqa: E402
from gstin import is_valid_gstin, make_valid_gstin  # noqa: E402

SAMPLE_TEXT = """Shree Ganesh Traders
GSTIN: 27ABCPG4521L1ZX
Invoice No: SH/25-26/101
Invoice Date: 15-06-2025
Taxable Value: Rs. 10,000.00
CGST @9%: Rs. 900.00
SGST @9%: Rs. 900.00
Grand Total: Rs. 11,800.00
"""


def test_known_real_format_gstin_is_valid():
    assert is_valid_gstin("27AAPFU0939F1ZV")  # widely used public sample GSTIN


def test_gstin_typo_is_caught():
    good = make_valid_gstin("27", "ABCPG4521L")
    assert is_valid_gstin(good)
    bad = good[:-1] + ("A" if good[-1] != "A" else "B")
    assert not is_valid_gstin(bad)


def test_parse_invoice_fields():
    inv = parse_invoice(SAMPLE_TEXT)
    assert inv["vendor"] == "Shree Ganesh Traders"
    assert inv["invoice_no"] == "SH/25-26/101"
    assert str(inv["invoice_date"]) == "2025-06-15"
    assert inv["taxable_value"] == 10000.00
    assert inv["cgst"] == 900.00
    assert inv["total"] == 11800.00


def test_total_mismatch_is_flagged():
    inv = parse_invoice(SAMPLE_TEXT.replace("11,800.00", "12,300.00"))
    inv["vendor_gstin"] = make_valid_gstin("27", "ABCPG4521L")
    assert any("Total mismatch" in i for i in validate(inv))


def test_wrong_tax_type_is_flagged():
    inv = {"vendor_gstin": make_valid_gstin("24", "AACCP7788M"), "invoice_no": "X1", "invoice_date": "2025-01-01",
           "taxable_value": 100.0, "cgst": 9.0, "sgst": 9.0, "igst": 0.0, "total": 118.0}
    assert any("inter-state" in i for i in validate(inv, our_state_code="27"))
