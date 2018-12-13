import events from './events';
import { sendSignature } from './http';

events.on('message-signed', (transaction) => {
  const message = (({ id, address, signature }) => ({ id, address, signature }))(transaction);
  sendSignature(message).catch((err) => {
    events.emit('error', { message: err });
  });
});
