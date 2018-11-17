const Transaction = require('./transaction');


function compare(a, b) {
    const timeA = a.timestamp;
    const timeB = b.timestamp;

    let comparison = 0;
    if (timeB > timeA) {
        comparison = 1;
    } else if (timeB < timeA) {
        comparison = -1;
    }
    return comparison;
}

class OrderEngine {
    constructor(sourceToken, targetToken, db) {
        this.sourceToken = sourceToken;
        this.targetToken = targetToken;
        this.allOrders = db;
        this.bids = [];
        this.asks = [];
    }

    queueOrders() {
        this.allOrders.sort(compare);
        for (let i = 0; i < this.allOrders.length; i++) {
            if (this.allOrders[i].sourceToken === this.sourceToken &&
                this.allOrders[i].targetToken === this.targetToken) {
                this.bids.push(this.allOrders[i]);
            }
            else if (this.allOrders[i].sourceToken === this.targetToken &&
                     this.allOrders[i].targetToken === this.sourceToken) {
                this.asks.push(this.allOrders[i]);
            }
        }
    }

    makeTransaction(buyOrder, sellOrder) {
        return new Transaction(
            buyOrder.address,
            sellOrder.address,
            buyOrder.sourceToken,
            buyOrder.targetToken,
            buyOrder.sourceAmount,
            buyOrder.targetAmount,
            buyOrder.expiry,
            sellOrder.expiry
        );
    }

    matchTransaction() {
        this.queueOrders();
        const transactions = [];
        while (this.bids.length > 0 && this.asks.length > 0) {
            const buyOrder = this.bids.shift();
            const sellOrder = this.asks.shift();
            if (buyOrder.targetAmount === sellOrder.sourceAmount &&
                buyOrder.targetAmount / buyOrder.sourceAmount === sellOrder.sourceAmount / sellOrder.targetAmount) {
                transactions.push(this.makeTransaction(buyOrder, sellOrder));
            } else if (buyOrder.targetAmount < sellOrder.sourceAmount &&
                       buyOrder.targetAmount / buyOrder.sourceAmount === sellOrder.sourceAmount / sellOrder.targetAmount) {
                transactions.push(this.makeTransaction(buyOrder, sellOrder));
                sellOrder.targetAmount -= buyOrder.sourceAmount;
                buyOrder.sourceAmount -= sellOrder.targetAmount;
                this.asks.unshift(sellOrder);
            } else if (buyOrder.targetAmount > sellOrder.sourceAmount &&
                       buyOrder.targetAmount / buyOrder.sourceAmount === sellOrder.sourceAmount / sellOrder.targetAmount) {
                transactions.push(this.makeTransaction(buyOrder, sellOrder));
                sellOrder.sourceAmount -= buyOrder.targetAmount;
                buyOrder.sourceAmount -= sellOrder.targetAmount;
                this.bids.unshift(buyOrder)
            } else {
                this.asks.unshift(sellOrder);
            }
        }
        return transactions;
    }
}

module.exports = OrderEngine;


//TESTS
/*
test_order1 = {}
test_order1["address"] = "addr1";
test_order1["source"] = "ETH";
test_order1["target"] = "BTC";
test_order1["targetAmount"] = 100;
test_order1["sourceAmount"] = 100;
test_order1["timestamp"] = 10;

test_order2 = {}
test_order2["address"] = "addr2";
test_order2["source"] = "BTC";
test_order2["target"] = "ETH";
test_order2["targetAmount"] = 100;
test_order2["sourceAmount"] = 100;
test_order2["timestamp"] = 10;

test_order3 = {}
test_order3["address"] = "addr3";
test_order3["source"] = "BTC";
test_order3["target"] = "ETH";
test_order3["targetAmount"] = 90;
test_order3["sourceAmount"] = 100;
test_order3["timestamp"] = 10;

test_order4 = {}
test_order4["address"] = "addr4";
test_order4["source"] = "ETH";
test_order4["target"] = "BTC";
test_order4["targetAmount"] = 50;
test_order4["sourceAmount"] = 45;
test_order4["timestamp"] = 10;

test_order5 = {}
test_order5["address"] = "addr5";
test_order5["source"] = "ETH";
test_order5["target"] = "BTC";
test_order5["targetAmount"] = 75;
test_order5["sourceAmount"] = 69;
test_order5["timestamp"] = 10;

test_orders = [test_order1, test_order2, test_order3, test_order4, test_order5];
console.log(test_orders[0])

test_order_book = new OrderEngine("ETH", "BTC", test_orders);
console.log("Pair: ", test_order_book.sourceToken, test_order_book.targetToken);
console.log("Order book:", test_order_book.allOrders)

// test_order_book.queueOrders();
test_transactions = test_order_book.matchTransaction()

console.log("Transactions: ", test_transactions)
console.log("Remaining asks: ", test_order_book.asks)

*/