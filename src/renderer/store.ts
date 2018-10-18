import Vuex from 'vuex'
import { Vue } from 'vue-property-decorator'
import { EventEmitter } from 'events'
import Preferences from './preferences'
namespace Store {
    export type Model = {
        chainStatus: Connex.Thor.Status
        walletsRevision: number
        accounts: { [address: string]: Account }
        activeViewport: Viewport | null
        preferences: {
            [Preferences.KEY_NETWORKS]: Settings.NetWork[]
            [Preferences.KEY_SHORTCUTS]: Settings.Shortcut[]
            [Preferences.KEY_IS_AUTO_UPDATE]: boolean
        }
    }

    export type Account = {
        data: Connex.Thor.Account | null
        updateTime: number
    }

    export interface TrackedAccount {
        readonly account: Account
        untrack(): void
    }

    export type Viewport = {
        id: number
        domain: string
        title: string
        iconURL: string
    }
}

class Store extends Vuex.Store<Store.Model> {
    public static readonly UPDATE_CHAIN_STATUS = 'updateChainStatus'
    public static readonly UPDATE_WALLETS_REVISION = 'walletsRevision'
    public static readonly UPDATE_ACCOUNT = 'updateAccount'
    public static readonly UPDATE_ACTIVE_VIEW_PORT = 'updateActiveViewPort'

    public static readonly UPDATE_NETWORKS = `update${Preferences.KEY_NETWORKS}`
    public static readonly UPDATE_SHORTCUTS = `update${Preferences.KEY_SHORTCUTS}`
    public static readonly UPDATE_AUTO_UPDATE = `update${Preferences.KEY_IS_AUTO_UPDATE}`


    constructor() {
        const accountTracker = new AccountTracker()
        super({
            state: {
                chainStatus: connex.thor.status,
                walletsRevision: 0,
                accounts: {},
                activeViewport: null,
                preferences: {
                    [Preferences.KEY_NETWORKS]: [],
                    [Preferences.KEY_SHORTCUTS]: [],
                    [Preferences.KEY_IS_AUTO_UPDATE]: false
                }
            },
            getters: {
                account(state) {
                    return (addr: string) => {
                        let acc = state.accounts[addr]
                        if (!acc) {
                            acc = { data: null, updateTime: 0 }
                            Vue.set(state.accounts, addr, acc)
                        }
                        return accountTracker.track(addr, acc)
                    }
                }
            },
            mutations: {
                [Store.UPDATE_CHAIN_STATUS](state) {
                    state.chainStatus = connex.thor.status
                },
                [Store.UPDATE_WALLETS_REVISION](state) {
                    state.walletsRevision++
                },
                [Store.UPDATE_ACCOUNT](state, payload) {
                    const acc = state.accounts[payload.addr]
                    if (acc) {
                        acc.updateTime = Date.now()
                        acc.data = payload.data
                    }
                },
                [Store.UPDATE_ACTIVE_VIEW_PORT](state, viewport) {
                    state.activeViewport = viewport
                },
                [Store.UPDATE_NETWORKS](state, networks) {
                    state.preferences[Preferences.KEY_NETWORKS] = networks
                },
                [Store.UPDATE_SHORTCUTS](state, shortcut) {
                    state.preferences[Preferences.KEY_SHORTCUTS] = shortcut
                },
                [Store.UPDATE_AUTO_UPDATE](state, isAuto) {
                    state.preferences[Preferences.KEY_IS_AUTO_UPDATE] = isAuto
                }
            }
        })


        DB.on('changes', changes => {
            if (changes.some(c => c.table === DB.wallets.name)) {
                this.commit(Store.UPDATE_WALLETS_REVISION)
            }
        })
        if (ENV.devMode) {
            DB.wallets.count().then(n => {
                if (n === 0) {
                    DB.wallets.put({
                        address: '0xf6e78a5584c06e2dec5c675d357f050a5402a730',
                        name: 'Foo',
                        keystore: JSON.parse(
                            '{"address":"f6e78a5584c06e2dec5c675d357f050a5402a730","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"ddbdf9ccf12446fb15a5252d27ff46ae"},"ciphertext":"637cc65de2515c4d9e52b60ffd944de79b5b2adedc322a8d713daf32c592ae53","kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"1449a3cbaf300a030a4f6e7e60dcce9367a3fee5ee9079d7a363c5972bdb14b6"},"mac":"cba0573d099c976213900d4751e8b96eb622c58dc0c2e9b37860db95aeb35081"},"id":"e4e54c43-3935-4541-8e73-66d3C289842F","version":3}'
                        )
                    })
                    DB.wallets.put({
                        address: '0x881abd9fe12319e9353f45ed47472cffb34e375e',
                        name: 'Bar',
                        keystore: JSON.parse(
                            '{"version":3,"id":"147a3e15-638a-473b-836d-5c14903acfa3","address":"881abd9fe12319e9353f45ed47472cffb34e375e","crypto":{"kdf":"scrypt","kdfparams":{"dklen":32,"salt":"6239b7ad3b52fb800f83d24e9ba0393df277a79d40e1c71f6e510e231b9aece9","n":262144,"r":8,"p":1},"cipher":"aes-128-ctr","ciphertext":"3bc78973893808f9d05004e95552dcbcc5c3af45cde3983dc7eec533b84858d3","cipherparams":{"iv":"67f1857ec6e19c0907b579535f724c84"},"mac":"7f7722bca47ce99cede34215952d37829bf7a4147d14be263c17ce8b85a58ac6"}}'
                        )
                    })
                    DB.wallets.put({
                        address: '0x40d9b870df290c582f71d48bb208c6fa275ac6be',
                        name: 'Baz',
                        keystore: JSON.parse(
                            '{"version":3,"id":"3efc9991-b02c-4615-bb66-87ddecbeac95","address":"40d9b870df290c582f71d48bb208c6fa275ac6be","crypto":{"kdf":"scrypt","kdfparams":{"dklen":32,"salt":"1b6ace1df4c3696cb47fb743186333a3e3860353f287f64f518e2fb024e65c3c","n":262144,"r":8,"p":1},"cipher":"aes-128-ctr","ciphertext":"f27d7546182e8be49f400150f92352babe165299e0ce08a81d4def441591d24e","cipherparams":{"iv":"4e7ab13269770caf71fc68a230ddc963"},"mac":"876edfd59def69b73baabfaa5d01f96cfa7ba38e60dc5c98fc637f815b3a1760"}}'
                        )
                    })
                }
            })
        }

        this.monitorChain()
        this.monitorPreferences()
        accountTracker.run((addr, data) => {
            this.commit(Store.UPDATE_ACCOUNT, { addr, data })
        })
    }

    private async monitorChain() {
        setInterval(() => {
            this.commit(Store.UPDATE_CHAIN_STATUS)
        }, 60 * 1000)

        this.commit(Store.UPDATE_CHAIN_STATUS)
        const ticker = connex.thor.ticker()
        for (; ;) {
            await ticker.next()
            this.commit(Store.UPDATE_CHAIN_STATUS)
        }
    }

    private async monitorPreferences() {
        PREFERENCES.subscribe(event => {
            this.commit(`update${event.key}`, PREFERENCES.get(event.key))
        })
        await PREFERENCES.set(Preferences.KEY_NETWORKS, [])
        await PREFERENCES.set(Preferences.KEY_SHORTCUTS, [])
    }
}

class AccountTracker {
    private readonly refCounts: { [addr: string]: number } = {}
    private emitter = new EventEmitter()

    public track(addr: string, acc: Store.Account): Store.TrackedAccount {
        // fetch immediately when account data is null or out of date
        if (!acc.data || Date.now() - acc.updateTime > 60 * 1000) {
            this.emitter.emit('fetch', addr)
        }

        if (this.refCounts[addr]) {
            this.refCounts[addr]++
        } else {
            this.refCounts[addr] = 1
        }
        let tracked = true
        return {
            get account() {
                return acc
            },
            untrack: () => {
                if (!tracked) {
                    return
                }
                tracked = false
                this.refCounts[addr]--
            }
        }
    }

    public run(commit: (addr: string, data: Connex.Thor.Account) => void) {
        this.emitter.on('fetch', (addr: string) => {
            connex.thor
                .account(addr)
                .get()
                .then(data => commit(addr, data))
                // tslint:disable-next-line:no-console
                .catch(console.log)
        });
        (async () => {
            const ticker = connex.thor.ticker()
            for (; ;) {
                await ticker.next()
                // tslint:disable-next-line:forin
                for (const addr in this.refCounts) {
                    if (this.refCounts[addr] > 0) {
                        connex.thor
                            .account(addr)
                            .get()
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
