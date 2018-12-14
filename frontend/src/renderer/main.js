import Vue from 'vue';
import axios from 'axios';
import {
  MdList,
  MdSubheader,
  MdButton,
  MdTable,
  MdContent,
  MdField,
  MdMenu,
  MdCard,
  MdDatepicker,
  MdDialog,
  MdProgress,
  MdSnackbar,
} from 'vue-material/dist/components';

import lang from 'element-ui/lib/locale/lang/en';
import locale from 'element-ui/lib/locale';
import { TimePicker } from 'element-ui';

import PulseLoader from 'vue-spinner/src/PulseLoader.vue';
import 'vue-material/dist/vue-material.min.css';
import 'vue-material/dist/theme/default.css';
import 'element-ui/lib/theme-chalk/index.css';


import './order-handler';
import App from './App';
import router from './router';
import setupWs from './ws';

locale.use(lang);


Vue.use(MdList);
Vue.use(MdSubheader);
Vue.use(MdButton);
Vue.use(MdTable);
Vue.use(MdContent);
Vue.use(MdField);
Vue.use(MdMenu);
Vue.use(MdCard);
Vue.use(MdDatepicker);
Vue.use(MdDialog);
Vue.use(MdProgress);
Vue.use(MdSnackbar);
Vue.component('pulse-loader', PulseLoader);
Vue.use(TimePicker);

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  template: '<App/>',
}).$mount('#app');

setupWs();
