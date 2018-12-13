import events from './events';
import { sendSignature, postOrder } from './http';
import store from './store';
import { approveTransfer } from './w3';

events.on('message-signed', (transaction) => {
  const message = (({ id, address, signature }) => ({ id, address, signature }))(transaction);
  sendSignature(message).catch((err) => {
    events.emit('error', { message: err });
  });
});

/* eslint-disable import/prefer-default-export */
export async function sendOrder(order) {
  await approveTransfer(store.account, order.sourceToken, order.sourceAmount);
  return postOrder(order);
}
