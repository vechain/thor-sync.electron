import { Vue } from 'vue-property-decorator'
import VueRouter from 'vue-router'
import Clause from './components/Clause.vue'

Vue.use(VueRouter)
export default new VueRouter({
    routes: [
        {
            name: 'thor.clause',
            path: '/thor',
            component: Clause
        }
    ]
})
