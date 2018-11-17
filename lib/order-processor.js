const _ = require('lodash');
const Web3 = require('web3');
const uuid = require('uuid/v4');

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
    offer["_id"] = uuid();
    return this.db.offers.put(offer);
  }

  multicastOrder(sourceOffer, targetOffer) {
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
    const addresses = [sourceOffer.address, targetOffer.address];
    const amounts = [
      _.min([sourceOffer.sourceAmount, targetOffer.targetAmount]),
      _.min([sourceOffer.targetAmount, targetOffer.sourceAmount])
    ];
    const tokens = [sourceOffer.sourceToken, sourceOffer.targetToken];
    const expiries = [sourceOffer.expiry, targetOffer.expiry];

    const makeTransaction = (i) => {
      return {
        addresses: addresses,
        expiry: expiries[i],
        tokens: [tokens[i], tokens[1 - i]],
        nonce: getRandomInt(1000 * 1000 * 1000),
        amounts: [amounts[i], amounts[1 - i]],
      };
    };

    const makeStringToSign = (transaction) => {
      return Web3.utils.soliditySha3(
        {type: 'string', value: 'OrDex'},
        {type: 'uint256', value: transaction.nonce},
        {type: 'uint256', value: transaction.expiry},
        {type: 'string', value: transaction.tokens[0]},
        {type: 'string', value: transaction.tokens[1]},
        {type: 'uint256', value: transaction.amounts[0]},
        {type: 'uint256', value: transaction.amounts[1]},
      );
    };

    const makeMessage = (i) => {
      const transaction = makeTransaction(i);
      const stringToSign = makeStringToSign(transaction);
      return {transaction: transaction, stringToSign: stringToSign};
    };

    const sendMessage = (i) => {
      const address = addresses[i]
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
  }
}

module.exports = OrderProcessor;
