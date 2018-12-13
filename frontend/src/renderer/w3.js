import Web3 from 'web3';
import erc20 from '../../static/erc20.json';

import config from './config';
import store from './store';
import events from './events';
import { getRemoteConfig } from './http';


const provider = new Web3.providers.HttpProvider(config.web3URL);
const w3 = new Web3(provider);


export function getERC20Balance(contractAddress, account) {
  const contract = new w3.eth.Contract(erc20, contractAddress);
  return contract.methods.balanceOf(account).call();
}

export async function approveTransfer(account, contractAddress, amount) {
  const contract = new w3.eth.Contract(erc20, contractAddress);
  const config = await getRemoteConfig();
  return contract.methods.approve(config.ordexAddress, amount).send({ from: account });
}

export async function signMessage(message) {
  const address = store.account;
  if (!address) {
    throw new Error('no account set');
  }
  const signature = await w3.eth.sign(message.stringToSign, address);
  const payload = Object.assign({ signature, address }, message);
  events.emit('message-signed', payload);
}

export default w3;
