import Vuex from 'vuex'

namespace Store {
    export type Model = {
        chainStatus: Connex.Thor.Status
    }
}

class Store extends Vuex.Store<Store.Model> {
    public static readonly UPDATE_CHAIN_STATUS = 'updateChainStatus'
    constructor() {
        super({
            state: {
                chainStatus: connex.thor.status,
            },
            getters: {
            },
            mutations: {
                [Store.UPDATE_CHAIN_STATUS](state) {
                    state.chainStatus = connex.thor.status
                }
            }
        })
        this.monitorChain()
    }

    private async monitorChain() {
        this.commit(Store.UPDATE_CHAIN_STATUS)
        const ticker = connex.thor.ticker()
        for (; ;) {
            await ticker.next()
            this.commit(Store.UPDATE_CHAIN_STATUS)
        }
    }
}

export default Store
