// utils/imageGenerator.js
import Jimp from 'jimp';
import { pool } from '../db.js';
import dotenv from 'dotenv';
dotenv.config();

const IMAGE_PATH = process.env.SUMMARY_IMAGE_PATH || 'cache/summary.png';

export async function generateSummaryImage() {
  // fetch top 5 by estimated_gdp and total count
  const [[{total}]] = await pool.query(`SELECT COUNT(*) AS total FROM countries`);
  // const [rows] = await pool.query(`SELECT name, estimated_gdp FROM countries WHERE estimated_gdp IS NOT NULL ORDER BY estimated_gdp DESC LIMIT 5`);
  const [rows] = await pool.query(`
  SELECT name, estimated_gdp
  FROM countries
  WHERE estimated_gdp IS NOT NULL AND name IS NOT NULL
  ORDER BY estimated_gdp DESC
  LIMIT 5
`);


  const width = 1000;
  const height = 600;
  const image = new Jimp(width, height, 0xffffffff); // white background

  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  const small = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

  image.print(font, 20, 20, `Total countries: ${total}`);
  image.print(small, 20, 80, `Last refreshed at: ${new Date().toISOString()}`);

  image.print(font, 20, 130, 'Top 5 by estimated GDP:');

  let y = 190;
  rows.forEach((r, idx) => {
    const name = r.name || 'Unknown';
    const gdpText = r.estimated_gdp ? Number(r.estimated_gdp).toFixed(2) : 'N/A';
    image.print(small, 40, y, `${idx + 1}. ${name} — ${gdpText}`);
    y += 40;
  });


  await image.resize(width, height);

  // ensure cache folder exists
  const fs = await import('fs');
  const path = IMAGE_PATH.split('/').slice(0, -1).join('/') || '.';
  if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });

  await image.writeAsync(IMAGE_PATH);
}
