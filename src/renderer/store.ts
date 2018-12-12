import Vuex from 'vuex'
import { Entities } from './database'
import { sleep } from '@/common/sleep'

namespace Store {
    export type Model = {
        chainHead: Connex.Thor.Status['head']
        syncStatus: {
            progress: number
            flag: 'synced' | 'syncing' | 'outOfSync'
        }
        shortcuts: Array<Entities.Preference<'shortcut'>>
        nodes: Array<Entities.Preference<'node'>>
        wallets: Entities.Wallet[]
    }
}

class Store extends Vuex.Store<Store.Model> {
    public static readonly UPDATE_CHAIN_HEAD = 'updateChainHead'
    public static readonly UPDATE_SYNC_STATUS = 'updateSyncStatus'
    public static readonly UPDATE_SHORTCUTS = 'updateShortcuts'
    public static readonly UPDATE_NODES = 'updateNodes'
    public static readonly UPDATE_WALLETS = 'updateWallets'
    constructor() {
        super({
            state: {
                chainHead: connex.thor.status.head,
                syncStatus: {
                    progress: connex.thor.status.progress,
                    flag: 'syncing'
                },
                shortcuts: [],
                nodes: [],
                wallets: []
            },
            getters: {
            },
            mutations: {
                [Store.UPDATE_CHAIN_HEAD](state) {
                    state.chainHead = connex.thor.status.head
                },
                [Store.UPDATE_SYNC_STATUS](state, payload) {
                    state.syncStatus = payload
                },
                [Store.UPDATE_SHORTCUTS](state, payload) {
                    state.shortcuts = payload
                },
                [Store.UPDATE_NODES](state, payload) {
                    state.nodes = payload
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
        const ticker = connex.thor.ticker()
        let lastHeadId = connex.thor.status.head.id
        let idleTimes = 0
        for (; ;) {
            const status = connex.thor.status
            let flag: Store.Model['syncStatus']['flag']
            if (lastHeadId !== status.head.id) {
                lastHeadId = status.head.id
                idleTimes = 0
                this.commit(Store.UPDATE_CHAIN_HEAD, status.head)
            } else {
                idleTimes++
            }

            if (status.progress === 1) {
                flag = 'synced'
            } else if (idleTimes > 6) {
                flag = 'outOfSync'
            } else {
                flag = 'syncing'
            }
            this.commit(Store.UPDATE_SYNC_STATUS, { progress: status.progress, flag })
            await Promise.race([ticker.next(), sleep(5000)])
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
            const nodes = await GDB.preferences
                .where({ key: 'node' })
                .toArray()
            this.commit(Store.UPDATE_NODES, nodes)
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
