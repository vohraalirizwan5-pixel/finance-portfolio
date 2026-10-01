import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { inr, inrShort, monthLabel } from '../format.js';

// Colors come from CSS variables, so the charts follow light / dark mode automatically.
const axis = { stroke: 'var(--axis)', tick: { fill: 'var(--text-secondary)', fontSize: 12 } };

function ChartTooltip({ active, payload, label, labelFormat = (l) => l }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="tooltip">
      <div className="tooltip-title">{labelFormat(label)}</div>
      <div>Total: <b>{inr(row.total)}</b></div>
      {row.gst !== undefined && <div>GST: {inr(row.gst)}</div>}
      {row.count !== undefined && <div className="muted small">{row.count} expenses</div>}
    </div>
  );
}

export default function Charts({ summary }) {
  const { monthly, byCategory } = summary;
  if (!monthly.length) return null;

  return (
    <section className="grid-2">
      <figure className="card chart">
        <figcaption>
          <h2>Monthly spending</h2>
          <p className="muted small">Last 12 months, including GST</p>
        </figcaption>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="month" tickFormatter={(m) => monthLabel(m).split(' ')[0]} {...axis} tickLine={false} />
            <YAxis tickFormatter={inrShort} {...axis} tickLine={false} axisLine={false} width={56} />
            <Tooltip content={<ChartTooltip labelFormat={monthLabel} />} cursor={{ fill: 'var(--hover)' }} />
            <Bar dataKey="total" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </figure>

      <figure className="card chart">
        <figcaption>
          <h2>Where the money goes</h2>
          <p className="muted small">Spending by category for the selected filter</p>
        </figcaption>
        {byCategory.length === 0 ? <p className="muted">No data</p> : (
          <ResponsiveContainer width="100%" height={Math.max(160, byCategory.length * 34)}>
            <BarChart data={byCategory} layout="vertical" margin={{ top: 0, right: 64, left: 8, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="category" width={120} {...axis} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--hover)' }} />
              <Bar dataKey="total" fill="var(--series-1)" radius={[0, 4, 4, 0]} barSize={18}>
                <LabelList dataKey="total" position="right" formatter={inrShort} fill="var(--text-secondary)" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </figure>
    </section>
  );
}
