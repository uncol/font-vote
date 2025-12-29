import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runMigrations() {
  const dbPath = process.env.DB_PATH || '/data/app.db';
  const dataDir = path.dirname(dbPath);
  
  // Ensure data directory exists
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  console.log(`Initializing database at ${dbPath}`);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  const migrationsDir = path.join(__dirname, '../migrations');
  const migrationFiles = [
    '0001_init.sql',
    'seed_collection1_from_input.sql',
  ];

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    if (!existsSync(filePath)) {
      console.log(`Skipping ${file} (not found)`);
      continue;
    }

    console.log(`Running migration: ${file}`);
    const sql = readFileSync(filePath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        db.exec(stmt);
      } catch (err: any) {
        // Ignore errors for CREATE IF NOT EXISTS and INSERT OR IGNORE
        if (!err.message.includes('already exists') && !err.message.includes('UNIQUE constraint')) {
          console.error(`Error in ${file}:`, err.message);
          throw err;
        }
      }
    }
  }

  db.close();
  console.log('Migrations completed successfully');
}

runMigrations();
