const _ = require('lodash');
const Validator = require('jsonschema').Validator;
const schemas = require('./schemas');

const validator = new Validator();

const BLOCK_OFFSET = 4 * 15;


class Offer {
  constructor(props) {
    _.assign(this, props);
  }

  static fromJSON(offer, currentBlock) {
    const result = validator.validate(offer, schemas["offer"]);
    if (result.errors && result.errors.length > 0) {
      throw new Error(`invalid JSON: ${JSON.stringify(result.errors)}`);
    }

    return new Offer(_.assign({
      expiry: currentBlock + BLOCK_OFFSET,
      timestamp: new Date().getTime()
    }, offer));
  }

}

module.exports = Offer;
