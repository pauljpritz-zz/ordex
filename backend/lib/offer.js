const _ = require('lodash');
const Validator = require('jsonschema').Validator;
const schemas = require('./schemas');

const validator = new Validator();


class Offer {
  constructor(props) {
    _.assign(this, props);
  }

  static fromJSON(offer, currentBlock) {
    const result = validator.validate(offer, schemas["offer"]);
    if (result.errors && result.errors.length > 0) {
      throw new Error(`invalid JSON: ${JSON.stringify(result.errors)}`);
    }

    return new Offer(_.assign({}, offer, {currentBlock: currentBlock}));
  }

}

module.exports = Offer;
