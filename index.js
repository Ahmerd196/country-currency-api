// index.js
import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { pool } from './db.js';
import countriesRouter from './routes/countries.js';

dotenv.config();
const app = express();
app.set('etag', false);

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/countries', countriesRouter);

// Health/status endpoint must NOT depend on DB
app.get('/status', (req, res) => {
  return res.status(200).json({ message: 'ok', timestamp: new Date().toISOString() });
});

// root quick check too
app.get('/', (req, res) => res.json({ message: 'alive' }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = Number(process.env.PORT) || 8080;

// Start listening immediately so Railway healthchecks get a response ASAP
app.listen(PORT, async () => {
  console.log(`🚀 Server listening on port ${PORT}`);

  // graceful error logging
  process.on('unhandledRejection', (r) => console.error('UNHANDLED REJECTION', r));
  process.on('uncaughtException', (e) => console.error('UNCAUGHT EXCEPTION', e));

  // Delay DB work so DB container can spin up (avoid blocking healthchecks)
  setTimeout(async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS countries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) UNIQUE,
          capital VARCHAR(255),
          region VARCHAR(100),
          population BIGINT,
          flag TEXT,
          currency_code VARCHAR(10),
          currency_name VARCHAR(100),
          currency_symbol VARCHAR(10),
          estimated_gdp DOUBLE,
          last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Table "countries" ready');
    } catch (err) {
      console.error('❌ Error ensuring countries table:', err && (err.stack || err.message));
    }
  }, 5000); // wait 5s (adjust to 10s if needed)
});

// keep Node loop alive (defensive)
setInterval(() => {}, 1000);
