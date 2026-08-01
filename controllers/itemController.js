const { body, validationResult } = require('express-validator');
const db = require('../db/queries');

const UNITS = ['piece', 'sachet', 'pack', 'kilo', 'bottle'];

const validateItem = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Item name must be 2 to 120 characters.')
    .escape(),
  body('unit').isIn(UNITS).withMessage('Pick a valid unit.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be zero or more.'),
  body('cost')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Cost must be zero or more.'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a whole number, zero or more.'),
  body('low_stock_at')
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a whole number.'),
];

async function itemListGet(req, res) {
  const search = req.query.search || '';
  const items = await db.getAllItems(search);

  res.render('itemList', { title: 'All items', items, search });
}

async function lowStockGet(req, res) {
  const items = await db.getLowStockItems();

  res.render('itemList', { title: 'Needs restocking', items, search: '' });
}

async function itemDetailGet(req, res) {
  const item = await db.getItemById(req.params.id);

  if (!item) {
    return res.status(404).render('error', { message: 'Item not found.' });
  }

  res.render('itemDetail', { title: item.name, item });
}

async function itemCreateGet(req, res) {
  // The form needs the category list to build its <select>.
  const categories = await db.getAllCategories();

  res.render('itemForm', {
    title: 'New item',
    item: { unit: 'piece', quantity: 0, low_stock_at: 5 },
    categories,
    units: UNITS,
    errors: [],
  });
}

const itemCreatePost = [
  ...validateItem,
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const categories = await db.getAllCategories();

      return res.status(400).render('itemForm', {
        title: 'New item',
        item: req.body,
        categories,
        units: UNITS,
        errors: errors.array(),
      });
    }

    const newId = await db.insertItem(req.body);

    res.redirect(`/items/${newId}`);
  },
];

async function itemUpdateGet(req, res) {
  const item = await db.getItemById(req.params.id);

  if (!item) {
    return res.status(404).render('error', { message: 'Item not found.' });
  }

  const categories = await db.getAllCategories();

  res.render('itemForm', {
    title: `Edit ${item.name}`,
    item,
    categories,
    units: UNITS,
    errors: [],
  });
}

const itemUpdatePost = [
  ...validateItem,
  async (req, res) => {
    const errors = validationResult(req);
    const itemId = req.params.id;

    if (!errors.isEmpty()) {
      const categories = await db.getAllCategories();

      return res.status(400).render('itemForm', {
        title: 'Edit item',
        item: { ...req.body, id: itemId },
        categories,
        units: UNITS,
        errors: errors.array(),
      });
    }

    await db.updateItem(itemId, req.body);

    res.redirect(`/items/${itemId}`);
  },
];

async function itemStockPost(req, res) {
  const itemId = req.params.id;
  const delta = Number.parseInt(req.body.delta, 10);

  // Reject nonsense without a full validation chain — this is a two-button form.
  if (!Number.isInteger(delta) || delta === 0) {
    return res.redirect(`/items/${itemId}`);
  }

  await db.adjustItemQuantity(itemId, delta);

  // Redirect rather than render: a refresh must not re-apply the adjustment.
  res.redirect(`/items/${itemId}`);
}

async function itemDeleteGet(req, res) {
  const item = await db.getItemById(req.params.id);

  if (!item) {
    return res.status(404).render('error', { message: 'Item not found.' });
  }

  res.render('itemDelete', { title: `Delete ${item.name}`, item, errors: [] });
}

async function itemDeletePost(req, res) {
  await db.deleteItem(req.params.id);

  res.redirect('/items');
}

module.exports = {
  itemListGet,
  lowStockGet,
  itemDetailGet,
  itemCreateGet,
  itemCreatePost,
  itemUpdateGet,
  itemUpdatePost,
  itemStockPost,
  itemDeleteGet,
  itemDeletePost,
};
