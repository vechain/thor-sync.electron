import './window.init'
import './typeface.css'
import Vuetify from 'vuetify'
import { Vue } from 'vue-property-decorator'
import Vuex from 'vuex'
import './filters'
import './directives'
import VueRouter from 'vue-router'
import Nova from './Nova.vue'
import Store from './store'
import DialogHelper from './mixins/dialog-helper'
import DevWallets from '../dev-wallets'
import './style.styl'

Vue.use(Vuetify, {
    iconfont: 'mdi' // 'md' || 'mdi' || 'fa' || 'fa4'
})
Vue.use(Vuex)
Vue.use(VueRouter)
Vue.use(DialogHelper)
Vue.config.productionTip = false

// register global components
import * as components from './components'
import { isFirstTimeRun } from './first-time-run'

// tslint:disable-next-line:forin
for (const key in components) {
    Vue.component(key, (components as any)[key])
}

// the portal root
new Nova({ store: new Store() }).$mount('#nova')

if (isFirstTimeRun) {
    GDB.on('ready', () => {
        GDB.shortcuts.bulkAdd([{
            title: 'Online Help',
            href: 'https://github.com/vechain/thor-sync.electron/wiki'
        }, {
            title: 'Gitter',
            href: 'https://gitter.im/vechain/sync'
        }])
    }, true)


    if (ENV.devMode) {
        BDB.on('ready', () => {
            BDB.wallets.bulkAdd(DevWallets)
        }, true)
    }
}
