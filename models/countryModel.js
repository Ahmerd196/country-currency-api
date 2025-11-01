import { pool } from '../db.js';

// ✅ Ensure "countries" table exists
export async function ensureCountriesTable() {
  try {
    console.log('🧹 Dropping old "countries" table (if exists)...');
    // await pool.query('DROP TABLE IF EXISTS countries');

    const createTableSQL = `
      CREATE TABLE countries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE,
        capital VARCHAR(100),
        region VARCHAR(100),
        population BIGINT,
        flag TEXT,
        currency_code VARCHAR(10),
        currency_name VARCHAR(100),
        currency_symbol VARCHAR(10),
        estimated_gdp DOUBLE,
        last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createTableSQL);
    console.log('✅ Table "countries" dropped and recreated successfully');
  } catch (err) {
    console.error('❌ Error recreating countries table:', err.message);
  }
}

// ✅ Bulk insert or update countries
export async function upsertCountriesBulk(countries) {
  if (!countries || countries.length === 0) return;

  const insertSQL = `
    INSERT INTO countries
    (name, capital, region, population, flag, currency_code, currency_name, currency_symbol, estimated_gdp, last_refreshed_at)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      capital = VALUES(capital),
      region = VALUES(region),
      population = VALUES(population),
      flag = VALUES(flag),
      currency_code = VALUES(currency_code),
      currency_name = VALUES(currency_name),
      currency_symbol = VALUES(currency_symbol),
      estimated_gdp = VALUES(estimated_gdp),
      last_refreshed_at = VALUES(last_refreshed_at);
  `;

  const now = new Date();
  const values = countries.map(c => [
    c.name,
    c.capital,
    c.region,
    c.population,
    c.flag,
    c.currency_code,
    c.currency_name,
    c.currency_symbol,
    c.estimated_gdp,
    now
  ]);

  try {
    const [result] = await pool.query(insertSQL, [values]);
    console.log(`✅ Inserted or updated ${result.affectedRows} countries`);
  } catch (err) {
    console.error('❌ Error inserting countries:', err.message);
  }
}

// ✅ Get all countries with optional filters (region, currency)
export async function getAllCountries(filters = {}) {
  let sql = 'SELECT * FROM countries WHERE 1=1';
  const params = [];

  if (filters.region) {
    sql += ' AND LOWER(region) = LOWER(?)';
    params.push(filters.region);
  }

  if (filters.currency) {
    sql += ' AND LOWER(currency_code) = LOWER(?)';
    params.push(filters.currency);
  }

  sql += ' ORDER BY name ASC';
  const [rows] = await pool.query(sql, params);
  return rows;
}

// ✅ Get one country by name
export async function getCountryByName(name) {
  const [rows] = await pool.query('SELECT * FROM countries WHERE LOWER(name) = LOWER(?)', [name]);
  return rows[0] || null;
}

// ✅ Get status info
export async function getStatus() {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM countries');
  return { total_countries: rows[0].total };
}