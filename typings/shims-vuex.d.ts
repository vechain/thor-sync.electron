import Vuex from 'vuex'

declare module 'vuex' {
    interface Store<S> {
        namespaced?: boolean
    }
}
