import 'vuetify/dist/vuetify.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import { Vue } from 'vue-property-decorator'
import vuetify from 'vuetify'
import App from './App.vue'

Vue.use(vuetify, {
    iconfont: 'mdi'
})

Vue.config.productionTip = false

new Vue({
    render: h => h(App)
}).$mount('#app')
