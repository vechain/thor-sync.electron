import Vuex from 'vuex'
import { Vue } from 'vue-property-decorator'
import Wallet from './wallet'
import { EventEmitter } from 'events'


namespace Store {
    export type Model = {
        chainStatus: Connex.Thor.Status
        wallets: Wallet.Entity[]
        accounts: { [address: string]: Account }
    }

    export type Account = {
        data: Connex.Thor.Account | null
        updateTime: number
    }

    export interface WatchedAccount {
        readonly account: Account
        unwatch(): void
    }
}

class Store extends Vuex.Store<Store.Model> {

    public static readonly UPDATE_CHAIN_STATUS = 'updateChainStatus'
    public static readonly UPDATE_WALLETS = 'updateWallets'
    public static readonly UPDATE_ACCOUNT = 'updateAccount'

    constructor() {
        const accountWatcher = new AccountWatcher()
        super({
            state: {
                chainStatus: THOR.status,
                wallets: [],
                accounts: {}
            },
            getters: {
                account(state) {
                    return (addr: string) => {
                        let acc = state.accounts[addr]
                        if (!acc) {
                            acc = { data: null, updateTime: 0 }
                            Vue.set(state.accounts, addr, acc)
                            accountWatcher.requestUpdate(addr)
                        }
                        return accountWatcher.watch(addr, acc)
                    }
                },
            },
            mutations: {
                [Store.UPDATE_CHAIN_STATUS](state) {
                    state.chainStatus = THOR.status
                },
                [Store.UPDATE_WALLETS](state, wallets) {
                    state.wallets = wallets
                },
                [Store.UPDATE_ACCOUNT](state, payload) {
                    const acc = state.accounts[payload.addr]
                    if (acc) {
                        acc.updateTime = Date.now()
                        acc.data = payload.data
                    }
                }
            }
        })

        this.monitorChain()
        this.monitorWallets()
        accountWatcher.run((addr, data) => {
            this.commit(Store.UPDATE_ACCOUNT, { addr, data })
        })
    }


    private async monitorChain() {
        setInterval(() => {
            this.commit(Store.UPDATE_CHAIN_STATUS)
        }, 60 * 1000)

        this.commit(Store.UPDATE_CHAIN_STATUS)
        const ticker = THOR.ticker()
        for (; ;) {
            await ticker.next()
            this.commit(Store.UPDATE_CHAIN_STATUS)
        }
    }

    private monitorWallets() {
        WALLETS.list().then(entries => {
            this.commit(Store.UPDATE_WALLETS, entries)
            // tslint:disable-next-line:no-console
        }).catch(console.log)

        WALLETS.subscribe(() => {
            WALLETS.list().then(entries => {
                this.commit(Store.UPDATE_WALLETS, entries)
                // tslint:disable-next-line:no-console
            }).catch(console.log)
        })
    }
}

class AccountWatcher {
    private readonly refCounts: { [addr: string]: number } = {}
    private emitter = new EventEmitter()

    public watch(addr: string, acc: Store.Account): Store.WatchedAccount {
        if (this.refCounts[addr]) {
            this.refCounts[addr]++
        } else {
            this.refCounts[addr] = 1
        }
        let unwatched = false
        return {
            get account() {
                return acc
            },
            unwatch: () => {
                if (unwatched) {
                    return
                }
                unwatched = true
                this.refCounts[addr]--
            }
        }
    }

    public requestUpdate(addr: string) {
        this.emitter.emit('fetch', addr)
    }

    public run(commit: (addr: string, data: Connex.Thor.Account) => void) {
        this.emitter.on('fetch', (addr: string) => {
            THOR.account(addr).get()
                .then(data => commit(addr, data))
                // tslint:disable-next-line:no-console
                .catch(console.log)
        });
        (async () => {
            const ticker = THOR.ticker()
            for (; ;) {
                await ticker.next()
                // tslint:disable-next-line:forin
                for (const addr in this.refCounts) {
                    if (this.refCounts[addr] > 0) {
                        THOR.account(addr).get()
                            .then(data => commit(addr, data))
                            // tslint:disable-next-line:no-console
                            .catch(console.log)
                    }
                }
            }
        })()
    }
}


export default Store
