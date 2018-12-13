<template>
  <div>
    <pulse-loader v-if="loading"></pulse-loader>
    <div class="items">
      <div class="item" v-for="item in items" :key="item.name">
        <div class="name">{{ item.name }}</div>
      </div>
    </div>
  </div>
</template>

<script>
  import { getTokens } from '../http';

  export default {
    mounted() {
      getTokens().then((tokens) => {
        this.items = tokens;
        this.loading = false;
      });
    },

    data() {
      return {
        items: [],
        loading: true,
      };
    },
  };
</script>

<style scoped>
  .title {
    color: #888;
    font-size: 18px;
    font-weight: initial;
    letter-spacing: .25px;
    margin-top: 10px;
  }

  .items { margin-top: 8px; }

  .item {
    display: flex;
    margin-bottom: 6px;
  }

  .item .name {
    color: #6a6a6a;
    margin-right: 6px;
  }

  .item .value {
    color: #35495e;
    font-weight: bold;
  }
</style>
