import { pool } from '../db.js';

export async function getAllCountries(filters = {}, sort = null) {
  let query = 'SELECT * FROM countries';
  const conditions = [];
  const params = [];

  if (filters.region) {
    conditions.push('region = ?');
    params.push(filters.region);
  }
  if (filters.currency) {
    conditions.push('currency_code = ?');
    params.push(filters.currency);
  }
  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  if (sort === 'population') query += ' ORDER BY population DESC';
  else if (sort === 'gdp') query += ' ORDER BY estimated_gdp DESC';

  const [rows] = await pool.query(query, params);
  return rows;
}

export async function getCountryByName(name) {
  const [rows] = await pool.query('SELECT * FROM countries WHERE name = ?', [name]);
  return rows[0];
}

export async function getStatus() {
  const [rows] = await pool.query('SELECT COUNT(*) AS total_countries, MAX(last_refreshed_at) AS last_refreshed_at FROM countries');
  return rows[0];
}

export async function upsertCountriesBulk(countriesData) {
  try {
    // Filter out countries without a valid name
    const validCountries = countriesData.filter(country => country.name);

    if (validCountries.length === 0) {
      console.log('No valid countries to insert.');
      return;
    }

    // Prepare values with defaults for nullable fields
    const values = validCountries.map(country => [
      country.name,
      country.capital || '',          // default empty string
      country.region || '',           // default empty string
      country.population || 0,        // default 0
      country.currency_code || '0',   // default '0'
      country.exchange_rate || null,  // keep null if not available
      country.estimated_gdp || null,  // keep null if not available
      country.flag_url || null,       // keep null if not available
      new Date()                      // current timestamp
    ]);

    // Build a bulk insert query with placeholders
    const placeholders = values.map(() => '(?,?,?,?,?,?,?,?,?)').join(',');
    const sql = `
      INSERT INTO countries
      (name, capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url, last_refreshed_at)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        capital = VALUES(capital),
        region = VALUES(region),
        population = VALUES(population),
        currency_code = VALUES(currency_code),
        exchange_rate = VALUES(exchange_rate),
        estimated_gdp = VALUES(estimated_gdp),
        flag_url = VALUES(flag_url),
        last_refreshed_at = VALUES(last_refreshed_at)
    `;

    // Flatten values array for MySQL2
    const flattenedValues = values.flat();

    await pool.query(sql, flattenedValues);

    console.log(`${validCountries.length} countries upserted successfully.`);
  } catch (error) {
    console.error('Error inserting countries:', error);
  }
}