import { Router } from 'express';
import { calcGst, CATEGORIES, GST_RATES, PAYMENT_MODES } from '../gst.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

// Checks the form data. Returns { error } or { value } ready to save.
function validateExpense(body) {
  const date = String(body.date || '');
  const vendor = String(body.vendor || '').trim();
  const category = String(body.category || '');
  const description = String(body.description || '').trim();
  const amount = Number(body.amount);
  const gstRate = Number(body.gst_rate);
  const paymentMode = String(body.payment_mode || 'UPI');

  if (!DATE_RE.test(date) || Number.isNaN(Date.parse(date))) return { error: 'Enter a valid date' };
  if (!vendor) return { error: 'Vendor is required' };
  if (!CATEGORIES.includes(category)) return { error: 'Choose a valid category' };
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Amount must be more than 0' };
  if (!GST_RATES.includes(gstRate)) return { error: `GST rate must be one of ${GST_RATES.join(', ')}` };
  if (!PAYMENT_MODES.includes(paymentMode)) return { error: 'Choose a valid payment mode' };

  const split = calcGst(amount, gstRate, Boolean(body.inclusive));
  return {
    value: { date, vendor, category, description, gst_rate: gstRate, payment_mode: paymentMode, ...split },
  };
}

// Builds "WHERE user_id = ? AND date LIKE '2025-06%' ..." from query filters
function filters(req) {
  const where = ['user_id = ?'];
  const params = [req.user.id];
  if (MONTH_RE.test(req.query.month || '')) {
    where.push('date LIKE ?');
    params.push(`${req.query.month}%`);
  }
  if (CATEGORIES.includes(req.query.category)) {
    where.push('category = ?');
    params.push(req.query.category);
  }
  return { sql: where.join(' AND '), params };
}

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function expenseRoutes(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const { sql, params } = filters(req);
    const rows = db.prepare(`SELECT * FROM expenses WHERE ${sql} ORDER BY date DESC, id DESC`).all(...params);
    res.json(rows);
  });

  router.get('/summary', (req, res) => {
    const { sql, params } = filters(req);
    const totals = db.prepare(`
      SELECT COUNT(*) AS count,
             COALESCE(SUM(taxable), 0)    AS taxable,
             COALESCE(SUM(gst_amount), 0) AS gst,
             COALESCE(SUM(total), 0)      AS total
      FROM expenses WHERE ${sql}`).get(...params);

    const byCategory = db.prepare(`
      SELECT category, SUM(total) AS total, COUNT(*) AS count
      FROM expenses WHERE ${sql} GROUP BY category ORDER BY total DESC`).all(...params);

    const byRate = db.prepare(`
      SELECT gst_rate, SUM(taxable) AS taxable, SUM(gst_amount) AS gst
      FROM expenses WHERE ${sql} GROUP BY gst_rate ORDER BY gst_rate`).all(...params);

    // monthly trend always shows the last 12 months for this user (ignores the month filter)
    const monthly = db.prepare(`
      SELECT substr(date, 1, 7) AS month, SUM(total) AS total, SUM(gst_amount) AS gst
      FROM expenses WHERE user_id = ?
      GROUP BY month ORDER BY month DESC LIMIT 12`).all(req.user.id).reverse();

    res.json({ totals, byCategory, byRate, monthly });
  });

  router.get('/export.csv', (req, res) => {
    const { sql, params } = filters(req);
    const rows = db.prepare(`SELECT * FROM expenses WHERE ${sql} ORDER BY date`).all(...params);
    const header = ['Date', 'Vendor', 'Category', 'Description', 'Taxable', 'GST %', 'GST', 'Total', 'Payment Mode'];
    const lines = rows.map((r) =>
      [r.date, r.vendor, r.category, r.description, r.taxable, r.gst_rate, r.gst_amount, r.total, r.payment_mode]
        .map(csvCell).join(','));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${req.query.month || 'all'}.csv"`);
    res.send('﻿' + [header.join(','), ...lines].join('\n')); // BOM so Excel shows ₹ correctly
  });

  router.post('/', (req, res) => {
    const { error, value } = validateExpense(req.body);
    if (error) return res.status(400).json({ error });
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO expenses (user_id, date, vendor, category, description, taxable, gst_rate, gst_amount, total, payment_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      req.user.id, value.date, value.vendor, value.category, value.description,
      value.taxable, value.gst_rate, value.gst_amount, value.total, value.payment_mode,
    );
    res.status(201).json(db.prepare('SELECT * FROM expenses WHERE id = ?').get(lastInsertRowid));
  });

  router.put('/:id', (req, res) => {
    const { error, value } = validateExpense(req.body);
    if (error) return res.status(400).json({ error });
    // "AND user_id = ?" makes sure users can only edit their OWN expenses
    const result = db.prepare(`
      UPDATE expenses SET date = ?, vendor = ?, category = ?, description = ?, taxable = ?,
             gst_rate = ?, gst_amount = ?, total = ?, payment_mode = ?
      WHERE id = ? AND user_id = ?`).run(
      value.date, value.vendor, value.category, value.description, value.taxable,
      value.gst_rate, value.gst_amount, value.total, value.payment_mode, req.params.id, req.user.id,
    );
    if (result.changes === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json(db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id));
  });

  router.delete('/:id', (req, res) => {
    const result = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Expense not found' });
    res.status(204).end();
  });

  return router;
}
