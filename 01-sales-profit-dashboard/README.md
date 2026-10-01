# 📊 Sales & Profit Dashboard

**Problem:** Small businesses export sales data from Tally, Excel, or their POS system, and it is always messy:
mixed date formats, prices typed as `Rs 1,250`, duplicate invoices, empty rows. Owners can't see which
products and regions actually make money.

**Solution:** Upload the raw CSV. This app cleans it automatically, calculates revenue, cost, and profit, and shows an
interactive dashboard with plain-language insights.

## Features
- Automatic cleaning: 5 date formats, ₹/Rs/comma prices, extra spaces, wrong letter case, duplicates, empty rows
- **Data cleaning report** showing exactly what was fixed
- KPI cards: revenue, profit, margin %, orders (in Indian ₹ Lakh / Crore format)
- Monthly trend, profit by product, profit by region
- Filters by region and category
- Auto-written insights (best product, lowest margin, best month)
- Download the cleaned data as CSV

## Tech
Python · pandas · Streamlit · Plotly · pytest

## Run it
```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

python generate_data.py          # creates sample messy data in data/
streamlit run app.py             # opens the dashboard in your browser
pytest                           # runs the tests
```

## Project structure
| File | What it does |
|---|---|
| `generate_data.py` | Creates 1,500+ realistic, deliberately messy sales rows (FY 2025-26) |
| `cleaning.py` | All cleaning and profit logic, kept separate from the UI so it can be tested |
| `app.py` | The Streamlit dashboard |
| `tests/test_cleaning.py` | Unit tests for the cleaning rules |

## Sample result
From 1,555 raw rows: 10 empty rows, 45 duplicate invoices, and 34 incomplete rows removed, leaving 1,466 clean orders,
**₹1.14 Cr revenue** and **30.1% profit margin**.
