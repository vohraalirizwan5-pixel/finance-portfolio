import { inr } from '../format.js';

export default function ExpenseTable({ expenses, onEdit, onDelete }) {
  return (
    <div className="card table-card">
      <h2>Expenses</h2>
      {expenses.length === 0 ? (
        <p className="muted">No expenses for this filter yet. Add one on the left.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Vendor</th><th>Category</th>
                <th className="num">GST</th><th className="num">Total</th><th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td>{e.date.split('-').reverse().join('-')}</td>
                  <td>{e.vendor}<div className="muted small">{e.payment_mode}{e.description && ` · ${e.description}`}</div></td>
                  <td>{e.category}</td>
                  <td className="num">{inr(e.gst_amount)}<div className="muted small">{e.gst_rate}%</div></td>
                  <td className="num"><b>{inr(e.total)}</b></td>
                  <td className="actions">
                    <button className="btn small" onClick={() => onEdit(e)}>Edit</button>
                    <button className="btn small danger" onClick={() => onDelete(e)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
