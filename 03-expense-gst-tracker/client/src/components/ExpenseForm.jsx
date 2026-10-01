import { useState } from 'react';
import { inr, today } from '../format.js';

// Same formula as the server (server/src/gst.js), used here only for the live preview.
function preview(amount, rate, inclusive) {
  const a = Number(amount) || 0;
  const taxable = inclusive ? a / (1 + rate / 100) : a;
  return { taxable, gst: taxable * (rate / 100), total: taxable * (1 + rate / 100) };
}

export default function ExpenseForm({ meta, initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial
    ? { ...initial, amount: initial.taxable, inclusive: false }
    : { date: today(), vendor: '', category: meta.categories[0], description: '',
        amount: '', gst_rate: 18, inclusive: false, payment_mode: meta.paymentModes[0] });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, amount: Number(form.amount), gst_rate: Number(form.gst_rate) });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const p = preview(form.amount, Number(form.gst_rate), form.inclusive);

  return (
    <form className="card form" onSubmit={submit}>
      <h2>{initial ? 'Edit expense' : 'Add expense'}</h2>

      <div className="grid-2 tight">
        <label>Date
          <input type="date" name="date" value={form.date} onChange={update} required />
        </label>
        <label>Vendor
          <input name="vendor" value={form.vendor} onChange={update} placeholder="e.g. Shree Traders" required />
        </label>
        <label>Category
          <select name="category" value={form.category} onChange={update}>
            {meta.categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Payment mode
          <select name="payment_mode" value={form.payment_mode} onChange={update}>
            {meta.paymentModes.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label>Amount (₹)
          <input type="number" name="amount" value={form.amount} onChange={update} min="0.01" step="0.01" required />
        </label>
        <label>GST rate
          <select name="gst_rate" value={form.gst_rate} onChange={update}>
            {meta.gstRates.map((r) => <option key={r} value={r}>{r}%</option>)}
          </select>
        </label>
      </div>

      <label className="checkbox">
        <input type="checkbox" name="inclusive" checked={form.inclusive} onChange={update} />
        Amount already includes GST
      </label>

      <label>Description (optional)
        <input name="description" value={form.description} onChange={update} />
      </label>

      <div className="gst-preview" aria-live="polite">
        <span>Taxable <b>{inr(p.taxable)}</b></span>
        <span>GST <b>{inr(p.gst)}</b></span>
        <span>Total <b>{inr(p.total)}</b></span>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="row">
        <button className="btn primary" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Add expense'}</button>
        {initial && <button type="button" className="btn" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
