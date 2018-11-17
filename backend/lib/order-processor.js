const _ = require('lodash');
const Web3 = require('web3');
const uuid = require('uuid/v4');
const Validator = require('jsonschema').Validator;
const schemas = require('./schemas');

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
      return {hash: hash, _id: id};
    });
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

    if (transaction.signatures[0] && transaction.signatures[1]) {
      return this.executeTransaction(transaction).then(() => {
        return this.db.transactions.del(input.transactionID);
      });
    }
    return this.db.transactions.put(transaction);
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

    const makeTransaction = (i) => {
      return {
        addresses: toPersist.addresses[i],
        expiry: toPersist.expiries[i],
        tokens: [toPersist.tokens[i], toPersist.tokens[1 - i]],
        nonce: toPersist.nonces[i],
        amounts: [toPersist.amounts[i], toPersist.amounts[1 - i]],
      };
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
      const transactionObject = makeTransaction(i);
      const stringToSign = makeStringToSign(transactionObject);
      return {
        id: toPersist.id,
        transaction: transaction,
        stringToSign: stringToSign
      };
    };

    const sendMessage = (i) => {
      const address = toPersist.addresses[i]
      const client = this.clients[address];
      const message = makeMessage(i);
      if (client) {
        return client.send(message);
      }
      if (!this.messageQueue[address]) {
        this.messageQueue[address] = [];
      }
      this.messageQueue[address].push(message);
    };

    sendMessage(0);
    sendMessage(1);
    return this.db.transactions.put(toPersist);
  }
}

module.exports = OrderProcessor;
