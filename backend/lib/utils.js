const Web3 = require('web3');
const _ = require('lodash');


exports.makeStringToSign = function(transactionObject) {
  return Web3.utils.soliditySha3(
    {type: 'string', value: 'OrDex'},
    {type: 'uint256', value: transactionObject.nonce},
    {type: 'uint256', value: transactionObject.expiry},
    {type: 'address', value: transactionObject.tokens[0]},
    {type: 'address', value: transactionObject.tokens[1]},
    {type: 'uint256', value: transactionObject.amounts[0]},
    {type: 'uint256', value: transactionObject.amounts[1]},
  );
};

exports.formatTransaction = function(transaction, index) {
  return {
    addresses: transaction.addresses[index],
    expiry: transaction.expiries[index],
    tokens: [transaction.tokens[index], transaction.tokens[1 - index]],
    nonce: transaction.nonces[index],
    amounts: [transaction.amounts[index], transaction.amounts[1 - index]],
  };
};

exports.splitSignature = function (signature) {
  const r = `0x${signature.slice(2, 66)}`;
  const s = `0x${signature.slice(66, 130)}`;
  const v = Web3.utils.toDecimal(signature.slice(130, 132)) + 27;
  return [r, s, v];
};

exports.splitSignatures = function (signatures) {
  return _.unzip(signatures.map(exports.splitSignature));
};
