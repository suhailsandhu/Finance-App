import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("finance.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS paychecks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    label TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS paycheck_allocations (
    paycheck_id INTEGER NOT NULL,
    category_id TEXT NOT NULL,
    percentage REAL NOT NULL,
    PRIMARY KEY (paycheck_id, category_id),
    FOREIGN KEY (paycheck_id) REFERENCES paychecks(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paycheck_id INTEGER NOT NULL,
    category_id TEXT NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paycheck_id) REFERENCES paychecks(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
`);

// Seed initial categories if empty
const categoryCount = db.prepare("SELECT count(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  const insert = db.prepare("INSERT INTO categories (id, name, color) VALUES (?, ?, ?)");
  insert.run("charity", "Charity", "#10B981");
  insert.run("debt", "Debt", "#EF4444");
  insert.run("sama", "Sama", "#EC4899");
  insert.run("personal", "Personal", "#F59E0B");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/paychecks", (req, res) => {
    const paychecks = db.prepare("SELECT * FROM paychecks ORDER BY date ASC").all();
    res.json(paychecks);
  });

  app.post("/api/paychecks", (req, res) => {
    const { amount, label, date } = req.body;
    const result = db.prepare("INSERT INTO paychecks (date, amount, label) VALUES (?, ?, ?)")
      .run(date || new Date().toISOString().split('T')[0], amount, label || `Paycheck — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
    
    const paycheckId = result.lastInsertRowid;
    
    // Create default allocations for new paycheck
    const categories = db.prepare("SELECT id FROM categories").all() as { id: string }[];
    const defaultPercentage = 1 / categories.length;
    const insertAlloc = db.prepare("INSERT INTO paycheck_allocations (paycheck_id, category_id, percentage) VALUES (?, ?, ?)");
    categories.forEach(c => {
      insertAlloc.run(paycheckId, c.id, defaultPercentage);
    });

    res.json({ id: paycheckId });
  });

  app.patch("/api/paychecks/:id", (req, res) => {
    const { id } = req.params;
    const { amount, date, label } = req.body;
    db.prepare("UPDATE paychecks SET amount = ?, date = ?, label = ? WHERE id = ?").run(amount, date, label, id);
    res.json({ success: true });
  });

  app.delete("/api/paychecks/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM paychecks WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/categories", (req, res) => {
    const { paycheckId } = req.query;
    if (paycheckId) {
      const categories = db.prepare(`
        SELECT c.*, COALESCE(pa.percentage, 0.25) as percentage
        FROM categories c
        LEFT JOIN paycheck_allocations pa ON c.id = pa.category_id AND pa.paycheck_id = ?
      `).all(paycheckId);
      res.json(categories);
    } else {
      const categories = db.prepare("SELECT * FROM categories").all();
      res.json(categories);
    }
  });

  app.patch("/api/categories/:id", (req, res) => {
    const { id } = req.params;
    const { percentage, paycheckId } = req.body;
    if (paycheckId) {
      db.prepare(`
        INSERT INTO paycheck_allocations (paycheck_id, category_id, percentage)
        VALUES (?, ?, ?)
        ON CONFLICT(paycheck_id, category_id) DO UPDATE SET percentage = excluded.percentage
      `).run(paycheckId, id, percentage);
    } else {
      // Fallback or global update if needed, but we prefer paycheck-specific now
    }
    res.json({ success: true });
  });

  app.get("/api/transactions/:paycheckId", (req, res) => {
    const { paycheckId } = req.params;
    const transactions = db.prepare(`
      SELECT t.*, c.name as category_name 
      FROM transactions t 
      JOIN categories c ON t.category_id = c.id 
      WHERE t.paycheck_id = ? 
      ORDER BY t.timestamp DESC
    `).all(paycheckId);
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { paycheck_id, category_id, amount, note } = req.body;
    const result = db.prepare("INSERT INTO transactions (paycheck_id, category_id, amount, note) VALUES (?, ?, ?, ?)")
      .run(paycheck_id, category_id, amount, note);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.put("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    const { amount, note, category_id } = req.body;
    db.prepare("UPDATE transactions SET amount = ?, note = ?, category_id = ? WHERE id = ?")
      .run(amount, note, category_id, id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
