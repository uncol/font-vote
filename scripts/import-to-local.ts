import Database from 'better-sqlite3';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Collection1Row {
  semantic: string;
  icon: string;
}

interface JournalRow {
  id: string;
  semantic: string;
  icon: string;
  user: string;
  created: string;
  applied: number;
}

function importData() {
  const dbPath = process.env.DB_PATH || './data/app.db';
  const exportDir = path.join(__dirname, '../export');
  
  console.log(`Importing data into ${dbPath}`);
  
  if (!existsSync(dbPath)) {
    console.error('❌ Database not found. Run "pnpm run migrate" first.');
    process.exit(1);
  }

  const db = new Database(dbPath);

  try {
    // Import collection1
    const collection1Path = path.join(exportDir, 'collection1.json');
    if (existsSync(collection1Path)) {
      console.log('Importing collection1...');
      const collection1Data = JSON.parse(readFileSync(collection1Path, 'utf-8'));
      
      // Cloudflare returns data wrapped in array with results field
      let rows: Collection1Row[] = [];
      if (Array.isArray(collection1Data) && collection1Data[0]?.results) {
        rows = collection1Data[0].results;
      } else if (Array.isArray(collection1Data)) {
        rows = collection1Data;
      } else if (collection1Data.results) {
        rows = collection1Data.results;
      } else {
        rows = [collection1Data];
      }
      
      // Filter out rows with empty/null icon
      const validRows = rows.filter(row => row.semantic && row.icon);
      console.log(`Found ${rows.length} rows, ${validRows.length} valid`);
      
      const insertStmt = db.prepare(
        'INSERT OR REPLACE INTO collection1 (semantic, icon) VALUES (?, ?)'
      );
      
      const transaction = db.transaction((data: Collection1Row[]) => {
        for (const row of data) {
          insertStmt.run(row.semantic, row.icon);
        }
      });
      
      transaction(validRows);
      console.log(`✓ Imported ${validRows.length} rows into collection1`);
    } else {
      console.log('⚠ collection1.json not found, skipping');
    }

    // Import journal
    const journalPath = path.join(exportDir, 'journal.json');
    if (existsSync(journalPath)) {
      console.log('Importing journal...');
      const journalData = JSON.parse(readFileSync(journalPath, 'utf-8'));
      
      // Handle Cloudflare data format
      let rows: JournalRow[] = [];
      if (Array.isArray(journalData) && journalData[0]?.results) {
        rows = journalData[0].results;
      } else if (Array.isArray(journalData)) {
        rows = journalData;
      } else if (journalData.results) {
        rows = journalData.results;
      } else {
        rows = [journalData];
      }
      
      // Filter out rows with missing required fields
      const validRows = rows.filter(row => 
        row.id && row.semantic && row.icon && row.user && row.created
      );
      console.log(`Found ${rows.length} rows, ${validRows.length} valid`);
      
      const insertStmt = db.prepare(
        'INSERT OR REPLACE INTO journal (id, semantic, icon, user, created, applied) VALUES (?, ?, ?, ?, ?, ?)'
      );
      
      const transaction = db.transaction((data: JournalRow[]) => {
        for (const row of data) {
          insertStmt.run(
            row.id,
            row.semantic,
            row.icon,
            row.user,
            row.created,
            row.applied ?? 0
          );
        }
      });
      
      transaction(validRows);
      console.log(`✓ Imported ${validRows.length} rows into journal`);
    } else {
      console.log('⚠ journal.json not found, skipping');
    }

    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

importData();
