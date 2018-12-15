//Heapify on startup

const Transaction = require('./transaction');

const parent = i => ((i + 1) >>> 1) - 1;
const left = i => (i << 1) + 1;
const right = i => (i + 1) << 1;

function exchangeRateAsk(a) {
    return a.targetAmount / a.sourceAmount;
}

function exchangeRateBid(a) {
    return a.sourceAmount / a.targetAmount;
}

function compareTime(a, b) {
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

function compareExchangeRateAndTime(a, b) {
    const ex_r_a = a.sourceAmount / a.targetAmount;
    const ex_r_b = b.sourceAmount / b.targetAmount;

    let comparison = 0;
    if (ex_r_b > ex_r_a) {
        comparison = 1;
    } else if (ex_r_b < ex_r_a) {
        comparison = -1;
    } else if (ex_r_b == ex_r_a) {
        comparison = compareTime(a, b);
    }
    return comparison;
}

class OrderHeap {
    constructor(target_token, source_token, db, compareFunc, getBlockNumber) {
        this.compareFunc = compareFunc;
        this.targetToken = target_token;
        this.sourceToken = source_token;
        this.allOrders = db;
        this.getBlockNumber = getBlockNumber;
        this.bids = [];
        this.asks = [];
    }

    heapifyOrders() {
        console.log(this.sourceToken);
        console.log(this.allOrders[1].sourceToken);
        for (let i = 0; i < this.allOrders.length; i++) {
            if (this.allOrders[i].sourceToken === this.sourceToken &&
                this.allOrders[i].targetToken === this.targetToken) {
                this.push(this.bids, this.allOrders[i]);
            }
            else if (this.allOrders[i].sourceToken === this.targetToken &&
                this.allOrders[i].targetToken === this.sourceToken) {
                this.push(this.asks, this.allOrders[i]);
            }
        }
    }

    isExchangeRatesGreater(ask, bid) {
        if (!ask || !bid) {
            return false;
        }
        return exchangeRateBid(bid) >= exchangeRateAsk(ask);
    }

    matchOrders() {
        const transactions = [];
        console.log("BidRate: ", exchangeRateBid(this.peek(this.bids)));
        console.log("AskRate: ", exchangeRateAsk(this.peek(this.asks)));

        while (
            this.isExchangeRatesGreater(this.peek(this.asks), this.peek(this.bids))) {
            var ask_to_execute = this.pop(this.asks);
            while (this.isExchangeRatesGreater(ask_to_execute, this.peek(this.bids))) {
                var bid_to_execute = this.pop(this.bids);
                if (bid_to_execute.targetAmount <= ask_to_execute.sourceAmount) {
                    //Keep ask rate constant and allow bid rate to change
                    ask_to_execute.targetAmount -= bid_to_execute.targetAmount * exchangeRateAsk(ask_to_execute);
                    bid_to_execute.sourceAmount = bid_to_execute.targetAmount * exchangeRateAsk(ask_to_execute);
                    ask_to_execute.sourceAmount -= bid_to_execute.targetAmount;
                    transactions.push(this.makeTransaction(bid_to_execute, ask_to_execute));

                    if (bid_to_execute.targetAmount > 0) {
                        this.push(this.bids, bid_to_execute);
                    }
                }
                else if (bid_to_execute.sourceAmount > ask_to_execute.targetAmount) {
                    transactions.push(this.makeTransaction(ask_to_execute, bid_to_execute));
                    bid_to_execute.sourceAmount -= ask_to_execute.targetAmount;
                    bid_to_execute.targetAmount -= ask_to_execute.sourceAmount;
                    //should be done with the exchange rates, adjust this!!
                    if (bid_to_execute.sourceAmount > 0) {
                        this.push(this.bids, bid_to_execute);
                    }
                }
            }
        }
        return transactions;
    }

    makeTransaction(buyOrder, sellOrder) {
        return new Transaction(
            buyOrder._id,
            sellOrder._id,
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

    //All the auxiliary heap functions
    size(side) {
        return side.length;
    }

    isEmpty(side) {
        return side.length == 0;   
    }

    peek(side) {
        var val = side[0];
        if (val && val.expiry && val.expiry < this.getBlockNumber()) {
            this.pop(side, false);
            return this.peek(side);
            
        }
        return val;
    }

    push(side, ...values) {
        values.forEach(value => {
            side.push(value);
            this._siftUp(side);
        });
        return this.size(side);
    }

    pop(side, retry = true) {
        if (this.isEmpty(side)) {
            return null;
        }
        const poppedVal = side[0];
        const bottom = this.size(side) - 1;
        if (bottom > 0) {
            this._swap(side, 0, bottom);
        }
        side.pop();
        this._siftDown(side);
        if (poppedVal.expiry && poppedVal.expiry < this.getBlockNumber() && retry) {
            return this.pop(side, retry);
        }
        return poppedVal;
    }

    _greater(side, i, j) {
        return this.compareFunc(side[i], side[j]);
    }

    _swap(side, i, j) {
        [side[i], side[j]] = [side[j], side[i]];
    }

    _siftUp(side) {
        let node = this.size(side) - 1;
        while (node > 0 && this._greater(side, node, parent(node))) {
            this._swap(side, node, parent(node));
            node = parent(node);
        }
    }

    _siftDown(side) {
        let node = 0;

        while (
            (left(node) < this.size(side) && this._greater(side, left(node), node)) ||
            (right(node) < this.size(side) && this._greater(side, right(node), node))) {
            let maxChild = (right(node) < this.size(side) && this._greater(side, right(node), left(node))) ? right(node) : left(node);
            this._swap(side, node, maxChild);
            node = maxChild;
        }
    }
}


//TESTS

test_order1 = {}
test_order1["address"] = "addr1";
test_order1["sourceToken"] = "ETH";
test_order1["targetToken"] = "BTC";
test_order1["targetAmount"] = 100;
test_order1["sourceAmount"] = 100;
test_order1["timestamp"] = 10;
test_order1["expiry"] = 10;


test_order2 = {}
test_order2["address"] = "addr2";
test_order2["sourceToken"] = "BTC";
test_order2["targetToken"] = "ETH";
test_order2["targetAmount"] = 100;
test_order2["sourceAmount"] = 100;
test_order2["timestamp"] = 10;
test_order2["expiry"] = 10;

test_order3 = {}
test_order3["address"] = "addr3";
test_order3["sourceToken"] = "BTC";
test_order3["targetToken"] = "ETH";
test_order3["targetAmount"] = 90;
test_order3["sourceAmount"] = 100;
test_order3["timestamp"] = 10;
test_order3["expiry"] = 10;

test_order4 = {}
test_order4["address"] = "addr4";
test_order4["sourceToken"] = "ETH";
test_order4["targetToken"] = "BTC";
test_order4["targetAmount"] = 50;
test_order4["sourceAmount"] = 45;
test_order4["timestamp"] = 10;
test_order4["expiry"] = 10;

test_order5 = {}
test_order5["address"] = "addr5";
test_order5["sourceToken"] = "ETH";
test_order5["targetToken"] = "BTC";
test_order5["targetAmount"] = 75;
test_order5["sourceAmount"] = 69;
test_order5["timestamp"] = 10;
test_order5["expiry"] = 8;

test_orders = [test_order1, test_order2, test_order3, test_order4, test_order5];
console.log(test_orders[0])

test_order_book = new OrderHeap("ETH", "BTC", test_orders, compareExchangeRateAndTime, () => 9);
console.log("Pair: ", test_order_book.sourceToken, test_order_book.targetToken);
console.log("Order book:", test_order_book.allOrders)

//test_order_book.push(test_order_book.bids, test_order5);

test_size = test_order_book.size(test_order_book.asks);
console.log("Test size: ", test_size);

test_order_book.heapifyOrders();
console.log("Asks: ", test_order_book.asks);
console.log("Bids: ", test_order_book.bids);

test_transactions = test_order_book.matchOrders();
console.log("Transactions: ", test_transactions);
