import 'vuetify/dist/vuetify.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import './window.init'
import Vuetify from 'vuetify'
import { Vue } from 'vue-property-decorator'
import env from '@/env'
import Wallet from './wallet'
import { remote } from 'electron'
import Nova from './Nova.vue'
import UIX from './UIX.vue'

Vue.use(Vuetify, {
    iconfont: 'mdi' // 'md' || 'mdi' || 'fa' || 'fa4'
})

Vue.config.productionTip = false

// widgets to be bound onto window.
// widgets names should be full caps.
declare global {
    interface Window {
        readonly ENV: typeof env
        readonly WALLETS: Wallet.Store
        readonly THOR: Connex.Thor
        readonly UIX: UIXMethods
    }
    const ENV: typeof env
    const WALLETS: Wallet.Store
    const THOR: Connex.Thor
    const UIX: UIXMethods
}

// bind widgets
Object.defineProperty(window, 'ENV', {
    value: env,
    enumerable: true
})
Object.defineProperty(window, 'WALLETS', {
    value: new Wallet.Store(),
    enumerable: true
})
Object.defineProperty(window, 'THOR', {
    value: remote.app.backend.connect(remote.getCurrentWebContents().id).thor,
    enumerable: true
})

// the portal root
new Nova().$mount('#nova')
// user interaction proxy root
const uix = new UIX().$mount('#uix') as (UIX & UIXMethods)
const uixMethods: UIXMethods = {
    signTx(address, clauses) {
        return uix.signTx(address, clauses)
    }
}
Object.defineProperty(window, 'UIX', {
    value: uixMethods,
    enumerable: true
})

if (ENV.devMode) {
    WALLETS.save({
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
