import bcrypt from 'bcryptjs';
import { getSql, initializeDatabase } from '../config/db.js';
import { generateToken } from '../middleware/authMiddleware.js';

export async function registerUser(req, res) {
  try {
    await initializeDatabase();
    const sql = getSql();
    if (!sql) {
      return res.status(503).json({
        error: 'Neon PostgreSQL DATABASE_URL is not configured yet. Add DATABASE_URL to your .env file to enable cloud accounts.'
      });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name.trim()}, ${normalizedEmail}, ${passwordHash})
      RETURNING id, name, email, created_at
    `;

    const user = created[0];
    const token = generateToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return res.status(500).json({ error: `Registration failed: ${err.message}` });
  }
}

export async function loginUser(req, res) {
  try {
    await initializeDatabase();
    const sql = getSql();
    if (!sql) {
      return res.status(503).json({
        error: 'Neon PostgreSQL DATABASE_URL is not configured yet. Add DATABASE_URL to your .env file to enable cloud accounts.'
      });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const rows = await sql`
      SELECT id, name, email, password_hash, created_at
      FROM users
      WHERE email = ${normalizedEmail}
    `;

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userRow = rows[0];
    const valid = await bcrypt.compare(password, userRow.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      created_at: userRow.created_at
    };
    const token = generateToken(user);
    return res.json({ user, token });
  } catch (err) {
    return res.status(500).json({ error: `Sign in failed: ${err.message}` });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const sql = getSql();
    if (!sql) {
      return res.json({ user: req.user });
    }
    const rows = await sql`
      SELECT id, name, email, created_at
      FROM users
      WHERE id = ${req.user.id}
    `;
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
