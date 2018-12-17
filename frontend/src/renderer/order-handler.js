import events from './events';
import store from './store';
import config from './config';
import { sendSignature, postOrder, getTokens } from './http';
import { approveTransfer, getERC20Balance } from './w3';

events.on('error', (err) => {
  console.error(err);
});

events.on('message-signed', (transaction) => {
  const message = (({ id, address, signature }) => ({ id, address, signature }))(transaction);
  sendSignature(message).catch((err) => {
    events.emit('error', { message: err });
  });
});

export async function sendOrder(order) {
  await approveTransfer(store.account, order.sourceToken, order.sourceAmount);
  return postOrder(order);
}

export async function confirmTransaction(transaction) {
  const allTokens = await getTokens();
  const findToken = address => allTokens.find(token => token.address === address);
  const tokens = transaction.tokens.map(findToken);
  const message = `You have exchanged ${transaction.amounts[0].toFixed(2)} ${tokens[0].name} for ` +
                   `${transaction.amounts[1].toFixed(2)} ${tokens[1].name}`;
  events.emit('transaction-confirmed', Object.assign({ message }, transaction));
}

export async function getBalances() {
  const tokens = await getTokens();
  const promises = tokens.map(token => getERC20Balance(token.address, store.account));
  const balances = await Promise.all(promises);
  return balances
    .map(b => parseInt(b, 10))
    .map((balance, i) => Object.assign({ balance: balance / config.multiplier }, tokens[i]))
    .filter(token => token.balance > 0);
}
