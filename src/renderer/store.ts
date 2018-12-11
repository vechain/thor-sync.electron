import Vuex from 'vuex'
import { Entities } from './database'

namespace Store {
    export type Model = {
        chainStatus: Connex.Thor.Status
        shortcuts: Array<Entities.Preference<'shortcut'>>
        networks: Array<Entities.Preference<'network'>>
        wallets: Entities.Wallet[]
    }
}

class Store extends Vuex.Store<Store.Model> {
    public static readonly UPDATE_CHAIN_STATUS = 'updateChainStatus'
    public static readonly UPDATE_SHORTCUTS = 'updateShortcuts'
    public static readonly UPDATE_NETWORKS = 'updateNetworks'
    public static readonly UPDATE_WALLETS = 'updateWallets'
    constructor() {
        super({
            state: {
                chainStatus: connex.thor.status,
                shortcuts: [],
                networks: [],
                wallets: []
            },
            getters: {
            },
            mutations: {
                [Store.UPDATE_CHAIN_STATUS](state) {
                    state.chainStatus = connex.thor.status
                },
                [Store.UPDATE_SHORTCUTS](state, payload) {
                    state.shortcuts = payload
                },
                [Store.UPDATE_NETWORKS](state, payload) {
                    state.networks = payload
                },
                [Store.UPDATE_WALLETS](state, payload) {
                    state.wallets = payload
                }
            }
        })
        this.monitorChain()
        this.monitorDB()

    }

    private async monitorChain() {
        this.commit(Store.UPDATE_CHAIN_STATUS)
        const ticker = connex.thor.ticker()
        for (; ;) {
            await ticker.next()
            this.commit(Store.UPDATE_CHAIN_STATUS)
        }
    }

    private async monitorDB() {
        const queryAndUpdateShortcuts = async () => {
            const shortcuts = await GDB.preferences
                .where({ key: 'shortcut' })
                .toArray()
            this.commit(Store.UPDATE_SHORTCUTS, shortcuts)
        }
        const queryAndUpdateNetworks = async () => {
            const networks = await GDB.preferences
                .where({ key: 'network' })
                .toArray()
            this.commit(Store.UPDATE_NETWORKS, networks)
        }

        const queryAndUpdateWallets = async () => {
            const wallets = await BDB.wallets
                .toArray()
            this.commit(Store.UPDATE_WALLETS, wallets)
        }

        await queryAndUpdateShortcuts()
        await queryAndUpdateNetworks()
        await queryAndUpdateWallets()

        GDB.subscribe(GDB.preferences.name, () => {
            queryAndUpdateShortcuts()
            queryAndUpdateNetworks()
        })
        BDB.subscribe(BDB.wallets.name, queryAndUpdateWallets)
    }
}

export default Store
