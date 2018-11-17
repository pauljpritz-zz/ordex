
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

class Transaction {
    constructor(buyer, seller, source, target, source_amount, target_amount) {
        this.buyer = buyer;
        this.seller = seller;
        this.source_amount = source_amount;
        this.target_amount = target_amount;
        this.source = source;
        this.target = target;
    }
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
        console.log(this.asks)
        console.log(this.bids)
    }
      

    matchTransaction() {
        var transactions = [];
        while ((this.bids.lenght > 0) && (this.asks.length > 0)) {
            var buy_order = this.bids.shift();
            var sell_order = this.asks.shift();


            if (buy_order.target_amount == sell_order.source_amount &&
                (buy_order.target_amount / buy_order.source_amount) == (sell_order.source_amount / sell_order.target_amount)) {
                transactions.push(new Transaction(
                    buy_order.address,
                    sell_order.address,
                    buy_order.source,
                    buy_order.target,
                    buy_order.source_amount,
                    buy_order.target_amount))
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
            else if (sell_order.target_amount < buy_order.source_amount && 
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
        }
        return transactions;
    }
}


//TESTS

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

test_orders = [test_order1, test_order2];
console.log(test_orders[0])

test_order_book = new OrderBook("ETH", "BTC", test_orders);
console.log("Pair: ", test_order_book.source, test_order_book.target);
console.log("Order book:", test_order_book.all_orders)

test_order_book.queueOrders();
test_transactions = test_order_book.matchTransaction()
console.log(test_transactions)

