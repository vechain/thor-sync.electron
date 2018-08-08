import Vue from 'vue'
import App from './App.vue'
import router from '@/renderer/router'
import store from '@/renderer/store'
import proxy from '@/proxy/create'

proxy.showIsOk('ping')

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')


