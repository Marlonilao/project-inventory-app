const express = require('express');
const path = require('node:path');
const app = express();
const categoryRouter = require('./router/categoryRouter');
const categories = require('./controllers/categoryController');
const itemRouter = require('./router/itemRouter');
const items = require('./controllers/itemController');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.locals.peso = (value) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return `₱${Number(value).toFixed(2)}`;
};

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', categories.homeGet);
app.use('/categories', categoryRouter);
app.use('/items', itemRouter);

app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { message: 'Something went wrong.' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }

  console.log(`Server running on port ${PORT}`);
});
