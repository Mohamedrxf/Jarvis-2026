const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// POST /api/auth/register
const register = (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'Username, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const sql = `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`;

  db.run(sql, [username, email, passwordHash], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ success: false, error: 'Email or username already exists.' });
      }
      console.error('[AuthController] Register error:', err);
      return res.status(500).json({ success: false, error: 'Database error during registration.' });
    }

    const token = jwt.sign(
      { id: this.lastID, username, email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES || '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: { id: this.lastID, username, email }
    });
  });
};

// POST /api/auth/login
const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const sql = `SELECT * FROM users WHERE email = ?`;

  db.get(sql, [email], (err, user) => {
    if (err) {
      console.error('[AuthController] Login error:', err);
      return res.status(500).json({ success: false, error: 'Database error during login.' });
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES || '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  });
};

// GET /api/auth/me (protected)
const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    }
  });
};

module.exports = { register, login, getMe };
