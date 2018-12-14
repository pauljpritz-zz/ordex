import events from './events';
import store from './store';
import { sendSignature, postOrder, getTokens } from './http';
import { approveTransfer, getERC20Balance } from './w3';

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

export async function getBalances() {
  const tokens = await getTokens();
  const promises = tokens.map(token => getERC20Balance(token.address, store.account));
  const balances = await Promise.all(promises);
  return balances
    .map(b => parseInt(b, 10))
    .map((balance, i) => Object.assign({ balance }, tokens[i]))
    .filter(token => token.balance > 0);
}
