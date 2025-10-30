# Country Currency & Exchange API

## Requirements
- Node 18+
- MySQL 5.7+ (or compatible)

## Setup
1. Clone repository
2. Install dependencies

```bash
npm install
```

3. Create the database and tables. Either run `sql/schema.sql` in your MySQL server, or let the app create tables if you prefer to run manual SQL.

```bash
# using mysql client
mysql -u root -p < sql/schema.sql
```

4. Copy `.env.example` to `.env` and fill values (DB credentials, port).

5. Run the app

```bash
npm start
```

## Endpoints
- `POST /countries/refresh` → Fetch external data, upsert into DB, generate image
- `GET  /countries` → Get all countries (filters: `?region=`, `?currency=`, `?sort=gdp_desc|gdp_asc|population_desc|population_asc`)
- `GET  /countries/:name` → Get one country by name (case-insensitive)
- `DELETE /countries/:name` → Delete a country record
- `GET /status` → Redirects to `/countries/status/info` returning total and last refresh
- `GET /countries/image` → Serve generated summary image (cache/summary.png)

## Notes
- If external APIs are unavailable, `/countries/refresh` will return 503 and DB will not be modified.
- Image generation uses Jimp and will write to `cache/summary.png`.
