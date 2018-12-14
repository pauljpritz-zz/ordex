#!/usr/bin/env node

const createAllDBs = require('../lib/db').createAllDBs;
const createAPI = require('../lib/api');
const config = require('../lib/config');
const Web3 = require('web3');
// const OrderProcessor = require('../lib/order-processor');


createAllDBs(config.dbSuffix).then((db) => {
  const w3 = new Web3(new Web3.providers.HttpProvider(config.w3Endpoint));
  const api = createAPI(db, w3);
  // new OrderProcessor(w3, db).removeAllOffers().then(() => {
  //   console.log('removed all');
  // })
  api.listen(config.port, () => {
    console.log(`App listening on port ${config.port}`);
  });
});
