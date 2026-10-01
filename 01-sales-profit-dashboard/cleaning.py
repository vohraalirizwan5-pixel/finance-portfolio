"""
Cleans a messy sales export and calculates profit.

The main function is clean_sales(df). It returns:
  - the clean DataFrame
  - a "report" dict that says what was fixed (clients love seeing this)
"""
import re

import pandas as pd

DATE_FORMATS = ["%d-%m-%Y", "%Y/%m/%d", "%d %b %Y", "%Y-%m-%d", "%d/%m/%Y"]


def parse_date(value):
    """Try each known date format until one works."""
    if pd.isna(value):
        return pd.NaT
    text = str(value).strip()
    for fmt in DATE_FORMATS:
        try:
            return pd.to_datetime(text, format=fmt)
        except ValueError:
            continue
    return pd.NaT


def parse_money(value):
    """'Rs 1,250' / '₹1,250.00' / '1250' -> 1250.0"""
    if pd.isna(value):
        return None
    text = re.sub(r"[^\d.]", "", str(value))  # keep only digits and the dot
    return float(text) if text else None


def clean_text(value):
    """'  wireless MOUSE ' -> 'Wireless Mouse'"""
    if pd.isna(value):
        return value
    return " ".join(str(value).split()).title()


def clean_sales(raw: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    df = raw.copy()
    report = {"rows_received": len(df)}

    # 1. remove completely empty rows
    df = df.dropna(how="all")
    report["empty_rows_removed"] = report["rows_received"] - len(df)

    # 2. fix text columns
    for col in ["Product", "Category", "Region"]:
        df[col] = df[col].apply(clean_text)
    # .title() turns "USB-C" into "Usb-C", so fix that known brand word
    df["Product"] = df["Product"].str.replace("Usb-C", "USB-C", regex=False)

    # 3. remove duplicates (same invoice entered twice)
    #    done AFTER text cleaning, so "MUMBAI" and "Mumbai" count as the same
    before = len(df)
    df = df.drop_duplicates(subset=["Invoice No"])
    report["duplicates_removed"] = before - len(df)

    # 4. convert dates and money to real types
    df["Date"] = df["Date"].apply(parse_date)
    df["Unit Price"] = df["Unit Price"].apply(parse_money)
    df["Unit Cost"] = df["Unit Cost"].apply(parse_money)

    # 5. drop rows we cannot use (no date / no quantity / no price)
    before = len(df)
    df = df.dropna(subset=["Date", "Qty", "Unit Price", "Unit Cost"])
    report["unusable_rows_removed"] = before - len(df)

    # 6. business calculations
    df["Qty"] = df["Qty"].astype(int)
    df["Revenue"] = (df["Qty"] * df["Unit Price"]).round(2)
    df["Cost"] = (df["Qty"] * df["Unit Cost"]).round(2)
    df["Profit"] = (df["Revenue"] - df["Cost"]).round(2)
    df["Month"] = df["Date"].dt.to_period("M").dt.to_timestamp()

    df = df.sort_values("Date").reset_index(drop=True)
    report["clean_rows"] = len(df)
    return df, report


def kpis(df: pd.DataFrame) -> dict:
    """Headline numbers for the dashboard."""
    revenue = df["Revenue"].sum()
    profit = df["Profit"].sum()
    return {
        "revenue": revenue,
        "profit": profit,
        "margin_pct": (profit / revenue * 100) if revenue else 0.0,
        "orders": df["Invoice No"].nunique(),
    }
