const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/todo', { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('Mongoose test: connected!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Mongoose test: error', err);
    process.exit(1);
  });
