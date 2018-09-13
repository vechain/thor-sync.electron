import { Vue } from 'vue-property-decorator'
import App from './App.vue'

Vue.config.productionTip = false

new Vue({
    render: h => h(App)
}).$mount('#app')
