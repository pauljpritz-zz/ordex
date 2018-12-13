const express = require('express');
const cors = require('cors')
const app = express();


const tokens = require('./tokens.json');
const OrderProcessor = require('./order-processor')
const Offer = require('./offer');

app.use(express.json());
app.use(cors());
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
    .then((offer) => {
      if (offer) {
        orderProcessor.searchForAvailableTransactions(offer);
      }
    });
  });

  app.post('/signature', (req, res) => {
    try {
      const promise = orderProcessor.receiveSignature(req.body);
      res.json({state: 'pending'});
      return promise;
    } catch (err) {
      res.status(400);
      res.json({error: err.message});
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
