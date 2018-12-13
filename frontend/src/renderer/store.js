import events from './events';

export default {
  account: null,

  setAccount(account) {
    events.emit('account-update', { previous: this.account, new: account });
    this.account = account;
  },
};
