require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { kmeans1D } = require('./kmeans');
const { createStore } = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = 'mock-jwt-token';
let store = null;

app.use(cors());
app.use(express.json());

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------- Auth ----------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === 'admin' && password === 'password123') {
    return res.status(200).json({ success: true, token: TOKEN });
  }
  return res.status(401).json({ success: false, message: 'Invalid username or password' });
});

function requireAuth(req, res, next) {
  if ((req.headers.authorization || '') === `Bearer ${TOKEN}`) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized' });
}
app.use('/api/employees', requireAuth);

// ---------- Phase 2 ----------
app.get('/api/employees/salary-clusters', wrap(async (req, res) => {
  const salaries = await store.salaries();
  if (salaries.length === 0) {
    return res.status(400).json({ success: false, message: 'No employees to analyze' });
  }
  const clusters = kmeans1D(salaries, 3).map((c, i) => ({
    group: `Tier ${i + 1}`,
    centroid: c.centroid,
    count: c.count,
  }));
  res.status(200).json({ success: true, clusters });
}));

// ---------- Phase 1 ----------
app.get('/api/employees', wrap(async (req, res) => {
  res.status(200).json(await store.list());
}));

app.post('/api/employees', wrap(async (req, res) => {
  const { name, position, salary } = req.body || {};
  const blank = (v) => v === undefined || v === null || String(v).trim() === '';
  if (blank(name) || blank(position) || blank(salary)) {
    return res.status(400).json({ success: false, message: 'name, position and salary are required' });
  }
  const salaryNum = Number(salary);
  if (!Number.isFinite(salaryNum) || salaryNum < 0) {
    return res.status(400).json({ success: false, message: 'salary must be a non-negative number' });
  }
  const emp = await store.create({ name: String(name).trim(), position: String(position).trim(), salary: salaryNum });
  res.status(201).json(emp);
}));

app.put('/api/employees/:id/status', wrap(async (req, res) => {
  const emp = await store.toggle(req.params.id);
  if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.status(200).json(emp);
}));

app.delete('/api/employees/:id', wrap(async (req, res) => {
  const ok = await store.remove(req.params.id);
  if (!ok) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.status(200).json({ success: true, message: 'Employee deleted' });
}));

// ---------- Errors ----------
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

createStore().then((s) => {
  store = s;
  app.listen(PORT, '0.0.0.0', () => console.log(`Backend running on port ${PORT} (${store.kind})`));
});
