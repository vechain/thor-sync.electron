import Vuex from 'vuex'
import { sleep } from '@/common/sleep'
import { remote } from 'electron'

namespace Store {
    export type Model = {
        chainHead: Connex.Thor.Status['head']
        syncStatus: {
            progress: number
            flag: 'synced' | 'syncing' | 'outOfSync'
        }
        shortcuts: entities.Shortcut[]
        nodes: entities.Node[]
        wallets: entities.Wallet[]
        preferences: { [key: string]: any }
        ready: boolean
    }
}

class Store extends Vuex.Store<Store.Model> {
    public static readonly UPDATE_CHAIN_HEAD = 'updateChainHead'
    public static readonly UPDATE_SYNC_STATUS = 'updateSyncStatus'
    public static readonly UPDATE_SHORTCUTS = 'updateShortcuts'
    public static readonly UPDATE_NODES = 'updateNodes'
    public static readonly UPDATE_WALLETS = 'updateWallets'
    public static readonly UPDATE_PREFERENCES = 'updatePreferences'
    public static readonly UPDATE_SET_READY = 'updateSetReady'

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
                wallets: [],
                preferences: {},
                ready: false,
            },
            getters: {
                AppHunItems(state) {
                    const list = (state.preferences['app-list'] || []) as entities.AppHubItem[]
                    return list.map(
                        item => {
                            return {
                                ...item,
                                img: `https://vechain.github.io/app-hub/imgs/${
                                    item.id
                                    }.png`
                            }
                        }
                    )
                },
                darkTheme(state) {
                    const value = state.preferences['dark-theme']
                    return value === undefined ?
                        (remote.app.EXTENSION.mainSettings.get('dark-theme') || false) : value as boolean
                }
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
                },
                [Store.UPDATE_PREFERENCES](state, payload: entities.Preference[]) {
                    const prefs = {} as typeof state.preferences
                    payload.forEach(i => prefs[i.key] = i.value)
                    state.preferences = prefs
                },
                [Store.UPDATE_SET_READY](state) {
                    state.ready = true
                }
            }
        })
        this.monitorChain()
        this.monitorDB()
        this.monitorAppHub()
    }

    private async monitorAppHub() {
        const updateAppList = async () => {
            try {
                const resp = await fetch('https://vechain.github.io/app-hub/sync.json')
                if (resp.status !== 200) {
                    return
                }
                const list = await resp.json()
                PREFS.store.put({ key: 'app-list', value: list })
            } catch (error) {
                LOG.warn('failed to fetch app list', error)
            }
        }

        await updateAppList()

        // 6 Hours
        setInterval(() => {
            updateAppList()
        }, 216e5)
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
            this.commit(Store.UPDATE_SYNC_STATUS, {
                progress: status.progress,
                flag
            })
            await Promise.race([ticker.next(), sleep(5000)])
        }
    }

    private async monitorDB() {
        const queryAndUpdateShortcuts = async () => {
            const shortcuts = await GDB.shortcuts.toArray()
            this.commit(Store.UPDATE_SHORTCUTS, shortcuts)
        }
        const queryAndUpdateNodes = async () => {
            const nodes = await GDB.nodes.toArray()
            this.commit(Store.UPDATE_NODES, nodes)
        }

        const queryAndUpdateWallets = async () => {
            const wallets = await BDB.wallets.toArray()
            remote.app.EXTENSION.setOwnedWallets(
                remote.getCurrentWindow().id,
                wallets.map(w => w.address)
            )
            this.commit(Store.UPDATE_WALLETS, wallets)
        }
        const queryAndUpdatePreferences = async () => {
            const prefs = await PREFS.store.toArray()
            this.commit(Store.UPDATE_PREFERENCES, prefs)
        }

        await Promise.all([
            queryAndUpdateShortcuts(),
            queryAndUpdateNodes(),
            queryAndUpdateWallets(),
            queryAndUpdatePreferences()
        ])

        this.commit(Store.UPDATE_SET_READY)

        GDB.nodes.subscribe(() => {
            queryAndUpdateNodes()
        })
        GDB.shortcuts.subscribe(() => {
            queryAndUpdateShortcuts()
        })
        BDB.wallets.subscribe(() => {
            queryAndUpdateWallets()
        })
        PREFS.store.subscribe(() => {
            queryAndUpdatePreferences()
        })
    }
}

export default Store
