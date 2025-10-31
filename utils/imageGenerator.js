// utils/imageGenerator.js
import * as Jimp from 'jimp';
import { pool } from '../db.js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const IMAGE_PATH = process.env.SUMMARY_IMAGE_PATH || 'cache/summary.png';

export async function generateSummaryImage() {
  // Fetch total and top 5 countries by estimated GDP
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM countries`);
  const [rows] = await pool.query(`
    SELECT name, estimated_gdp
    FROM countries
    WHERE estimated_gdp IS NOT NULL AND name IS NOT NULL
    ORDER BY estimated_gdp DESC
    LIMIT 5
  `);

  const width = 1000;
  const height = 600;

  // ✅ Create image using the new Jimp API
  const image = await Jimp.Jimp.create(width, height, '#FFFFFFFF'); // white background

  // ✅ Load fonts correctly
  const font = await Jimp.Jimp.loadFont(Jimp.Jimp.FONT_SANS_32_BLACK);
  const small = await Jimp.Jimp.loadFont(Jimp.Jimp.FONT_SANS_16_BLACK);

  // ✅ Print text
  image.print(font, 20, 20, `Total countries: ${total}`);
  image.print(small, 20, 80, `Last refreshed at: ${new Date().toISOString()}`);
  image.print(font, 20, 140, 'Top 5 by estimated GDP:');

  let y = 190;
  rows.forEach((r, idx) => {
    const name = r.name || 'Unknown';
    const gdpText = r.estimated_gdp ? Number(r.estimated_gdp).toFixed(2) : 'N/A';
    image.print(small, 40, y, `${idx + 1}. ${name} — ${gdpText}`);
    y += 40;
  });

  // ✅ Resize (optional)
  await image.resize(width, height);

  // ✅ Ensure cache directory exists
  const dir = IMAGE_PATH.split('/').slice(0, -1).join('/') || '.';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // ✅ Save image
  await image.writeAsync(IMAGE_PATH);

  console.log(`✅ Summary image generated at ${IMAGE_PATH}`);
}
