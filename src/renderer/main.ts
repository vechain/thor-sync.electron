import 'vuetify/dist/vuetify.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import './window.init'
import Vuetify from 'vuetify'
import { Vue } from 'vue-property-decorator'
import App from './App.vue'
import router from '@/renderer/router'
import store from '@/renderer/vuex/store'
import env from '@/env'
import Wallet from './wallet'

declare global {
    interface Window {
        ENV: typeof env
        walletStore: Wallet.Store
    }
}
window.ENV = env
window.walletStore = new Wallet.Store()

Vue.use(Vuetify, {
    iconfont: 'mdi' // 'md' || 'mdi' || 'fa' || 'fa4'
})

Vue.config.productionTip = false

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')
