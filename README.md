# Alirizwan Vohra: Finance + Tech Portfolio

I combine a **B.Com background** with **data analysis and full-stack development** to build tools that save
accountants, CA firms, and small businesses hours of manual work.

| # | Project | What it solves | Tech |
|---|---|---|---|
| 1 | [Sales & Profit Dashboard](01-sales-profit-dashboard) | Cleans messy sales exports and shows which products and regions make money | Python, pandas, Streamlit, Plotly |
| 2 | [GST Invoice-to-Excel Automation](02-invoice-to-excel) | Reads PDF invoices into an Excel register; catches invalid GSTINs, wrong totals, wrong tax type | Python, pypdf, openpyxl |
| 3 | [Expense & GST Tracker](03-expense-gst-tracker) | Full-stack app to track expenses and claimable input tax credit | React, Node.js, Express, SQLite, JWT |

Every project has tests, sample data, and a README explaining the business problem.

## Quick start

| Project | Run | Tests |
|---|---|---|
| 1. Sales & Profit Dashboard | `pip install -r requirements.txt` then `streamlit run app.py` | `python -m pytest` (4 passing) |
| 2. GST Invoice-to-Excel | `pip install -r requirements.txt` then `python run.py` | `python -m pytest` (5 passing) |
| 3. Expense & GST Tracker | `npm install`, `npm run seed`, `npm run dev` in `server/`, then `npm run dev` in `client/` | `npm test` in `server/` (6 passing) |

All sample data (sales, invoices, expenses) is generated and fictional.

📫 Available for freelance work: dashboards, Excel/finance automation, and custom web tools.
