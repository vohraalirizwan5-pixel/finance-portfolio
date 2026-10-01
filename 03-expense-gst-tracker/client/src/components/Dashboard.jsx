import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { currentMonth, inr } from '../format.js';
import Charts from './Charts.jsx';
import ExpenseForm from './ExpenseForm.jsx';
import ExpenseTable from './ExpenseTable.jsx';

export default function Dashboard({ user, onLogout }) {
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ month: currentMonth(), category: '' });
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editing, setEditing] = useState(null); // the expense being edited, or null
  const [error, setError] = useState('');

  const handleError = useCallback((err) => {
    if (err.status === 401) onLogout();
    else setError(err.message);
  }, [onLogout]);

  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([api.listExpenses(filters), api.summary(filters)]);
      setExpenses(list);
      setSummary(sum);
      setError('');
    } catch (err) {
      handleError(err);
    }
  }, [filters, handleError]);

  useEffect(() => { api.meta().then(setMeta).catch(handleError); }, [handleError]);
  useEffect(() => { load(); }, [load]);

  async function save(data) {
    if (editing) await api.updateExpense(editing.id, data);
    else await api.createExpense(data);
    setEditing(null);
    await load();
  }

  async function remove(expense) {
    if (!window.confirm(`Delete ${expense.vendor} – ${inr(expense.total)}?`)) return;
    try {
      await api.deleteExpense(expense.id);
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  const setFilter = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const t = summary?.totals;
  const topCategory = summary?.byCategory[0];

  return (
    <div className="page">
      <header className="topbar">
        <h1>🧾 Expense & GST Tracker</h1>
        <div className="row">
          <span className="muted">Hi, {user.name}</span>
          <button className="btn" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <section className="filters row" aria-label="Filters">
        <label>Month
          <input type="month" name="month" value={filters.month} onChange={setFilter} />
        </label>
        <button className="btn" onClick={() => setFilters({ ...filters, month: '' })} disabled={!filters.month}>
          All time
        </button>
        <label>Category
          <select name="category" value={filters.category} onChange={setFilter}>
            <option value="">All categories</option>
            {meta?.categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <button className="btn push-right" onClick={() => api.exportCsv(filters).catch(handleError)}>
          ⬇ Export CSV
        </button>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="stats">
        <Stat label="Total spent" value={inr(t?.total)} />
        <Stat label="GST paid (claimable ITC)" value={inr(t?.gst)} hint="Input tax credit you can claim in GSTR-3B" />
        <Stat label="Expenses" value={t?.count ?? 0} />
        <Stat label="Top category" value={topCategory?.category ?? '–'} hint={topCategory && inr(topCategory.total)} />
      </section>

      {summary && <Charts summary={summary} />}

      <section className="grid-2">
        {meta && (
          <ExpenseForm
            key={editing?.id ?? 'new'}
            meta={meta}
            initial={editing}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        )}
        <ExpenseTable expenses={expenses} onEdit={setEditing} onDelete={remove} />
      </section>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="card stat">
      <div className="muted small">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="muted small">{hint}</div>}
    </div>
  );
}
