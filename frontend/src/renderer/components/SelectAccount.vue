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
            @click="select(account)">{{ account }}</md-list-item>
        </md-list>
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
    };
  },

  methods: {
    select(account) {
      store.setAccount(account);
      router.push('dashboard');
    },
  },
};
</script>

<style scoped>
.content {
  flex: 0 0 100%;
  width: 320px;
  max-width: 100%;
  display: inline-block;
  vertical-align: top;
  border: 1px solid rgba(#000, 0.12);
}

</style>
