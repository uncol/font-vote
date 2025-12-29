import Database from 'better-sqlite3';

let db: Database.Database | null = null;

export function initDb(dbPath: string = './data/app.db') {
  if (db) return db;
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
