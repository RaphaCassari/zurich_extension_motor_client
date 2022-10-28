import Vue from 'vue';
import App from './components/App.vue';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import './js/tableau.extensions.1.latest.min';

import router from './router'
import store from "./store";
import vuetify from './plugins/vuetify';

Vue.config.productionTip = false;


new Vue({
    render: h => h(App),
    router,
    vuetify,
    store
}).$mount('#app');