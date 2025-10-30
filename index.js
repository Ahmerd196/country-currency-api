// import express from 'express';
// import dotenv from 'dotenv';
// import morgan from 'morgan';
// import helmet from 'helmet';
// import cors from 'cors';
// import countriesRouter from './routes/countries.js';

// dotenv.config();
// const app = express();
// app.set('etag', false);

// app.use(helmet());
// app.use(cors());
// app.use(morgan('dev'));
// app.use(express.json());

// app.use('/countries', countriesRouter);

// // Root status redirect
// app.get('/status', (req, res) => {
//   res.redirect('/countries/status/info');
// });

// // Global 404
// app.use((req, res) => {
//   res.status(404).json({ error: 'Not found' });
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { pool } from './db.js';  // <-- make sure db.js exports your MySQL pool
import countriesRouter from './routes/countries.js';

dotenv.config();
const app = express();
app.set('etag', false);

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// 🧩 Ensure countries table exists (for Railway)
(async () => {
  try {
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
    console.error('❌ Error ensuring countries table:', err);
  }
})();

app.use('/countries', countriesRouter);

// Root status redirect
app.get('/status', (req, res) => {
  res.redirect('/countries/status/info');
});

// Global 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
