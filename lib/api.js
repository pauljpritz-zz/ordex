const express = require('express');
const app = express();

module.exports = function (db) {
  app.post('/offer', (req, res) => {

  });

  app.get('/offers', (req, res) => {
    const all = db.query(() => true);
    res.send(all);
  });

  return app;
};
