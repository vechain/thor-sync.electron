import 'vuetify/dist/vuetify.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import '@mdi/font/css/materialdesignicons.css'
import 'typeface-roboto/index.css'
import 'typeface-roboto-mono'
import './window.init'
import Vuetify from 'vuetify'
import { Vue } from 'vue-property-decorator'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import env from '@/env'
import Wallet from './wallet'
import Preferences from './preferences'
import { remote } from 'electron'
import Nova from './Nova.vue'
import Store from './store'

Vue.use(Vuetify, {
    iconfont: 'mdi' // 'md' || 'mdi' || 'fa' || 'fa4'
})
Vue.use(Vuex)
Vue.use(VueRouter)
Vue.config.productionTip = false

// widgets to be bound onto window.
// widgets names should be full caps.
declare global {
    interface Window {
        readonly ENV: typeof env
        readonly WALLETS: Wallet.Persist
        readonly PREFERENCES: Preferences
        // event bus
        readonly BUS: Vue
    }
    const ENV: typeof env
    const WALLETS: Wallet.Persist
    const PREFERENCES: Preferences
    const BUS: Vue
}

Object.defineProperty(window, 'connex', {
    value: remote.app.EXTENSION.connect(
        env.contentsId!,
        env.config!,
        env.clientId!),
    enumerable: true
})
// bind widgets, UIX will be bound inside UIX root
Object.defineProperty(window, 'ENV', {
    value: env,
    enumerable: true
})
Object.defineProperty(window, 'WALLETS', {
    value: new Wallet.Persist(),
    enumerable: true
})
Object.defineProperty(window, 'PREFERENCES', {
    value: new Preferences(),
    enumerable: true
})
Object.defineProperty(window, 'BUS', {
    value: new Vue()
})

// the portal root
new Nova({ store: new Store() }).$mount('#nova')
