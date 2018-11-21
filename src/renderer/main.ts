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
import CertIndicator from './components/CertIndicator.vue'
import ClauseItem from './components/ClauseItem.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
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
Vue.component('CertIndicator', CertIndicator)
Vue.component('ClauseItem', ClauseItem)
Vue.component('ConfirmDialog', ConfirmDialog)
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
