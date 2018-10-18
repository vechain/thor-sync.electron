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
import Preferences from './preferences'
import { remote } from 'electron'
import Nova from './Nova.vue'
import Store from './store'
import Database from './database'

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
        readonly DB: Database
        readonly PREFERENCES: Preferences
        // event bus
        readonly BUS: Vue
    }
    const ENV: typeof env
    const DB: Database
    const PREFERENCES: Preferences
    const BUS: Vue
}

Object.defineProperty(window, 'connex', {
    value: remote.app.EXTENSION.connect(
        env.contents!.id,
        env.xargs!.config!,
        env.xargs!.clientId!),
    enumerable: true
})
// bind widgets
Object.defineProperty(window, 'ENV', {
    value: env,
    enumerable: true
})
Object.defineProperty(window, 'DB', {
    value: new Database(),
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
