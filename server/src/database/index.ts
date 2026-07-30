import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
});

export const initDb = async () => {
  try {
    const client = await pool.connect();
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await client.query(schemaSql);
      console.log('[Database] Schema initialized successfully.');
    }
    client.release();
  } catch (err) {
    console.warn('[Database] Database connection/initialization skipped or failed:', (err as Error).message);
  }
};
