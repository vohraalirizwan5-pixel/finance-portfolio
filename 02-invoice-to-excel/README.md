# 🧾 GST Invoice-to-Excel Automation

**Problem:** Accountants and CA firms spend hours every month typing purchase invoices into Excel: vendor, GSTIN,
invoice number, taxable value, CGST/SGST/IGST, total. It's slow, and typing mistakes cause wrong Input Tax Credit (ITC) claims.

**Solution:** Drop all PDF invoices into a folder and run one command. You get a formatted Excel register in seconds,
and the tool **flags invoices that need a human check**.

## What it checks automatically
| Check | Example caught |
|---|---|
| **GSTIN checksum** (official check-digit rule) | `27BDJPS3310Q1ZX`: last digit is wrong, so it's a typo or a fake GSTIN |
| **Total = Taxable + GST** | Invoice says ₹35,274.60, but the calculation gives ₹34,774.60 (+₹500) |
| **Correct tax type** | CGST+SGST charged on an inter-state purchase (should be IGST), or the reverse |
| **Missing fields** | No invoice number, date, or total found |

## Works with different invoice layouts
Vendors label the same field differently. The extractor understands all of these:
- `Invoice No:` / `Bill No.` / `Invoice #`
- `Taxable Value` / `Sub Total` / `Taxable Amount`
- `Grand Total` / `Amount Payable` / `Total Amount`
- Dates as `15-06-2025`, `15/06/2025`, `15 Jun 2025`

## Excel output (4 sheets)
1. **All Invoices**: every invoice, with rows that need review highlighted in red
2. **Needs Review**: only the problem invoices, with the reason
3. **Vendor Summary**: taxable value and GST per vendor
4. **Monthly GST**: month-wise CGST / SGST / IGST and total ITC, useful when matching against GSTR-2B

## Tech
Python · pypdf · pandas · openpyxl · pytest (reportlab for the sample invoices)

## Run it
```bash
pip install -r requirements.txt
python make_sample_invoices.py     # creates 12 sample invoices (2 with planted mistakes)
python run.py                      # invoices/ -> output/invoice_register.xlsx
python run.py "D:\My Invoices" my_report.xlsx    # use your own folder
pytest
```

Sample run:
```
Processed 12 invoices -> output/invoice_register.xlsx
  OK: 10   Needs review: 2
  ! invoice_05.pdf: Total mismatch: invoice says 35,274.60, calculated 34,774.60 (difference +500.00)
  ! invoice_09.pdf: Invalid vendor GSTIN (27BDJPS3310Q1ZX)
```

## Limitations and next steps
- Works with **digital PDFs** (text can be selected). Scanned or photographed invoices need OCR. The next version can add
  Tesseract or an AI vision model for those.
- New vendor layouts are added by extending the `LABELS` dictionary in `extractor.py`.
