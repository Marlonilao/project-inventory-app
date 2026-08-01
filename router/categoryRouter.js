const { Router } = require('express');
const categories = require('../controllers/categoryController');
const requireAdminPassword = require('../utils/requireAdminPassword');

const categoryRouter = Router();

categoryRouter.get('/new', categories.categoryCreateGet);
categoryRouter.post('/new', categories.categoryCreatePost);

categoryRouter.get('/:id/edit', categories.categoryUpdateGet);
categoryRouter.post('/:id/edit', categories.categoryUpdatePost);

categoryRouter.get('/:id/delete', categories.categoryDeleteGet);
categoryRouter.post(
  '/:id/delete',
  requireAdminPassword,
  categories.categoryDeletePost,
);

categoryRouter.get('/:id', categories.categoryDetailGet);

module.exports = categoryRouter;
