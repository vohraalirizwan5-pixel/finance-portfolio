# 🧾 Expense & GST Tracker (Full Stack)

**Problem:** Small business owners lose track of expenses and the GST they paid on them. That GST is
**Input Tax Credit (ITC)** they can claim back in GSTR-3B, so every missed bill is lost money.

**Solution:** A web app where each business logs expenses. GST is split automatically, and the dashboard shows
total spending, claimable ITC, monthly trends, and spending by category. Data exports to CSV for the accountant.

## Features
- **Sign up / log in** with hashed passwords (bcrypt) and JWT sessions
- Add, edit, and delete expenses. Each user sees **only their own** data (enforced on the server and tested)
- **Automatic GST split**: enter the amount with or without GST, and the app calculates taxable value and GST, with a live preview
- Current GST slabs after the **GST 2.0 reform (22 Sep 2025)**: 0%, 5%, 18%, 40%
- Dashboard: total spent, claimable ITC, top category, 12-month trend, spending by category
- Filters by month and category, plus **Export CSV** (opens correctly in Excel)
- Responsive layout (desktop to mobile) with automatic light and dark mode

## Tech
| Layer | Tools |
|---|---|
| Frontend | React 18, Vite, Recharts |
| Backend | Node.js, Express, JWT, bcryptjs |
| Database | SQLite (Node's built-in `node:sqlite`, no setup needed) |
| Tests | `node:test`: API, auth, validation, data isolation between users |

## Run it
Needs **Node.js 22.13 or newer** (for the built-in SQLite). Open two terminals:

```bash
# Terminal 1: backend (http://localhost:4000)
cd server
npm install
npm run seed      # creates demo user + 6 months of data
npm run dev

# Terminal 2: frontend (http://localhost:5180)
cd client
npm install
npm run dev
```
Open **http://localhost:5180** and log in with `demo@example.com` / `demo12345`.

Run tests: `cd server && npm test`

## API
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in, returns JWT |
| GET | `/api/expenses?month=2026-06&category=Rent` | List expenses |
| POST | `/api/expenses` | Add expense `{date, vendor, category, amount, gst_rate, inclusive, payment_mode}` |
| PUT | `/api/expenses/:id` | Edit |
| DELETE | `/api/expenses/:id` | Delete |
| GET | `/api/expenses/summary` | Totals, by category, by GST rate, 12-month trend |
| GET | `/api/expenses/export.csv` | Download CSV |

## Security notes
- Passwords are never stored, only bcrypt hashes
- Every expense query includes `user_id`, so users can't read or change each other's data
- Set a strong `JWT_SECRET` environment variable in production (the server refuses to start without it when `NODE_ENV=production`)

## Next steps
- Upload bill photos and read them automatically (connects to Project 2, the invoice extractor)
- Multi-user businesses (owner + accountant roles)
- Deploy: frontend on Vercel, backend on Render or Railway with PostgreSQL
