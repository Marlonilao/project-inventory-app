const { Router } = require('express');
const items = require('../controllers/itemController');
const requireAdminPassword = require('../utils/requireAdminPassword');

const itemRouter = Router();

itemRouter.get('/', items.itemListGet);

// Both of these must precede "/:id" or the id param eats the word.
itemRouter.get('/low-stock', items.lowStockGet);
itemRouter.get('/new', items.itemCreateGet);
itemRouter.post('/new', items.itemCreatePost);

itemRouter.get('/:id/edit', items.itemUpdateGet);
itemRouter.post('/:id/edit', items.itemUpdatePost);

itemRouter.post('/:id/stock', items.itemStockPost);

itemRouter.get('/:id/delete', items.itemDeleteGet);
itemRouter.post('/:id/delete', requireAdminPassword, items.itemDeletePost);

itemRouter.get('/:id', items.itemDetailGet);

module.exports = itemRouter;
