import './window.init'
import 'vuetify/dist/vuetify.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import '@mdi/font/css/materialdesignicons.css'
import 'typeface-roboto/index.css'
import 'typeface-roboto-mono'
import Vuetify from 'vuetify'
import { Vue } from 'vue-property-decorator'
import Vuex from 'vuex'
import './filters'
import './directives'
import VueRouter from 'vue-router'
import Nova from './Nova.vue'
import Store from './store'

Vue.use(Vuetify, {
    iconfont: 'mdi' // 'md' || 'mdi' || 'fa' || 'fa4'
})
Vue.use(Vuex)
Vue.use(VueRouter)
Vue.config.productionTip = false

// register global components
import AccessHistoryPanel from './components/AccessHistoryPanel.vue'
import Activity from './components/Activity.vue'
import AddressLabel from './components/AddressLabel.vue'
import Amount from './components/Amount.vue'
import AppButton from './components/AppButton.vue'
import CertIndicator from './components/CertIndicator.vue'
import ClauseItem from './components/ClauseItem.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import Favicon from './components/Favicon.vue'
import IdentBox from './components/IdentBox.vue'
import NetworkStatus from './components/NetworkStatus.vue'
import NetworkStatusPanel from './components/NetworkStatusPanel.vue'
import OverlayedMenu from './components/OverlayedMenu.vue'
import Priority from './components/Priority.vue'
import QRCode from './components/QRCode.vue'
import QRCodeDialog from './components/QRCodeDialog.vue'
import Swiper from './components/Swiper.vue'
import TabButton from './components/TabButton.vue'
import Tip from './components/Tip.vue'
import TxRecord from './components/TxRecord.vue'
import TxRecordsPanel from './components/TxRecordsPanel.vue'
import UrlBox from './components/UrlBox.vue'
import WalletCard from './components/WalletCard.vue'
import WalletSeeker from './components/WalletSeeker.vue'
import WebView from './components/WebView.vue'

Vue.component('AccessHistoryPanel', AccessHistoryPanel)
Vue.component('Activity', Activity)
Vue.component('AddressLabel', AddressLabel)
Vue.component('Amount', Amount)
Vue.component('AppButton', AppButton)
Vue.component('CertIndicator', CertIndicator)
Vue.component('ClauseItem', ClauseItem)
Vue.component('ConfirmDialog', ConfirmDialog)
Vue.component('Favicon', Favicon)
Vue.component('IdentBox', IdentBox)
Vue.component('NetworkStatus', NetworkStatus)
Vue.component('NetworkStatusPanel', NetworkStatusPanel)
Vue.component('OverlayedMenu', OverlayedMenu)
Vue.component('Priority', Priority)
Vue.component('QRCode', QRCode)
Vue.component('QRCodeDialog', QRCodeDialog)
Vue.component('Swiper', Swiper)
Vue.component('TabButton', TabButton)
Vue.component('Tip', Tip)
Vue.component('TxRecord', TxRecord)
Vue.component('TxRecordsPanel', TxRecordsPanel)
Vue.component('UrlBox', UrlBox)
Vue.component('WalletCard', WalletCard)
Vue.component('WalletSeeker', WalletSeeker)
Vue.component('WebView', WebView)

// the portal root
new Nova({ store: new Store() }).$mount('#nova')

if (ENV.devMode) {
    DB.wallets.count().then(n => {
        if (n === 0) {
            DB.wallets.put({
                address: '0xf6e78a5584c06e2dec5c675d357f050a5402a730',
                name: 'Foo',
                keystore: JSON.parse(
                    // tslint:disable-next-line:max-line-length
                    '{"address":"f6e78a5584c06e2dec5c675d357f050a5402a730","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"ddbdf9ccf12446fb15a5252d27ff46ae"},"ciphertext":"637cc65de2515c4d9e52b60ffd944de79b5b2adedc322a8d713daf32c592ae53","kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"1449a3cbaf300a030a4f6e7e60dcce9367a3fee5ee9079d7a363c5972bdb14b6"},"mac":"cba0573d099c976213900d4751e8b96eb622c58dc0c2e9b37860db95aeb35081"},"id":"e4e54c43-3935-4541-8e73-66d3C289842F","version":3}'
                )
            })
            DB.wallets.put({
                address: '0x881abd9fe12319e9353f45ed47472cffb34e375e',
                name: 'Bar',
                keystore: JSON.parse(
                    // tslint:disable-next-line:max-line-length
                    '{"version":3,"id":"147a3e15-638a-473b-836d-5c14903acfa3","address":"881abd9fe12319e9353f45ed47472cffb34e375e","crypto":{"kdf":"scrypt","kdfparams":{"dklen":32,"salt":"6239b7ad3b52fb800f83d24e9ba0393df277a79d40e1c71f6e510e231b9aece9","n":262144,"r":8,"p":1},"cipher":"aes-128-ctr","ciphertext":"3bc78973893808f9d05004e95552dcbcc5c3af45cde3983dc7eec533b84858d3","cipherparams":{"iv":"67f1857ec6e19c0907b579535f724c84"},"mac":"7f7722bca47ce99cede34215952d37829bf7a4147d14be263c17ce8b85a58ac6"}}'
                )
            })
            DB.wallets.put({
                address: '0x40d9b870df290c582f71d48bb208c6fa275ac6be',
                name: 'Baz',
                keystore: JSON.parse(
                    // tslint:disable-next-line:max-line-length
                    '{"version":3,"id":"3efc9991-b02c-4615-bb66-87ddecbeac95","address":"40d9b870df290c582f71d48bb208c6fa275ac6be","crypto":{"kdf":"scrypt","kdfparams":{"dklen":32,"salt":"1b6ace1df4c3696cb47fb743186333a3e3860353f287f64f518e2fb024e65c3c","n":262144,"r":8,"p":1},"cipher":"aes-128-ctr","ciphertext":"f27d7546182e8be49f400150f92352babe165299e0ce08a81d4def441591d24e","cipherparams":{"iv":"4e7ab13269770caf71fc68a230ddc963"},"mac":"876edfd59def69b73baabfaa5d01f96cfa7ba38e60dc5c98fc637f815b3a1760"}}'
                )
            })
        }
    })
}
