class Transaction {
  constructor(buyer, seller, source, target, source_amount, target_amount) {
    this.buyer = buyer;
    this.seller = seller;
    this.source_amount = source_amount;
    this.target_amount = target_amount;
    this.source = source;
    this.target = target;
  }

  get sourceAmount() {
    return this.source_amount;
  }

  get targetAmount() {
    return this.target_amount;
  }
}


module.exports = Transaction;
