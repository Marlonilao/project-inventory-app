const { body, validationResult } = require('express-validator');
const db = require('../db/queries');

// No .escape() here. EJS escapes on output with <%= %>, and escaping on the
// way in would store "&amp;" in the database and render it doubled.
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Category name must be 2 to 60 characters.'),
  body('description').trim(),
];

async function homeGet(req, res) {
  const categories = await db.getAllCategories();
  const uncategorized = await db.getUncategorizedItems();

  res.render('index', { title: 'Inventory', categories, uncategorized });
}

async function categoryDetailGet(req, res) {
  const category = await db.getCategoryById(req.params.id);

  // Guard before touching the items query — a bad id is a 404, not a crash.
  if (!category) {
    return res.status(404).render('error', { message: 'Category not found.' });
  }

  const items = await db.getItemsByCategory(category.id);

  res.render('categoryDetail', { title: category.name, category, items });
}

function categoryCreateGet(req, res) {
  // Pass an empty category so the form template can be shared with edit.
  res.render('categoryForm', {
    title: 'New category',
    category: {},
    errors: [],
  });
}

const categoryCreatePost = [
  ...validateCategory,
  async (req, res) => {
    const errors = validationResult(req);

    // Re-render with the submitted values so the user does not retype.
    if (!errors.isEmpty()) {
      return res.status(400).render('categoryForm', {
        title: 'New category',
        category: req.body,
        errors: errors.array(),
      });
    }

    const newId = await db.insertCategory(req.body.name, req.body.description);

    res.redirect(`/categories/${newId}`);
  },
];

async function categoryUpdateGet(req, res) {
  const category = await db.getCategoryById(req.params.id);

  if (!category) {
    return res.status(404).render('error', { message: 'Category not found.' });
  }

  res.render('categoryForm', {
    title: `Edit ${category.name}`,
    category,
    errors: [],
  });
}

const categoryUpdatePost = [
  ...validateCategory,
  async (req, res) => {
    const errors = validationResult(req);
    const categoryId = req.params.id;

    if (!errors.isEmpty()) {
      return res.status(400).render('categoryForm', {
        title: 'Edit category',
        category: { ...req.body, id: categoryId },
        errors: errors.array(),
      });
    }

    await db.updateCategory(categoryId, req.body.name, req.body.description);

    res.redirect(`/categories/${categoryId}`);
  },
];

async function categoryDeleteGet(req, res) {
  const category = await db.getCategoryById(req.params.id);

  if (!category) {
    return res.status(404).render('error', { message: 'Category not found.' });
  }

  const items = await db.getItemsByCategory(category.id);

  // Show the caller exactly what loses its label before they confirm.
  res.render('categoryDelete', {
    title: `Delete ${category.name}`,
    category,
    items,
    errors: [],
  });
}

async function categoryDeletePost(req, res) {
  await db.deleteCategory(req.params.id);

  res.redirect('/');
}

module.exports = {
  homeGet,
  categoryDetailGet,
  categoryCreateGet,
  categoryCreatePost,
  categoryUpdateGet,
  categoryUpdatePost,
  categoryDeleteGet,
  categoryDeletePost,
};
