// index.js
import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { ensureCountriesTable } from './models/countryModel.js'; // ✅ use your model to create table
import { pool } from './db.js';
import countriesRouter from './routes/countries.js';

dotenv.config();
const app = express();
app.set('etag', false);

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Mount router
app.use('/countries', countriesRouter);

// Health/status endpoint (used by Railway healthcheck)
app.get('/status', (req, res) => {
  return res.status(200).json({ message: 'ok', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => res.json({ message: 'alive' }));

// Global 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = Number(process.env.PORT) || 8080;

// 🚀 Start listening immediately for Railway healthchecks
app.listen(PORT, async () => {
  console.log(`🚀 Server listening on port ${PORT}`);

  // Global error handling
  process.on('unhandledRejection', (r) => console.error('UNHANDLED REJECTION', r));
  process.on('uncaughtException', (e) => console.error('UNCAUGHT EXCEPTION', e));

  // Wait a few seconds for Railway DB container to start, then ensure table
  setTimeout(async () => {
    try {
      await ensureCountriesTable();
    } catch (err) {
      console.error('❌ Error ensuring countries table:', err.message);
    }
  }, 5000);
});

// Keep Node loop alive
setInterval(() => {}, 1000);
