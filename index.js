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

// Routes
app.use('/countries', countriesRouter);

// Root status redirect
app.get('/status', (req, res) => {
  res.redirect('/countries/status/info');
});

// Default root route (so Railway knows app is alive)
app.get('/', (req, res) => {
  res.json({ message: '🌍 Country Currency API is running successfully!' });
});

// Global 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 8080;

// ✅ Wait before connecting to MySQL so Railway DB can boot up
app.listen(PORT, async () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  // 🛡️ Prevent Railway from stopping the app
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM. Graceful shutdown started...');
});

setInterval(() => {}, 1000); // Keeps event loop alive
  try {
    await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds
    await pool.query(`
      CREATE TABLE IF NOT EXISTS countries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        code VARCHAR(10),
        capital VARCHAR(255),
        population BIGINT,
        estimated_gdp DECIMAL(20,2),
        currency VARCHAR(50),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "countries" ready');
  } catch (err) {
    console.error('❌ Error ensuring countries table:', err.message);
  }
});
