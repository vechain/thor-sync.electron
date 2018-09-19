import 'vuetify/dist/vuetify.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import './window.init'
import Vuetify from 'vuetify'
import { Vue } from 'vue-property-decorator'
import App from './App.vue'
import env from '@/env'
import Wallet from './wallet'
import { remote } from 'electron'

declare global {
    interface Window {
        readonly ENV: typeof env
        readonly walletStore: Wallet.Store
        readonly thor: Connex.Thor
    }
    const ENV: typeof env
    const thor: Connex.Thor
    const walletStore: Wallet.Store
}
Object.defineProperty(window, 'ENV', {
    value: env,
    enumerable: true
})
Object.defineProperty(window, 'walletStore', {
    value: new Wallet.Store(),
    enumerable: true
})
Object.defineProperty(window, 'thor', {
    value: remote.app.backend.connect(
        remote.getCurrentWebContents().id
    ).thor,
    enumerable: true
})

Vue.use(Vuetify, {
    iconfont: 'mdi' // 'md' || 'mdi' || 'fa' || 'fa4'
})

Vue.config.productionTip = false

new Vue({
    render: h => h(App)
}).$mount('#app')
