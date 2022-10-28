import Vue from "vue";
import Vuex from "vuex";
 
Vue.use(Vuex);
 
export default new Vuex.Store({
 state: {
     sise: ''
 },
 getters: {},
 mutations: {
    changeSise (state, payload) {
        state.sise = payload
      } 
 },
 actions: {}
});
