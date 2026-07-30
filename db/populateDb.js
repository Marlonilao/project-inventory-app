const { Client } = require('pg');

const SQL = `
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(60) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE items (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(120) NOT NULL,
    -- SET NULL, not CASCADE: deleting a category must not delete stock records.
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'piece',
    -- NUMERIC, not REAL: peso amounts must be exact, not floating point.
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    cost NUMERIC(10, 2) CHECK (cost >= 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    -- Threshold for the restock view: WHERE quantity <= low_stock_at
    low_stock_at INTEGER NOT NULL DEFAULT 5,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Every category page runs "items WHERE category_id = $1", so index it.
CREATE INDEX items_category_id_idx ON items (category_id);

INSERT INTO categories (name, description) VALUES
('Beverages', 'Softdrinks, coffee, juice, water'),
('Snacks', 'Chips, biscuits, candies'),
('Canned goods', 'Sardinas, tuna, corned beef, milk'),
('Condiments and staples', 'Bigas, asukal, toyo, suka, mantika'),
('Household', 'Laundry, candles, batteries'),
('Personal care', 'Soap, shampoo, toothpaste');

INSERT INTO items (name, category_id, unit, price, cost, quantity, low_stock_at) VALUES
('Coke Mismo 300ml', (SELECT id FROM categories WHERE name = 'Beverages'), 'bottle', 25.00, 20.50, 24, 6),
('Kopiko Black 3-in-1', (SELECT id FROM categories WHERE name = 'Beverages'), 'sachet', 10.00, 8.00, 120, 24),
('Nescafe Original 3-in-1', (SELECT id FROM categories WHERE name = 'Beverages'), 'sachet', 9.00, 7.25, 100, 24),
('Milo 22g', (SELECT id FROM categories WHERE name = 'Beverages'), 'sachet', 12.00, 9.75, 80, 24),
('Absolute mineral water 500ml', (SELECT id FROM categories WHERE name = 'Beverages'), 'bottle', 15.00, 11.50, 30, 12),

('Skyflakes crackers single', (SELECT id FROM categories WHERE name = 'Snacks'), 'piece', 9.00, 7.00, 60, 12),
('Piattos cheese 40g', (SELECT id FROM categories WHERE name = 'Snacks'), 'pack', 30.00, 25.50, 20, 6),
('Rebisco sandwich 32g', (SELECT id FROM categories WHERE name = 'Snacks'), 'piece', 8.00, 6.50, 70, 20),
('Chippy BBQ 27g', (SELECT id FROM categories WHERE name = 'Snacks'), 'pack', 15.00, 12.50, 25, 6),

('555 sardines tomato 155g', (SELECT id FROM categories WHERE name = 'Canned goods'), 'piece', 28.00, 23.00, 36, 6),
('Century tuna flakes in oil 155g', (SELECT id FROM categories WHERE name = 'Canned goods'), 'piece', 42.00, 36.00, 18, 6),
('Argentina corned beef 150g', (SELECT id FROM categories WHERE name = 'Canned goods'), 'piece', 45.00, 39.00, 15, 6),
('Alaska Evaporada 370ml', (SELECT id FROM categories WHERE name = 'Canned goods'), 'piece', 38.00, 32.50, 12, 4),

('Well-milled rice', (SELECT id FROM categories WHERE name = 'Condiments and staples'), 'kilo', 52.00, 46.00, 50, 10),
('Refined sugar', (SELECT id FROM categories WHERE name = 'Condiments and staples'), 'kilo', 88.00, 80.00, 20, 5),
('Datu Puti soy sauce 200ml', (SELECT id FROM categories WHERE name = 'Condiments and staples'), 'bottle', 22.00, 18.00, 24, 6),
('Silver Swan vinegar 385ml', (SELECT id FROM categories WHERE name = 'Condiments and staples'), 'bottle', 28.00, 23.50, 18, 6),
('Golden Fiesta palm oil 45ml', (SELECT id FROM categories WHERE name = 'Condiments and staples'), 'sachet', 12.00, 9.50, 60, 12),

('Tide bar 55g', (SELECT id FROM categories WHERE name = 'Household'), 'piece', 14.00, 11.00, 40, 10),
('Surf powder 33g', (SELECT id FROM categories WHERE name = 'Household'), 'sachet', 9.00, 7.00, 90, 24),
('Candle 6-inch', (SELECT id FROM categories WHERE name = 'Household'), 'piece', 15.00, 11.00, 24, 6),
('Eveready AA battery', (SELECT id FROM categories WHERE name = 'Household'), 'pack', 32.00, 26.00, 10, 4),

('Safeguard classic white 55g', (SELECT id FROM categories WHERE name = 'Personal care'), 'piece', 32.00, 27.00, 20, 6),
('Palmolive shampoo 12ml', (SELECT id FROM categories WHERE name = 'Personal care'), 'sachet', 9.00, 7.00, 100, 24),
('Colgate toothpaste 25g', (SELECT id FROM categories WHERE name = 'Personal care'), 'piece', 35.00, 29.50, 12, 4);
`;

const main = async () => {
  const connectionString = process.argv[2];

  // Bail early. Without this, pg silently falls back to env vars or a
  // localhost default and you seed the wrong database.
  if (!connectionString) {
    console.error('Usage: node populatedb.js <connection-string>');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  console.log('Populating database...');

  await client.connect();
  await client.query(SQL);
  await client.end();

  console.log('Database populated successfully.');
};

main().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});
