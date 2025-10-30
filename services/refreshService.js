// services/refreshService.js
import axios from 'axios';
import { upsertCountriesBulk } from '../models/countryModel.js';
import Jimp from 'jimp';
import fs from 'fs';

const IMAGE_PATH = 'cache/summary.png';

function estimateGDP(population, exchangeRate) {
  const baseFactor = 5000;
  return (population || 0) * (exchangeRate || 1) * baseFactor;
}

export async function refreshCountriesData() {
  try {
    const { data: countriesData } = await axios.get('https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies');
    const { data: ratesData } = await axios.get('https://open.er-api.com/v6/latest/USD');
    const rates = ratesData.rates || {};

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const formattedCountries = countriesData.map(country => {
      const currencyCode = country.currencies ? Object.keys(country.currencies)[0] : null;
      const exchangeRate = currencyCode ? rates[currencyCode] : 1;
      return {
        name: country.name.common,
        capital: Array.isArray(country.capital) ? country.capital[0] : country.capital || null,
        region: country.region || null,
        population: country.population || 0,
        currency_code: currencyCode,
        exchange_rate: exchangeRate,
        estimated_gdp: estimateGDP(country.population, exchangeRate),
        flag_url: country.flags?.png || null,
        last_refreshed_at: now
      };
    });

    await upsertCountriesBulk(formattedCountries);

    // Generate summary image
    if (!fs.existsSync('cache')) fs.mkdirSync('cache');
    const image = new Jimp(1000, 600, 0xffffffff);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const small = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

    image.print(font, 20, 20, `Total countries: ${formattedCountries.length}`);
    image.print(small, 20, 60, `Last refreshed: ${now}`);

    const top5 = formattedCountries.sort((a,b) => b.estimated_gdp - a.estimated_gdp).slice(0,5);
    let y = 100;
    top5.forEach((c, idx) => {
      image.print(small, 40, y, `${idx+1}. ${c.name} — ${c.estimated_gdp.toFixed(2)}`);
      y += 40;
    });

    await image.writeAsync(IMAGE_PATH);

    return { message: 'Countries refreshed', total_countries: formattedCountries.length, last_refreshed_at: now };

  } catch (error) {
    console.error('Error refreshing countries:', error.message);
    throw error;
  }
}
