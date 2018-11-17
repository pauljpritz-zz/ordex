const express = require('express');
const app = express();
const Validator = require('jsonschema').Validator;

const tokens = require('./tokens.json');
const schemas = require('./schemas');
const OrderProcessor = require('./order-processor')

app.use(express.json());
require('express-ws')(app);


module.exports = function (db, w3) {
  const validator = new Validator();
  const orderProcessor = new OrderProcessor(w3, db);
  app.ws('/', orderProcessor.handleConnection);

  app.post('/offer', (req, res) => {
    const offer = req.body;
    const result = validator.validate(offer, schemas["offer"]);
    if (result.errors && result.errors.length > 0) {
      res.status(422);
      return res.json({error: result.errors});
    }

    orderProcessor.publishOffer(offer)
    .then((hash) => {
      res.json({hash: hash, _id: offer["_id"]});
    })
    .catch((err) => {
      res.status(500);
      res.json({error: err});
    });
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
