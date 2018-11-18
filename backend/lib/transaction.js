class Transaction {
  constructor(source_id, target_id, buyer, seller, source, target,
              sourceAmount, targetAmount,
              sourceExpiry, targetExpiry) {
    this.source_id = source_id;
    this.target_id = target_id;  
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
