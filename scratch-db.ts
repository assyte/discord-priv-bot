import { dbPool } from './src/database/connection.js';

async function test() {
  const conn = await dbPool.getConnection();
  try {
    const rows = await conn.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 5');
    console.log(rows);
  } finally {
    conn.release();
    process.exit(0);
  }
}
test();
