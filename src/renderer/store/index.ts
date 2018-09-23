import Vuex from 'vuex'
import WalletStore from './wallets'

namespace RootStore {
    export type Model = {
        chainStatus: Connex.Thor.Status
    }
}

class RootStore extends Vuex.Store<RootStore.Model> {
    constructor() {
        super({
            state: {
                chainStatus: THOR.status
            },
            mutations: {
                updateStatus(state) {
                    state.chainStatus = THOR.status
                }
            },
            modules: {
                wallets: new WalletStore()
            }
        });

        (async () => {
            this.commit('updateStatus')
            const ticker = THOR.ticker()
            for (; ;) {
                await ticker.next()
                this.commit('updateStatus')
            }
        })()
        setInterval(() => {
            this.commit('updateStatus')
        }, 60 * 1000)
    }
}

export default RootStore
