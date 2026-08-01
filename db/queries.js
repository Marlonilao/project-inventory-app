const pool = require('./pool');

// ---------- categories ----------

async function getAllCategories() {
  // LEFT JOIN so a category with zero items still appears on the home page.
  // ::int because COUNT returns bigint, which node-postgres yields as a string.
  const sql = `
    SELECT c.id, c.name, c.description, COUNT(i.id)::int AS item_count
    FROM categories c
    LEFT JOIN items i ON i.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `;

  const result = await pool.query(sql);

  return result.rows;
}

async function getCategoryById(id) {
  const sql = `SELECT * FROM categories WHERE id = $1`;

  const result = await pool.query(sql, [id]);

  // rows[0] is undefined for a bad id — the controller turns that into a 404.
  return result.rows[0];
}

async function insertCategory(name, description) {
  // RETURNING id lets us redirect straight to the new record's page
  // without a second round trip to find out what id was assigned.
  const sql = `
    INSERT INTO categories (name, description)
    VALUES ($1, $2)
    RETURNING id
  `;

  const result = await pool.query(sql, [name, description]);

  return result.rows[0].id;
}

async function updateCategory(id, name, description) {
  const sql = `
    UPDATE categories
    SET name = $2, description = $3
    WHERE id = $1
  `;

  await pool.query(sql, [id, name, description]);
}

async function deleteCategory(id) {
  // No manual cleanup of items: the FK is ON DELETE SET NULL,
  // so Postgres orphans them safely instead of deleting stock.
  const sql = `DELETE FROM categories WHERE id = $1`;

  await pool.query(sql, [id]);
}

// ---------- items ----------

const ITEM_SELECT = `
  SELECT i.*, c.name AS category_name
  FROM items i
  LEFT JOIN categories c ON c.id = i.category_id
`;

async function getAllItems(search) {
  // One query handles both the full list and the search results.
  // COALESCE($1, '') means a null search term matches everything,
  // so there is no second near-identical query to keep in sync.
  const sql = `
    ${ITEM_SELECT}
    WHERE i.name ILIKE '%' || COALESCE($1, '') || '%'
    ORDER BY i.name
  `;

  const result = await pool.query(sql, [search || null]);

  return result.rows;
}

async function getItemsByCategory(categoryId) {
  const sql = `${ITEM_SELECT} WHERE i.category_id = $1 ORDER BY i.name`;

  const result = await pool.query(sql, [categoryId]);

  return result.rows;
}

async function getUncategorizedItems() {
  // IS NULL, not = NULL: comparing anything to NULL yields NULL, never true.
  const sql = `${ITEM_SELECT} WHERE i.category_id IS NULL ORDER BY i.name`;

  const result = await pool.query(sql);

  return result.rows;
}

async function getLowStockItems() {
  const sql = `
    ${ITEM_SELECT}
    WHERE i.quantity <= i.low_stock_at
    ORDER BY i.quantity ASC, i.name
  `;

  const result = await pool.query(sql);

  return result.rows;
}

async function getItemById(id) {
  const sql = `${ITEM_SELECT} WHERE i.id = $1`;

  const result = await pool.query(sql, [id]);

  return result.rows[0];
}

async function insertItem(item) {
  const sql = `
    INSERT INTO items (name, category_id, unit, price, cost, quantity, low_stock_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `;

  const values = [
    item.name,
    item.category_id || null, // empty select option arrives as "" — store NULL
    item.unit,
    item.price,
    item.cost || null,
    item.quantity,
    item.low_stock_at,
  ];

  const result = await pool.query(sql, values);

  return result.rows[0].id;
}

async function updateItem(id, item) {
  const sql = `
    UPDATE items
    SET name = $2, category_id = $3, unit = $4, price = $5,
        cost = $6, quantity = $7, low_stock_at = $8,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `;

  const values = [
    id,
    item.name,
    item.category_id || null,
    item.unit,
    item.price,
    item.cost || null,
    item.quantity,
    item.low_stock_at,
  ];

  await pool.query(sql, values);
}

async function adjustItemQuantity(id, delta) {
  // GREATEST(..., 0) clamps at zero so a careless "-5" on 3 units in stock
  // does not blow up the CHECK (quantity >= 0) constraint with a 500.
  const sql = `
    UPDATE items
    SET quantity = GREATEST(quantity + $2, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `;

  await pool.query(sql, [id, delta]);
}

async function deleteItem(id) {
  const sql = `DELETE FROM items WHERE id = $1`;

  await pool.query(sql, [id]);
}

module.exports = {
  getAllCategories,
  getCategoryById,
  insertCategory,
  updateCategory,
  deleteCategory,
  getAllItems,
  getItemsByCategory,
  getUncategorizedItems,
  getLowStockItems,
  getItemById,
  insertItem,
  updateItem,
  adjustItemQuantity,
  deleteItem,
};
