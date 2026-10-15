// Data layer: MySQL when reachable, otherwise in-memory array (so the app always starts).
const mysql = require('mysql2/promise');

const SEED = [
  ['John Doe', 'Software Engineer', 'Active', 45000],
  ['Jane Smith', 'HR Manager', 'Active', 55000],
  ['Mike Brown', 'Accountant', 'On Leave', 30000],
  ['Sarah Lee', 'Designer', 'Active', 25000],
  ['David Kim', 'Developer', 'Active', 65000],
  ['Anna Wong', 'Support Agent', 'On Leave', 19000],
  ['Nattapong K.', 'Engineering Director', 'Active', 90000],
];

const clean = (r) => ({
  id: String(r.id),
  name: r.name,
  position: r.position,
  status: r.status,
  salary: Number(r.salary),
});

// ---------- In-memory ----------
function memoryStore() {
  let nextId = 1;
  let rows = SEED.map(([name, position, status, salary]) => ({ id: String(nextId++), name, position, status, salary }));
  return {
    kind: 'memory',
    async list() { return rows.map((r) => ({ ...r })); },
    async create({ name, position, salary }) {
      const r = { id: String(nextId++), name, position, status: 'Active', salary };
      rows.push(r);
      return { ...r };
    },
    async toggle(id) {
      const r = rows.find((x) => x.id === String(id));
      if (!r) return null;
      r.status = r.status === 'Active' ? 'On Leave' : 'Active';
      return { ...r };
    },
    async remove(id) {
      const i = rows.findIndex((x) => x.id === String(id));
      if (i === -1) return false;
      rows.splice(i, 1);
      return true;
    },
    async salaries() { return rows.map((r) => r.salary); },
  };
}

// ---------- MySQL ----------
function mysqlStore(pool) {
  const validId = (id) => /^\d+$/.test(String(id));
  return {
    kind: 'mysql',
    async list() {
      const [rows] = await pool.query('SELECT id, name, position, status, salary FROM employees ORDER BY id');
      return rows.map(clean);
    },
    async create({ name, position, salary }) {
      const [res] = await pool.query(
        'INSERT INTO employees (name, position, status, salary) VALUES (?, ?, ?, ?)',
        [name, position, 'Active', salary]
      );
      const [rows] = await pool.query('SELECT id, name, position, status, salary FROM employees WHERE id = ?', [res.insertId]);
      return clean(rows[0]);
    },
    async toggle(id) {
      if (!validId(id)) return null;
      const [found] = await pool.query('SELECT id FROM employees WHERE id = ?', [id]);
      if (found.length === 0) return null;
      await pool.query("UPDATE employees SET status = IF(status = 'Active', 'On Leave', 'Active') WHERE id = ?", [id]);
      const [rows] = await pool.query('SELECT id, name, position, status, salary FROM employees WHERE id = ?', [id]);
      return clean(rows[0]);
    },
    async remove(id) {
      if (!validId(id)) return false;
      const [res] = await pool.query('DELETE FROM employees WHERE id = ?', [id]);
      return res.affectedRows > 0;
    },
    async salaries() {
      const [rows] = await pool.query('SELECT salary FROM employees');
      return rows.map((r) => Number(r.salary));
    },
  };
}

async function createStore() {
  if (process.env.USE_MEMORY !== 'true' && process.env.DB_HOST) {
    try {
      const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectTimeout: 5000,
        connectionLimit: 5,
        waitForConnections: true,
      });
      await pool.query('SELECT 1');
      // No-op if the table already exists (as in phpMyAdmin)
      await pool.query(`CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        position VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Active',
        salary DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM employees');
      if (n === 0) {
        await pool.query('INSERT INTO employees (name, position, status, salary) VALUES ?', [SEED]);
      }
      console.log('Data store: MySQL connected');
      return mysqlStore(pool);
    } catch (e) {
      console.warn(`MySQL unavailable (${e.code || e.message}). Falling back to in-memory data.`);
    }
  }
  console.log('Data store: in-memory');
  return memoryStore();
}

module.exports = { createStore };
