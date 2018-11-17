#!/usr/bin/env node

const createDB = require('../lib/db');
const createAPI = require('../lib/api');

const port = 3000;

createDB((db) => {
  const api = createAPI(db);
  api.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });
});
