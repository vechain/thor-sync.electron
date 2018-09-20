import { Vue } from 'vue-property-decorator'
import VueRouter from 'vue-router'
import Clause from './components/Clause.vue'
import Account from './components/Account.vue'
import Vendor from './components/Vendor.vue'

Vue.use(VueRouter)
export default new VueRouter({
    routes: [
        {
            name: 'thor.clause',
            path: '/thor',
            component: Clause
        },
        {
            name: 'user.index',
            path: '/user/index',
            component: Account
        },
        {
            name: 'vendor.index',
            path: '/vendor/index',
            component: Vendor
        }
    ]
})
