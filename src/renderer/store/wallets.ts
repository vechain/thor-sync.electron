import Vuex from 'vuex'
import { Vue } from 'vue-property-decorator'
import Wallet from '../wallet'

namespace WalletStore {
    export type Model = {
        entities: Wallet.Entity[]
        status: { [address: string]: (Status | undefined) }
    }

    type Status = {
        pollRef?: number
        balance?: string
        energy?: string
        hasCode?: boolean
    }
}

class WalletStore extends Vuex.Store<WalletStore.Model> {
    constructor() {
        super({
            state: {
                entities: [],
                status: {}
            },
            getters: {
                getAccountStatus(state) {
                    return (address: string) => {
                        return state.status[address]
                    }
                }
            },
            mutations: {
                setEntries(state, entities) {
                    state.entities = entities
                },
                setAccountStatus(state, payload) {
                    Vue.set(state.status, payload.address, payload.status)
                }
            },
            actions: {}
        })
        this.namespaced = true

        const load = () => {
            WALLETS.list().then(entries => {
                this.commit('setEntries', entries)
            // tslint:disable-next-line:no-console
            }).catch(console.log)
        }

        (async () => {
            load()
            WALLETS.subscribe(() => {
                load()
            })

            // for (; ;) {
            //     await THOR.nextTick()
            //     // tslint:disable-next-line:forin
            //     for (const addr in wallets.state) {
            //         const w = wallets.state[addr]
            //         if (!w.watchRef) {
            //             continue
            //         }
            //         THOR.account(addr)
            //             .get()
            //             .then(a => {
            //                 w.balance = a.balance
            //                 w.energy = a.energy
            //                 w.hasCode = a.hasCode
            //             }).catch(console.log)
            //     }
            // }
        })()
    }
}

export default WalletStore
