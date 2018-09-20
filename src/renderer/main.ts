import 'vuetify/dist/vuetify.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import './window.init'
import Vuetify from 'vuetify'
import { Vue } from 'vue-property-decorator'
import App from './App.vue'
import env from '@/env'
import Wallet from './wallet'
import { remote } from 'electron'
import UIX from './UIX.vue'

declare global {
    interface Window {
        readonly ENV: typeof env
        readonly walletStore: Wallet.Store
        readonly thor: Connex.Thor
        readonly uix: any
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
    value: remote.app.backend.connect(remote.getCurrentWebContents().id).thor,
    enumerable: true
})

Vue.use(Vuetify, {
    iconfont: 'mdi' // 'md' || 'mdi' || 'fa' || 'fa4'
})

Vue.config.productionTip = false

new Vue({
    render: h => h(App)
}).$mount('#frame')

// new Vue({
//     render: h => h(UIX)
// }).$mount('#uix')

Object.defineProperty(window, 'uix', {
    value: new UIX().$mount('#uix'),
    enumerable: true
})

if (window.ENV.devMode) {
    walletStore.save({
        address: '0xf6e78a5584c06e2dec5c675d357f050a5402a730',
        name: 'Test',
        keystore: {
            address: 'f6e78a5584c06e2dec5c675d357f050a5402a730',
            crypto: {
                cipher: 'aes-128-ctr',
                cipherparams: { iv: 'ddbdf9ccf12446fb15a5252d27ff46ae' },
                ciphertext:
                    '637cc65de2515c4d9e52b60ffd944de79b5b2adedc322a8d713daf32c592ae53',
                kdf: 'scrypt',
                kdfparams: {
                    dklen: 32,
                    n: 262144,
                    p: 1,
                    r: 8,
                    salt:
                        '1449a3cbaf300a030a4f6e7e60dcce9367a3fee5ee9079d7a363c5972bdb14b6'
                },
                mac:
                    'cba0573d099c976213900d4751e8b96eb622c58dc0c2e9b37860db95aeb35081'
            },
            id: 'e4e54c43-3935-4541-8e73-66d3C289842F',
            version: 3
        }
    }, true)
}
