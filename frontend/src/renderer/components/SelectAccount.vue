<template>
  <div id="wrapper">
    <img id="logo" src="~@/assets/logo.png" alt="electron-vue">
    <md-subheader>
      <span class="md-title">Accounts</span>
    </md-subheader>
    <main>
      <div class="content" v-if="!loading">
        <md-list class="accounts">
          <md-list-item
            v-for="account in accounts"
            :key="account"
            v-bind:class="{ selected: selectedAccount === account }"
            @click="select(account)">{{ account }}</md-list-item>
        </md-list>
        <div class="actions">
          <button
            class="button"
            v-bind:disabled="!this.selectedAccount"
            @click="confirmSelection">Select</button>
        </div>
      </div>
      <pulse-loader v-if="loading"></pulse-loader>
    </main>
  </div>
</template>

<script>
import web3 from '../w3';
import router from '../router';
import store from '../store';

export default {
  name: 'SelectAccount',

  mounted() {
    web3.eth.getAccounts().then((accounts) => {
      this.accounts = accounts;
      this.loading = false;
    });
  },

  data() {
    return {
      loading: true,
      accounts: [],
      selectedAccount: null,
    };
  },

  methods: {
    select(account) {
      this.selectedAccount = account;
    },

    confirmSelection() {
      store.setAccount(this.selectedAccount);
      router.push('dashboard');
    },
  },
};
</script>

<style>
.content {
  flex: 0 0 100%;
  width: 320px;
  max-width: 100%;
  display: inline-block;
  vertical-align: top;
  border: 1px solid rgba(#000, 0.12);
}

.selected {
  background-color: var(--md-theme-default-divider-on-background, rgba(0,0,0,0.22));
  color: var(--md-theme-default-text-primary-on-background, rgba(0,0,0,0.87));
}

.actions {
  margin-top: 1em;
  text-align: right;
}

</style>
