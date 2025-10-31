import express from 'express';
import { refreshCountriesData } from '../services/refreshService.js';
import { getAllCountries, getCountryByName, getStatus } from '../models/countryModel.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const SUMMARY_IMAGE = process.env.SUMMARY_IMAGE_PATH || 'cache/summary.png';

// POST /countries/refresh
router.post('/refresh', async (req, res) => {
  try {
    const result = await refreshCountriesData();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// GET /countries
router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.region) filters.region = req.query.region;
    if (req.query.currency) filters.currency = req.query.currency;
    const rows = await getAllCountries(filters);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /countries
 * Optional filters:
 *   - region (e.g., /countries?region=Africa)
 *   - currency (e.g., /countries?currency=USD)
 *   - both (e.g., /countries?region=Asia&currency=CNY)
 */
router.get('/', async (req, res) => {
  try {
    const { region, currency } = req.query;

    let query = 'SELECT * FROM countries WHERE 1=1';
    const params = [];

    if (region) {
      query += ' AND region = ?';
      params.push(region);
    }

    if (currency) {
      query += ' AND currency_code = ?';
      params.push(currency);
    }

    query += ' ORDER BY name ASC';

    const [rows] = await pool.query(query, params);

    if (!rows.length) {
      return res.status(404).json({ message: 'No countries found for given filters' });
    }

    res.json(rows);
  } catch (err) {
    console.error('Error fetching countries:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
})

// GET /countries/image
router.get('/image', async (req, res) => {
  try {
    if (!fs.existsSync(SUMMARY_IMAGE)) return res.status(404).json({ error: 'Summary image not found' });
    res.sendFile(path.resolve(SUMMARY_IMAGE));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /countries/:name
router.get('/:name', async (req, res) => {
  try {
    const country = await getCountryByName(req.params.name);
    if (!country) return res.status(404).json({ error: 'Country not found' });
    res.json(country);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', errorMessage: err.message });
  }
});

// GET /status/info
router.get('/status/info', async (req, res) => {
  try {
    const status = await getStatus();
    res.json(status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



export default router;
