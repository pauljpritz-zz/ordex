const Web3 = require('web3');

class W3Wrapper {
  constructor(w3) {
    this.w3 = w3
  }
}


module.exports = function () {
  const endpoint = 'http://localhost:7545';
  const web3 = new Web3(new Web3.providers.HttpProvider(endpoint));
  return new W3Wrapper(web3);
};
