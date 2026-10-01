import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router } from 'express';

const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function makeToken(user) {
  return jwt.sign({ id: user.id, name: user.name }, SECRET, { expiresIn: '7d' });
}

// Middleware: only lets the request through if it has a valid token.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

export function authRoutes(db) {
  const router = Router();

  router.post('/register', (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) return res.status(409).json({ error: 'An account with this email already exists' });

    const hash = bcrypt.hashSync(password, 10);
    const { lastInsertRowid } = db
      .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(name, email, hash);
    const user = { id: Number(lastInsertRowid), name };
    res.status(201).json({ token: makeToken(user), user });
  });

  router.post('/login', (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    // same message for both cases, so attackers can't find which emails exist
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      return res.status(401).json({ error: 'Wrong email or password' });
    }
    const user = { id: row.id, name: row.name };
    res.json({ token: makeToken(user), user });
  });

  return router;
}
