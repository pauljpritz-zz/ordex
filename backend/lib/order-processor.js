const _ = require('lodash');
const Web3 = require('web3');
const uuid = require('uuid/v4');
const Validator = require('jsonschema').Validator;
const schemas = require('./schemas');
const OrderEngine = require('./order-engine');

const validator = new Validator();


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}


class OrderProcessor {
  constructor(w3, db) {
    this.clients = {};
    this.db = db;
    this.w3 = w3;
    this.messageQueue = {};
  }

  handleConnection(ws, req) {
    ws.on('message', (msg) => {
      const parsedMessage = JSON.parse(msg);
      switch (parsedMessage.action) {
      case 'register':
        this.register(ws, msg.args);
        break;
      default:
        console.error(`message not understood: ${msg}`);
      }
    });
  }

  removeAllOffers() {
    const offers = this.db.offers.query(() => true);
    const promises = _.map(offers, (v) => this.db.offers.del(v._id));
    return Promise.all(promises).then(() => {
      console.log("removed everyting");
    });
  }

  register(ws, args) {
    if (!args.address) {
      console.error('missing address');
      return;
    }
    this.clients[args.address] = ws;
  }

  publishOffer(offer) {
    const id = uuid();
    return this.db.offers.put(_.assign({_id: id}, offer)).then((hash) => {
      return _.assign({hash: hash, _id: id}, offer);
    })
  }

  searchForAvailableTransactions(lastOffer) {
    const offers = this.db.offers.query(() => true);
    const engine = new OrderEngine(lastOffer.sourceToken, lastOffer.targetToken, offers);
    const transactions = engine.matchTransaction();
    for (const transaction of transactions) {
      this.multicastTransaction(transaction);
    }
  }

  formatTransaction(transaction, i) {
    return {
      addresses: transaction.addresses[i],
      expiry: transaction.expiries[i],
      tokens: [transaction.tokens[i], transaction.tokens[1 - i]],
      nonce: transaction.nonces[i],
      amounts: [transaction.amounts[i], transaction.amounts[1 - i]],
    };
  }

  receiveSignature(input) {
    const result = validator.validate(input, schemas.signature);
    if (result.errors && result.errors.length > 0) {
      throw new Error(`invalid JSON: ${JSON.stringify(result.errors)}`);
    }
    const transaction = this.db.transactions.get(input.transactionID);
    if (!transaction) {
      throw new Error(`transaction ${input.transactionID} does not exist`);
    }

    if (transaction.addresses[0] === input.address) {
      transaction.signatures[0] = input.signature;
    } else if (transaction.addresses[1] === input.address) {
      transaction.signatures[1] = input.signature;
    } else {
      throw new Error(`address ${input.address} not in transaction`);
    }

    const notifyClient = (i) => {
      const message = {
        action: 'transactionDone',
        args: this.formatTransaction(i)
      }
      this.sendMessage(message, transaction.addresses[i]);
    };

    if (transaction.signatures[0] && transaction.signatures[1]) {
        return this.executeTransaction(transaction).then(() => {
            return this.updateDbOrderBook(transaction);
        })
      .then(() => {
        return this.db.transactions.del(input.transactionID);
      })
      .then(() => {
        notifyClient(0);
        notifyClient(1);
      });
    }
    return this.db.transactions.put(transaction);
  }

    updateDbOrderBook(transaction) {
        sell_offer = self.db.offers.get(transaction.target_id)
        buy_offer = self.db.offers.get(transaction.source_id)
        sell_offer.sourceAmount -= transaction.targetAmount
        buy_offer.targetAmount -= transaction.sourceAmount
        var promises = []
        if (buy_offer.sourceAmount != 0) {
            promises.push(self.db.offers.put(buy_offer))
        }
        else if (buy_offer.sourceAmount == 0) {
            promises.push(self.db.offers.del(buy_offer))
        }
        if (sell_offer.targetAmount != 0) {
            promises.push(self.db.offers.put(sell_offer))
        }
        else if (sell_offer == 0) {
            promises.push(self.db.offers.del(sell_offer))
        }
        return Promise.all(promises);

    }

  executeTransaction(transaction) {
    // TODO: call Sam code's
  }

  sendMessage(message, address) {
    const client = this.clients[address];
    if (client) {
      return client.send(message);
    }
    if (!this.messageQueue[address]) {
      this.messageQueue[address] = [];
    }
    this.messageQueue[address].push(message);
  }


  multicastTransaction(transaction) {
    /*
    keccak(
      encodedPack(
        OrDex,
        nonce,
        expiry,
        tokens[0],
        tokens[1],
        amount[0],
        amount[2],
      )
    )
    */

    const generateNonce = () => getRandomInt(1000 * 1000 * 1000);

    const toPersist = {
      _id: uuid(),
      addresses: [transaction.buyer, transaction.seller],
      amounts: [transaction.sourceAmount, transaction.targetAmount],
      tokens: [transaction.source, transaction.target],
      expiries: [transaction.sourceExpiry, transaction.targetExpiry],
      nonces: [generateNonce(), generateNonce()],
      signatures: [null, null]
    };

    const makeStringToSign = (transactionObject) => {
      return Web3.utils.soliditySha3(
        {type: 'string', value: 'OrDex'},
        {type: 'uint256', value: transactionObject.nonce},
        {type: 'uint256', value: transactionObject.expiry},
        {type: 'string', value: transactionObject.tokens[0]},
        {type: 'string', value: transactionObject.tokens[1]},
        {type: 'uint256', value: transactionObject.amounts[0]},
        {type: 'uint256', value: transactionObject.amounts[1]},
      );
    };

    const makeMessage = (i) => {
      const transactionObject = this.formatTransaction(toPersist, i);
      const stringToSign = makeStringToSign(transactionObject);
      return {
        id: toPersist.id,
        transaction: transaction,
        stringToSign: stringToSign
      };
    };

    const sendMessage = (i) => {
      const message = {
        action: 'requireSignature',
        args: makeMessage(i)
      }
      this.sendMessage(message, toPersist.addresses[i]);
    };

    sendMessage(0);
    sendMessage(1);
    return this.db.transactions.put(toPersist);
  }
}

module.exports = OrderProcessor;
