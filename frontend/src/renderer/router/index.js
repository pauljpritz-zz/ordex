import Vue from 'vue';
import Router from 'vue-router';
import store from '../store';

Vue.use(Router);

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: require('@/components/Dashboard').default,
    },
    {
      path: '/select-account',
      name: 'select-account',
      component: require('@/components/SelectAccount').default,
      meta: { noAccount: true },
    },
    {
      path: '/exchange-tokens',
      name: 'exchange-tokens',
      component: require('@/components/ExchangeTokens').default,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});


router.beforeEach((to, from, next) => {
  if (store.account && to.meta.noAccount) {
    next({ path: '/' });
  } else if (!store.account && !to.meta.noAccount) {
    next({ path: '/select-account' });
  } else {
    next();
  }
});

export default router;
