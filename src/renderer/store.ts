import Vuex from 'vuex'
import { sleep } from '@/common/sleep'
import { remote } from 'electron'
import Vue from 'vue'
import { cry } from 'thor-devkit'
import env from '@/env'

namespace Store {
    export type Model = {
        chainHead: Connex.Thor.Status['head']
        syncStatus: {
            progress: number
            flag: 'synced' | 'syncing' | 'outOfSync'
        }
        txResendTime: { [id: string]: number }
        shortcuts: entities.Shortcut[]
        nodes: entities.Node[]
        wallets: entities.Wallet[]
        ledgers: entities.LedgerDevice[]
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
    public static readonly UPDATE_TX_RESEND_TIME = 'updateTxResendTime'
    public static readonly UPDATE_LEDGER_DEVICES = 'updateLedgerDevices'

    constructor() {
        super({
            state: {
                chainHead: connex.thor.status.head,
                syncStatus: {
                    progress: connex.thor.status.progress,
                    flag: 'syncing'
                },
                txResendTime: {},
                shortcuts: [],
                nodes: [],
                ledgers: [],
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
                explorer(state) {
                    return state.preferences['explorer'] || (env.devMode ? 'insight' : 'vechain-explorer')
                },
                darkTheme(state) {
                    const value = state.preferences['dark-theme']
                    return value === undefined ?
                        (remote.app.EXTENSION.mainSettings.get('dark-theme') || false) : value as boolean
                },
                lastSigner(state) {
                    return state.preferences[connex.thor.genesis.id + '-lastSigner']
                },
                ledgerAccounts(state) {
                    return state.ledgers.map((item: entities.LedgerDevice) => {
                        const accounts: string[] = []
                        const pub = Buffer.from(item.publicKey, 'hex')
                        const chainCode = Buffer.from(item.chainCode, 'hex')
                        const hdNode = cry.HDNode.fromPublicKey(pub, chainCode)
                        for (let i = 0; i < 5; i++) {
                            accounts.push(hdNode.derive(i).address)
                        }
                        return {
                            ...item,
                            accounts
                        }
                    })
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
                [Store.UPDATE_LEDGER_DEVICES](state, payload) {
                    state.ledgers = payload
                },
                [Store.UPDATE_PREFERENCES](state, payload: entities.Preference[]) {
                    const prefs = {} as typeof state.preferences
                    payload.forEach(i => prefs[i.key] = i.value)
                    state.preferences = prefs
                },
                [Store.UPDATE_SET_READY](state) {
                    state.ready = true
                },
                [Store.UPDATE_TX_RESEND_TIME](state, payload) {
                    Vue.set(state.txResendTime, payload.id, payload.value)
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
            this.commit(Store.UPDATE_WALLETS, wallets)
        }
        const queryAndUpdatePreferences = async () => {
            const prefs = await PREFS.store.toArray()
            this.commit(Store.UPDATE_PREFERENCES, prefs)
        }

        const queryAndUpdateLedgerDevices = async () => {
            const ledgers = await LDDB.devices.toArray()
            this.commit(Store.UPDATE_LEDGER_DEVICES, ledgers)
        }

        await Promise.all([
            queryAndUpdateShortcuts(),
            queryAndUpdateNodes(),
            queryAndUpdateWallets(),
            queryAndUpdatePreferences(),
            queryAndUpdateLedgerDevices()
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

        LDDB.devices.subscribe(() => {
            queryAndUpdateLedgerDevices()
        })
    }
}

export default Store
