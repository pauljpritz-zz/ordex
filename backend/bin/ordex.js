#!/usr/bin/env node

const createAllDBs = require('../lib/db').createAllDBs;
const createAPI = require('../lib/api');
const config = require('../lib/config');
const Web3 = require('web3');


createAllDBs(config.dbSuffix).then((db) => {
  const w3 = new Web3(new Web3.providers.HttpProvider(config.w3Endpoint));
  const api = createAPI(db, w3);
  api.listen(config.port, () => {
    console.log(`App listening on port ${config.port}`);
  });
});
