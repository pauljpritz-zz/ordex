const _ = require('lodash');
const Web3 = require('web3');
const uuid = require('uuid/v4');
const Validator = require('jsonschema').Validator;
const schemas = require('./schemas');
const OrderEngine = require('./order-engine');

const validator = new Validator();
const ordex = require('./OrDex.json');


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

const ORDEX_CONTRACT_ADDRESS = '0xE8076F73F08A2b85589260Af1747702eE6274d53';


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
        this.register(ws, parsedMessage.args);
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
    console.log(`registered address ${args.address}`);
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
    let transaction = this.db.transactions.get(input.transactionID);
    if (!transaction) {
      throw new Error(`transaction ${input.transactionID} does not exist`);
    }
    transaction = transaction[0];

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
        args: this.formatTransaction(transaction, i)
      }
      this.sendMessage(message, transaction.addresses[i]);
    };

    if (transaction.signatures[0] && transaction.signatures[1]) {
        return this.executeTransaction(transaction).then(() => {
          console.log('transaction executed on THE BLOCKCHAIN');
            return this.updateDbOrderBook(transaction);
        })
      .then(() => {
        return this.db.transactions.del(input.transactionID);
      })
      .then(() => {
        notifyClient(0);
        notifyClient(1);
      })
      .catch((err) => {
        console.log(err);
      });
    }
    return this.db.transactions.put(transaction);
  }

    updateDbOrderBook(transaction) {
      console.log(transaction);
      const sellOffer = this.db.offers.get(transaction.offers[0])[0]
      const buyOffer = this.db.offers.get(transaction.offers[1])[0]
      sellOffer.sourceAmount -= transaction.targetAmount
      buyOffer.targetAmount -= transaction.sourceAmount
      const promises = [];
      if (buyOffer.sourceAmount === 0) {
        promises.push(this.db.offers.del(buyOffer))
      } else {
        promises.push(this.db.offers.put(buyOffer))
      }
      if (sellOffer.targetAmount === 0) {
        promises.push(this.db.offers.del(sellOffer))
      } else {
        promises.push(this.db.offers.put(sellOffer))
      }
      return Promise.all(promises);
    }

  executeTransaction(transaction) {
    const abi = ordex["abi"];
    const contract = new this.w3.eth.Contract(abi, ORDEX_CONTRACT_ADDRESS);
    console.log('executing contract');
    const ret = contract.methods.swap(
      transaction.addresses,
      transaction.tokens,
      transaction.amounts,
      transaction.nonces,
      transaction.expiries
    );
    console.log(ret);
    return Promise.resolve(transaction);
  }

  sendMessage(message, address) {
    const client = this.clients[address];
    if (client) {
      return client.send(JSON.stringify(message));
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
      offers: [transaction.source_id, transaction.target_id],
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
        id: toPersist._id,
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
