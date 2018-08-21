import { Vue } from 'vue-property-decorator'
import App from './App.vue'
import router from '@/renderer/router'
import store from '@/renderer/store'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
