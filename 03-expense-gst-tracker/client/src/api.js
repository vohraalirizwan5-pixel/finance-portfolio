// One place for all server calls. Adds the login token to every request.
const TOKEN_KEY = 'egt_token';

export const auth = {
  get token() {
    return localStorage.getItem(TOKEN_KEY);
  },
  save(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth.token && { Authorization: `Bearer ${auth.token}` }),
    },
    body: body && JSON.stringify(body),
  });

  if (res.status === 401) auth.clear();
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const query = (params) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return q ? `?${q}` : '';
};

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  meta: () => request('/meta'),
  listExpenses: (filters) => request(`/expenses${query(filters)}`),
  summary: (filters) => request(`/expenses/summary${query(filters)}`),
  createExpense: (body) => request('/expenses', { method: 'POST', body }),
  updateExpense: (id, body) => request(`/expenses/${id}`, { method: 'PUT', body }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // the CSV needs the token too, so we download it with fetch and save it as a file
  async exportCsv(filters) {
    const res = await fetch(`/api/expenses/export.csv${query(filters)}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (!res.ok) throw new Error('Export failed');
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `expenses-${filters.month || 'all'}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  },
};
