<template>
  <div id="wrapper">
    <img id="logo" src="~@/assets/logo.png" alt="electron-vue">
    <main>
      <div class="left-side">
        <span class="title">
          Tokens on sale
        </span>
        <tokens></tokens>

        <span class="title alt">Settings</span>
        <div class="items">
          <div class="item">
            <div class="name">
              <a href="javascript:void(0)"
                 @click="switchAccount">Switch account</a>
            </div>
          </div>
        </div>
      </div>

      <div class="right-side">
        <div>
          <div class="title">
            Your Tokens
          </div>
          <div class="content" v-if="!loading && balances.length > 0">
            <md-table>
              <md-table-row>
                <md-table-head>Token</md-table-head>
                <md-table-head>Balance</md-table-head>
              </md-table-row>
              <md-table-row v-for="tokenBalance in balances" :key="tokenBalance.address">
                <md-table-cell>{{ tokenBalance.name }}</md-table-cell>
                <md-table-cell>{{ tokenBalance.balance }}</md-table-cell>
              </md-table-row>
            </md-table>
            <router-link class="button" to="/exchange-tokens">Exchange tokens</router-link>
          </div>
          <div class="content" v-if="!loading && balances.length === 0">
            <p>You do not have any tokens yet</p>
            <button class="button">Buy tokens</button>
          </div>
          <pulse-loader v-if="loading"></pulse-loader>
        </div>
      </div>
    </main>
    <md-snackbar
      :md-active.sync="showOrderPlaced && $route.query.success === 'order'">
      <span>Your order has been placed</span>
      <md-button class="md-primary" @click="showOrderPlaced = false">Close</md-button>
    </md-snackbar>

    <md-snackbar
      :md-active.sync="showConfirmedTransaction">
      <span>{{ confirmedTransaction.message }}</span>
      <md-button class="md-primary" @click="showConfirmedTransaction = false">Close</md-button>
    </md-snackbar>

    <md-snackbar
      :md-actyve.sync="showConnected">
      <span>Your are connected</span>
      <md-button class="md-primary" @click="showConnected = false">Close</md-button>
    </md-snackbar>
  </div>
</template>

<script>
  import Tokens from './Tokens';
  import { getBalances } from '../order-handler';
  import store from '../store';
  import events from '../events';

  export default {
    name: 'dashboard',
    created() {
      events.on('connected', () => {
        this.showConnected = true;
      });
      events.on('transaction-confirmed', (transaction) => {
        this.confirmedTransaction = transaction;
        this.showOrderPlaced = false;
        this.showConfirmedTransaction = true;
        this.fetchBalances();
      });
    },
    mounted() {
      this.fetchBalances();
    },
    data() {
      return {
        balances: [],
        loading: true,
        showOrderPlaced: true,
        showConnected: false,
        showConfirmedTransaction: false,
        confirmedTransaction: {},
      };
    },
    components: { Tokens },
    methods: {
      switchAccount() {
        store.setAccount(null);
        this.$router.replace({ path: '/select-account' });
      },
      fetchBalances() {
        getBalances().then((balances) => {
          this.balances = balances;
          this.loading = false;
        });
      },
    },
  };
</script>

<style scoped lang="scss">
  .content .button {
    margin-top: 2em;
  }

  .left-side {
    .title.alt {
      margin-top: 1em;
    }
  }
</style>
