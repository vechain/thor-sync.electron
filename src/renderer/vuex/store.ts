import { Vue } from 'vue-property-decorator'
import Vuex from 'vuex'
import * as actions from './actions'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    currentContentId: null,
  },
  mutations: {},
  actions: actions
})
