class Transaction {
  constructor(buyer, seller, source, target,
              source_amount, target_amount,
              sourceExpiry, targetExpiry) {
    this.buyer = buyer;
    this.seller = seller;
    this.source_amount = source_amount;
    this.target_amount = target_amount;
    this.source = source;
    this.target = target;
    this.sourceExpiry = sourceExpiry;
    this.targetExpiry = targetExpiry;
  }

  get sourceAmount() {
    return this.source_amount;
  }

  get targetAmount() {
    return this.target_amount;
  }
}


module.exports = Transaction;
