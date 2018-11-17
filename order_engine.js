const Transaction = require('./transaction');


function compare(a, b) {
    const time_a = a.timestamp;
    const time_b = b.timestamp;

    let comparison = 0;
    if (time_b > time_a) {
        comparison = 1;
    } else if (time_b < time_a) {
        comparison = -1;
    }
    return comparison;
}

class OrderBook {
    constructor(source, target, db) {
        this.sourceToken = source;
        this.targetToken = target;
        this.all_orders = db;
        this.bids = [];
        this.asks = [];
    }   

    queueOrders() {
        this.all_orders.sort(compare);
        for (var i = 0; i < this.all_orders.length; i++) {
            if ((this.all_orders[i].sourceToken == this.sourceToken) && (this.all_orders[i].targetToken == this.targetToken)) {
                this.bids.push(this.all_orders[i]);
            }
            else if ((this.all_orders[i].sourceToken == this.targetToken) && (this.all_orders[i].targetToken == this.sourceToken)) {
                this.asks.push(this.all_orders[i]);
            }
        }
    }
      

    matchTransaction() {
        const transactions = [];
        while ((this.bids.length > 0) && (this.asks.length > 0)) {
            var buyOrder = this.bids.shift();
            var sellOrder = this.asks.shift();


            if (buyOrder.targetAmount == sellOrder.sourceAmount &&
                (buyOrder.targetAmount / buyOrder.sourceAmount) == (sellOrder.sourceAmount / sellOrder.targetAmount)) {
                var new_transaction = new Transaction(
                    buyOrder.address,
                    sellOrder.address,
                    buyOrder.sourceToken,
                    buyOrder.targetToken,
                    buyOrder.sourceAmount,
                    buyOrder.targetAmount);
                console.log("MATCH")
                transactions.push(new_transaction)
            }
            else if (buyOrder.targetAmount < sellOrder.sourceAmount &&
                (buyOrder.targetAmount / buyOrder.sourceAmount) == (sellOrder.sourceAmount / sellOrder.targetAmount)) {
                transactions.push(new Transaction(
                    buyOrder.address,
                    sellOrder.address,
                    buyOrder.sourceToken,
                    buyOrder.targetToken,
                    buyOrder.sourceAmount,
                    buyOrder.targetAmount))
                sellOrder.targetAmount -= buyOrder.sourceAmount;
                buyOrder.sourceAmount -= sellOrder.targetAmount;
                this.asks.unshift(sellOrder)
            }
            else if (buyOrder.targetAmount > sellOrder.sourceAmount &&
                (buyOrder.targetAmount / buyOrder.sourceAmount) == (sellOrder.sourceAmount / sellOrder.targetAmount)) {
                transactions.push(new Transaction(
                    buyOrder.address,
                    sellOrder.address,
                    buyOrder.sourceToken,
                    buyOrder.targetToken,
                    sellOrder.targetAmount,
                    sellOrder.sourceAmount))
                sellOrder.sourceAmount -= buyOrder.targetAmount;
                buyOrder.sourceAmount -= sellOrder.targetAmount;
                this.bids.unshift(buyOrder)
            }
            else {
                this.asks.unshift(sellOrder);
            }
        }
        return transactions;
    }
}


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

test_order_book = new OrderBook("ETH", "BTC", test_orders);
console.log("Pair: ", test_order_book.sourceToken, test_order_book.targetToken);
console.log("Order book:", test_order_book.all_orders)

test_order_book.queueOrders();
test_transactions = test_order_book.matchTransaction()

console.log("Transactions: ", test_transactions)
console.log("Remaining asks: ", test_order_book.asks)

*/