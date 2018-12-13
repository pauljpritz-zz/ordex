import config from './config';
import events from './events';
import { signMessage } from './w3';


export default function setupWS() {
  const url = config.apiBaseURL.replace('http', 'ws');
  let ws = new WebSocket(url);

  const send = (action, args) => {
    if (ws.OPEN) {
      ws.send(JSON.stringify({ action, args }));
    }
  };

  const setupListeners = () => {
    const reconnect = (delay) => {
      setTimeout(() => {
        ws = new WebSocket(url);
        setupListeners();
      }, delay);
    };

    ws.onopen = () => {
      events.emit('connected');
    };

    ws.onerror = () => {
      reconnect(1000);
    };

    ws.onclose = () => {
      reconnect(1000);
    };

    ws.onmessage = (message) => {
      const parsed = JSON.parse(message.data);
      switch (parsed.action) {
        case 'requireSignature':
          signMessage(parsed.args).catch(() => {
            events.emit('error', { message: 'could not sign transaction' });
          });
          break;
        case 'transactionDone':
          console.log(parsed.args);
          break;
        default:
          events.emit('error', { message: `unkown message received ${parsed.action}` });
          break;
      }
    };
  };

  setupListeners();

  events.on('account-update', (info) => {
    if (info.previous) {
      send('unregister', { address: info.previous });
    }
    if (info.new) {
      send('register', { address: info.new });
    }
  });
}
