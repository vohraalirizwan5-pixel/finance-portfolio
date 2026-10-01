// Creates a demo user with 6 months of realistic expenses.
// Login: demo@example.com / demo12345
import bcrypt from 'bcryptjs';
import { openDb } from './db.js';
import { calcGst } from './gst.js';

const db = openDb();
const EMAIL = 'demo@example.com';

db.prepare('DELETE FROM users WHERE email = ?').run(EMAIL);
const { lastInsertRowid: userId } = db
  .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
  .run('Demo Business', EMAIL, bcrypt.hashSync('demo12345', 10));

// [vendor, category, base amount, gst rate, payment mode]
const MONTHLY = [
  ['Shree Properties', 'Rent', 35000, 18, 'Bank Transfer'],
  ['Adani Electricity', 'Utilities', 4200, 18, 'UPI'],
  ['Jio Fiber', 'Utilities', 1178, 18, 'UPI'],
  ['Zoho', 'Software', 2400, 18, 'Card'],
  ['Staff Salaries', 'Salaries', 85000, 0, 'Bank Transfer'],
];
const RANDOM = [
  ['Patel Packaging', 'Inventory', 18, 'Bank Transfer', 8000, 40000],
  ['Sunrise Office Supplies', 'Office Supplies', 18, 'UPI', 500, 4000],
  ['IndiGo', 'Travel', 5, 'Card', 3500, 9000],
  ['Swiggy', 'Food', 5, 'UPI', 300, 1800],
  ['Meta Ads', 'Marketing', 18, 'Card', 2000, 10000],
  ['Sharma & Co. CA', 'Professional Fees', 18, 'Bank Transfer', 5000, 12000],
];

const insert = db.prepare(`
  INSERT INTO expenses (user_id, date, vendor, category, description, taxable, gst_rate, gst_amount, total, payment_mode)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); // repeatable random numbers

let count = 0;
const today = new Date();
for (let m = 5; m >= 0; m--) {
  const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
  const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  // in the current month, never create expenses dated after today
  const lastDay = m === 0 ? today.getDate() : 28;
  const day = (n) => `${ym}-${String(Math.min(n, lastDay)).padStart(2, '0')}`;

  for (const [vendor, category, amount, rate, mode] of MONTHLY) {
    const g = calcGst(amount, rate);
    insert.run(userId, day(5), vendor, category, 'Monthly', g.taxable, rate, g.gst_amount, g.total, mode);
    count++;
  }
  for (let i = 0; i < 8; i++) {
    const [vendor, category, rate, mode, min, max] = RANDOM[Math.floor(rand() * RANDOM.length)];
    const g = calcGst(Math.round(min + rand() * (max - min)), rate);
    insert.run(userId, day(1 + Math.floor(rand() * 27)), vendor, category, '', g.taxable, rate, g.gst_amount, g.total, mode);
    count++;
  }
}
console.log(`Seeded ${count} expenses. Login: ${EMAIL} / demo12345`);
