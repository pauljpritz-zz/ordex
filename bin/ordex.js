#!/usr/bin/env node

const createDB = require('../lib/db');
const createAPI = require('../lib/api');
const createW3 = require('../lib/eth-client');

const port = 3000;

createDB((db) => {
  const w3 = createW3();
  const api = createAPI(db, w3);
  api.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });
});
