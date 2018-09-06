import { Vue } from 'vue-property-decorator'
import Vuex from 'vuex'
import * as actions from './vuex/actions'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {},
  mutations: {},
  actions: actions
})
