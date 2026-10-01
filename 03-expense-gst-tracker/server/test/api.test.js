import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';
import { calcGst } from '../src/gst.js';

let server;
let base;

before(() => {
  server = createApp(openDb(':memory:')).listen(0); // in-memory DB, random free port
  base = `http://localhost:${server.address().port}/api`;
});
after(() => server.close());

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

const register = async (email) =>
  (await call('/auth/register', { method: 'POST', body: { name: 'Test', email, password: 'password123' } })).data.token;

const expense = { date: '2025-06-10', vendor: 'Zoho', category: 'Software', amount: 1000, gst_rate: 18 };

test('GST calculation: exclusive and inclusive', () => {
  assert.deepEqual(calcGst(1000, 18), { taxable: 1000, gst_amount: 180, total: 1180 });
  assert.deepEqual(calcGst(1180, 18, true), { taxable: 1000, gst_amount: 180, total: 1180 });
});

test('expenses need login', async () => {
  assert.equal((await call('/expenses')).status, 401);
});

test('register rejects weak password and duplicate email', async () => {
  const weak = await call('/auth/register', { method: 'POST', body: { name: 'A', email: 'a@x.com', password: '123' } });
  assert.equal(weak.status, 400);
  await register('dup@x.com');
  const dup = await call('/auth/register', { method: 'POST', body: { name: 'A', email: 'dup@x.com', password: 'password123' } });
  assert.equal(dup.status, 409);
});

test('create, list, summarise, delete an expense', async () => {
  const token = await register('flow@x.com');
  const created = await call('/expenses', { method: 'POST', token, body: expense });
  assert.equal(created.status, 201);
  assert.equal(created.data.total, 1180);

  const list = await call('/expenses?month=2025-06', { token });
  assert.equal(list.data.length, 1);

  const summary = await call('/expenses/summary?month=2025-06', { token });
  assert.equal(summary.data.totals.gst, 180);
  assert.equal(summary.data.byCategory[0].category, 'Software');

  assert.equal((await call(`/expenses/${created.data.id}`, { method: 'DELETE', token })).status, 204);
});

test('invalid GST rate is rejected', async () => {
  const token = await register('rate@x.com');
  const res = await call('/expenses', { method: 'POST', token, body: { ...expense, gst_rate: 12 } });
  assert.equal(res.status, 400);
});

test("a user cannot see or delete another user's expense", async () => {
  const alice = await register('alice@x.com');
  const bob = await register('bob@x.com');
  const { data } = await call('/expenses', { method: 'POST', token: alice, body: expense });

  assert.equal((await call('/expenses', { token: bob })).data.length, 0);
  assert.equal((await call(`/expenses/${data.id}`, { method: 'DELETE', token: bob })).status, 404);
});
