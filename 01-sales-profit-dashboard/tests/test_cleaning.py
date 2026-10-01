import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from cleaning import clean_sales, parse_date, parse_money, clean_text  # noqa: E402


def test_parse_money_handles_rupee_formats():
    assert parse_money("Rs 1,250") == 1250.0
    assert parse_money("₹1,250.50") == 1250.5
    assert parse_money("650") == 650.0
    assert parse_money(None) is None


def test_parse_date_handles_mixed_formats():
    expected = pd.Timestamp("2025-04-05")
    assert parse_date("05-04-2025") == expected
    assert parse_date("2025/04/05") == expected
    assert parse_date("05 Apr 2025") == expected


def test_clean_text():
    assert clean_text("  wireless MOUSE ") == "Wireless Mouse"


def test_clean_sales_removes_duplicates_and_calculates_profit():
    raw = pd.DataFrame([
        {"Invoice No": "INV-1", "Date": "01-04-2025", "Product": "pen", "Category": "Stationery",
         "Region": "MUMBAI", "Qty": 2, "Unit Price": "Rs 100", "Unit Cost": "60"},
        {"Invoice No": "INV-1", "Date": "01-04-2025", "Product": "pen", "Category": "Stationery",
         "Region": "MUMBAI", "Qty": 2, "Unit Price": "Rs 100", "Unit Cost": "60"},  # duplicate
        {k: None for k in ["Invoice No", "Date", "Product", "Category", "Region", "Qty", "Unit Price", "Unit Cost"]},
    ])
    df, report = clean_sales(raw)
    assert len(df) == 1
    assert report["duplicates_removed"] == 1
    assert report["empty_rows_removed"] == 1
    assert df.loc[0, "Revenue"] == 200
    assert df.loc[0, "Profit"] == 80
    assert df.loc[0, "Region"] == "Mumbai"
