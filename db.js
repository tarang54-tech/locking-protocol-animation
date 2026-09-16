/**
 * db.js — SQLite Database Module (using sql.js — pure JavaScript)
 * Manages simulation history with persistent file-backed SQLite.
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'database.db');

let db = null;

/** Save database to disk */
function saveToDisk() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/** Initialize database — returns a Promise */
async function init() {
  const SQL = await initSqlJs();

  // Load existing database file or create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create table if not exists
  db.run(`
    CREATE TABLE IF NOT EXISTS simulations (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      protocol TEXT NOT NULL DEFAULT '',
      protocol_key TEXT NOT NULL DEFAULT '',
      example_name TEXT DEFAULT 'Custom',
      transactions TEXT DEFAULT '',
      total_steps INTEGER DEFAULT 0,
      schedule TEXT DEFAULT '[]',
      steps TEXT DEFAULT '[]',
      result TEXT DEFAULT '',
      lock_table TEXT DEFAULT '{}',
      wait_for_graph TEXT DEFAULT '{}',
      is_deadlocked INTEGER DEFAULT 0,
      deadlocked_txns TEXT DEFAULT '[]'
    )
  `);
  saveToDisk();

  console.log('   Database: ✅ SQLite initialized at', DB_PATH);
  return db;
}

/** Parse a row array into an object */
function parseRow(columns, values) {
  const obj = {};
  columns.forEach((col, i) => { obj[col] = values[i]; });
  return {
    id: obj.id,
    timestamp: obj.timestamp,
    protocol: obj.protocol,
    protocolKey: obj.protocol_key,
    exampleName: obj.example_name,
    transactions: obj.transactions,
    totalSteps: obj.total_steps,
    schedule: JSON.parse(obj.schedule || '[]'),
    steps: JSON.parse(obj.steps || '[]'),
    result: obj.result,
    lockTable: JSON.parse(obj.lock_table || '{}'),
    waitForGraph: JSON.parse(obj.wait_for_graph || '{}'),
    isDeadlocked: !!obj.is_deadlocked,
    deadlockedTxns: JSON.parse(obj.deadlocked_txns || '[]')
  };
}

/** Run a SELECT and return parsed rows */
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  const columns = stmt.getColumnNames();
  while (stmt.step()) {
    results.push(parseRow(columns, stmt.get()));
  }
  stmt.free();
  return results;
}

/** Save a simulation run */
function saveSimulation(data) {
  const id = data.id || crypto.randomUUID();
  db.run(
    `INSERT OR REPLACE INTO simulations 
     (id, timestamp, protocol, protocol_key, example_name, transactions,
      total_steps, schedule, steps, result, lock_table, wait_for_graph,
      is_deadlocked, deadlocked_txns)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.timestamp || new Date().toISOString(),
      data.protocol || '',
      data.protocolKey || data.protocol_key || '',
      data.exampleName || data.example_name || 'Custom',
      data.transactions || '',
      data.totalSteps || data.total_steps || 0,
      JSON.stringify(data.schedule || []),
      JSON.stringify(data.steps || []),
      data.result || '',
      JSON.stringify(data.lockTable || data.lock_table || {}),
      JSON.stringify(data.waitForGraph || data.wait_for_graph || {}),
      data.isDeadlocked || data.is_deadlocked ? 1 : 0,
      JSON.stringify(data.deadlockedTxns || data.deadlocked_txns || [])
    ]
  );

  // Keep only latest 50 entries
  db.run(`DELETE FROM simulations WHERE id NOT IN (
    SELECT id FROM simulations ORDER BY timestamp DESC LIMIT 50
  )`);

  saveToDisk();
  return id;
}

/** Get all simulations sorted by timestamp descending */
function getAllSimulations() {
  return query('SELECT * FROM simulations ORDER BY timestamp DESC');
}

/** Get simulation by ID */
function getSimulationById(id) {
  const results = query('SELECT * FROM simulations WHERE id = ?', [id]);
  return results.length > 0 ? results[0] : null;
}

/** Delete a simulation by ID */
function deleteSimulation(id) {
  db.run('DELETE FROM simulations WHERE id = ?', [id]);
  saveToDisk();
}

/** Clear all simulations */
function clearAllSimulations() {
  db.run('DELETE FROM simulations');
  saveToDisk();
}

/** Get total count */
function getCount() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM simulations');
  stmt.step();
  const count = stmt.get()[0];
  stmt.free();
  return count;
}

/** Get aggregated analytics */
function getAnalytics() {
  const total = getCount();

  const stmtDead = db.prepare('SELECT COUNT(*) FROM simulations WHERE is_deadlocked = 1');
  stmtDead.step();
  const deadlocks = stmtDead.get()[0];
  stmtDead.free();

  const successes = total - deadlocks;

  const stmtAvg = db.prepare('SELECT AVG(total_steps) FROM simulations');
  stmtAvg.step();
  const avgRaw = stmtAvg.get()[0];
  stmtAvg.free();
  const avgSteps = avgRaw ? parseFloat(avgRaw).toFixed(1) : '0';

  const protocolCounts = {};
  const stmtProto = db.prepare('SELECT protocol, COUNT(*) as cnt FROM simulations GROUP BY protocol');
  while (stmtProto.step()) {
    const row = stmtProto.get();
    protocolCounts[row[0]] = row[1];
  }
  stmtProto.free();

  const recent = query('SELECT * FROM simulations ORDER BY timestamp DESC LIMIT 10');

  return {
    total,
    deadlocks,
    successes,
    avgSteps,
    deadlockRate: total > 0 ? ((deadlocks / total) * 100).toFixed(0) : '0',
    protocolCounts,
    recent
  };
}

module.exports = {
  init,
  saveSimulation,
  getAllSimulations,
  getSimulationById,
  deleteSimulation,
  clearAllSimulations,
  getCount,
  getAnalytics
};
