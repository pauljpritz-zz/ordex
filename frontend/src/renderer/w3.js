import Web3 from 'web3';
import erc20 from '../../static/erc20.json';

import config from './config';
import store from './store';
import events from './events';


const provider = new Web3.providers.HttpProvider(config.web3URL);
const w3 = new Web3(provider);


export function getERC20Balance(contractAddress, account) {
  const contract = new w3.eth.Contract(erc20, contractAddress);
  return contract.methods.balanceOf(account).call();
}

export function signMessage(message) {
  const address = store.account;
  if (!address) {
    return Promise.reject(new Error('no account set'));
  }
  return w3.eth.sign(message.stringToSign, address).then((signature) => {
    const payload = Object.assign({ signature, address }, message);
    events.emit('message-signed', payload);
  });
}

export default w3;
