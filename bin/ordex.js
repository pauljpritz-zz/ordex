#!/usr/bin/env node

const createDB = require('../lib/db');
const createAPI = require('../lib/api');
const createW3 = require('../lib/eth-client');

const port = 3000;

Promise.all([
  createDB('offers'),
  createDB('transactions'),
]).then((dbArray) => {
  const dbs = {offers: dbArray[0], transactions: dbArray[1]};
  const w3 = createW3();
  const api = createAPI(dbs, w3);
  api.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });
});
