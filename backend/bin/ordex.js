#!/usr/bin/env node

const createDB = require('../lib/db');
const createAPI = require('../lib/api');
const config = require('../lib/config');
const Web3 = require('web3');
// const OrderProcessor = require('../lib/order-processor');


Promise.all([
  createDB('offers1'),
  createDB('transactions1'),
]).then((dbArray) => {
  const db = {offers: dbArray[0], transactions: dbArray[1]};
  const w3 = new Web3(new Web3.providers.HttpProvider(config.w3Endpoint));
  const api = createAPI(db, w3);
  // new OrderProcessor(w3, db).removeAllOffers().then(() => {
  //   console.log('removed all');
  // })
  api.listen(config.port, () => {
    console.log(`App listening on port ${config.port}`);
  });
});
