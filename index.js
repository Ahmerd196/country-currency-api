import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import countriesRouter from './routes/countries.js';

dotenv.config();
const app = express();
app.set('etag', false);

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

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
