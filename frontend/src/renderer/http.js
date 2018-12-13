import axios from 'axios';

import config from './config';

const http = axios.create({
  baseURL: config.apiBaseURL,
});

export function getTokens() {
  return http.get('/tokens').then(resp => resp.data);
}

export function postOrder(order) {
  return http.post('/offer', order);
}

export function sendSignature(message) {
  return http.post('/signature', message);
}

export default http;
