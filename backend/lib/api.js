const express = require('express');
const app = express();

const tokens = require('./tokens.json');
const OrderProcessor = require('./order-processor')
const Offer = require('./offer');

app.use(express.json());
require('express-ws')(app);


module.exports = function (db, w3) {
  const orderProcessor = new OrderProcessor(w3, db);
  app.ws('/', orderProcessor.handleConnection.bind(orderProcessor));

  app.post('/offer', (req, res) => {
    w3.eth.getBlockNumber()
    .then((number) => Offer.fromJSON(req.body, number))
    .then((offer) => orderProcessor.publishOffer(offer))
    .then((offer) => {
      res.json(offer);
      return offer;
    })
    .catch((err) => {
      res.status(400);
      res.json({error: err});
    })
    .then((offer) => orderProcessor.searchForAvailableTransactions(offer));
  });

  app.post('/signature', (req, res) => {
    try {
      const promise = orderProcessor.receiveSignature(req.body);
      res.json({state: 'pending'});
      return promise;
    } catch (err) {
      res.status(400);
      res.json({error: err});
    }
  });

  app.get('/tokens', (req, res) => {
    res.json(tokens);
  });

  app.get('/offers', (req, res) => {
    const all = db.offers.query(() => true);
    res.json(all);
  });

  return app;
};
