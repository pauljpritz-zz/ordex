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
        this.source = source;
        this.target = target;
        this.all_orders = db;
        this.bids = [];
        this.asks = [];
    }   

    queueOrders() {
        this.all_orders.sort(compare);
        for (var i = 0; i < this.all_orders.length; i++) {
            if ((this.all_orders[i].source == this.source) && (this.all_orders[i].target == this.target)) {
                this.bids.push(this.all_orders[i]);
            }
            else if ((this.all_orders[i].source == this.target) && (this.all_orders[i].target == this.source)) {
                this.asks.push(this.all_orders[i]);
            }
        }
    }
      

    matchTransaction() {
        var transactions = [];
        while ((this.bids.length > 0) && (this.asks.length > 0)) {
            var buy_order = this.bids.shift();
            var sell_order = this.asks.shift();


            if (buy_order.target_amount == sell_order.source_amount &&
                (buy_order.target_amount / buy_order.source_amount) == (sell_order.source_amount / sell_order.target_amount)) {
                var new_transaction = new Transaction(
                    buy_order.address,
                    sell_order.address,
                    buy_order.source,
                    buy_order.target,
                    buy_order.source_amount,
                    buy_order.target_amount);
                console.log("MATCH")
                transactions.push(new_transaction)
            }
            else if (buy_order.target_amount < sell_order.source_amount &&
                (buy_order.target_amount / buy_order.source_amount) == (sell_order.source_amount / sell_order.target_amount)) {
                transactions.push(new Transaction(
                    buy_order.address,
                    sell_order.address,
                    buy_order.source,
                    buy_order.target,
                    buy_order.source_amount,
                    buy_order.target_amount))
                sell_order.target_amount -= buy_order.source_amount;
                buy_order.source_amount -= sell_order.target_amount;
                this.asks.unshift(sell_order)
            }
            else if (buy_order.target_amount > sell_order.source_amount &&
                (buy_order.target_amount / buy_order.source_amount) == (sell_order.source_amount / sell_order.target_amount)) {
                transactions.push(new Transaction(
                    buy_order.address,
                    sell_order.address,
                    buy_order.source,
                    buy_order.target,
                    sell_order.target_amount,
                    sell_order.source_amount))
                sell_order.source_amount -= buy_order.target_amount;
                buy_order.source_amount -= sell_order.target_amount;
                this.bids.unshift(buy_order)
            }
            else {
                this.asks.unshift(sell_order);
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
test_order1["target_amount"] = 100;
test_order1["source_amount"] = 100;
test_order1["timestamp"] = 10;

test_order2 = {}
test_order2["address"] = "addr2";
test_order2["source"] = "BTC";
test_order2["target"] = "ETH";
test_order2["target_amount"] = 100;
test_order2["source_amount"] = 100;
test_order2["timestamp"] = 10;

test_order3 = {}
test_order3["address"] = "addr3";
test_order3["source"] = "BTC";
test_order3["target"] = "ETH";
test_order3["target_amount"] = 90;
test_order3["source_amount"] = 100;
test_order3["timestamp"] = 10;

test_order4 = {}
test_order4["address"] = "addr4";
test_order4["source"] = "ETH";
test_order4["target"] = "BTC";
test_order4["target_amount"] = 50;
test_order4["source_amount"] = 45;
test_order4["timestamp"] = 10;

test_order5 = {}
test_order5["address"] = "addr5";
test_order5["source"] = "ETH";
test_order5["target"] = "BTC";
test_order5["target_amount"] = 75;
test_order5["source_amount"] = 69;
test_order5["timestamp"] = 10;

test_orders = [test_order1, test_order2, test_order3, test_order4, test_order5];
console.log(test_orders[0])

test_order_book = new OrderBook("ETH", "BTC", test_orders);
console.log("Pair: ", test_order_book.source, test_order_book.target);
console.log("Order book:", test_order_book.all_orders)

test_order_book.queueOrders();
test_transactions = test_order_book.matchTransaction()

console.log("Transactions: ", test_transactions)
console.log("Remaining asks: ", test_order_book.asks)

*/