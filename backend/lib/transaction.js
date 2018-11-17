class Transaction {
  constructor(buyer, seller, source, target,
              sourceAmount, targetAmount,
              sourceExpiry, targetExpiry) {
    this.buyer = buyer;
    this.seller = seller;
    this.sourceAmount = sourceAmount;
    this.targetAmount = targetAmount;
    this.source = source;
    this.target = target;
    this.sourceExpiry = sourceExpiry;
    this.targetExpiry = targetExpiry;
  }
}


module.exports = Transaction;
