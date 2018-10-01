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
import { remote } from 'electron'
import Nova from './Nova.vue'
import UIX from './UIX.vue'
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
        readonly THOR: Connex.Thor
        readonly UIX: {
            signTx(address: string, clauses: Connex.Thor.Clause[]): Promise<string>
        }
        // event bus
        readonly BUS: Vue
    }
    const ENV: typeof env
    const WALLETS: Wallet.Persist
    const THOR: Connex.Thor
    const UIX: Window['UIX']
    const BUS: Vue
}

// bind widgets, UIX will be bound inside UIX root
Object.defineProperty(window, 'ENV', {
    value: env,
    enumerable: true
})
Object.defineProperty(window, 'WALLETS', {
    value: new Wallet.Persist(),
    enumerable: true
})
Object.defineProperty(window, 'THOR', {
    value: remote.app.backend.connect(remote.getCurrentWebContents().id).thor,
    enumerable: true
})
Object.defineProperty(window, 'BUS', {
    value : new Vue()
})


// the portal root
new Nova({ store: new Store() }).$mount('#nova')
// user interaction proxy root
new UIX().$mount('#uix')
