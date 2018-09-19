import 'vuetify/dist/vuetify.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import { Vue } from 'vue-property-decorator'
import vuetify from 'vuetify'
import App from './App.vue'
import router from './router'

Vue.use(vuetify, {
    iconfont: 'md'
})

Vue.config.productionTip = false

new Vue({
    router,
    render: h => h(App)
}).$mount('#app')
