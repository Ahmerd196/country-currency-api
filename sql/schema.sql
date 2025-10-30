CREATE TABLE IF NOT EXISTS countries (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    capital VARCHAR(255),
    region VARCHAR(100),
    population BIGINT UNSIGNED DEFAULT 0,
    currency_code VARCHAR(10),
    exchange_rate DECIMAL(18,6),
    estimated_gdp BIGINT UNSIGNED DEFAULT 0,
    flag_url VARCHAR(500),
    last_refreshed_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
