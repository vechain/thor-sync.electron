import Vuex from 'vuex'
import { Vue } from 'vue-property-decorator'
import { EventEmitter } from 'events'
import Preferences from './preferences'

namespace Store {
    export type Model = {
        chainStatus: Connex.Thor.Status
        preferencesRevision: number
        activeViewport: Viewport | null
        preferences: {
            [Preferences.KEY_NETWORKS]: Settings.NetWork[]
            [Preferences.KEY_SHORTCUTS]: Settings.Shortcut[]
            [Preferences.KEY_IS_AUTO_UPDATE]: boolean
        }
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

    public static readonly UPDATE_PREFERENCES_REVISION = 'preferencesRevision'
    public static readonly UPDATE_ACTIVE_VIEW_PORT = 'updateActiveViewPort'

    public static readonly UPDATE_NETWORKS = `update${Preferences.KEY_NETWORKS}`
    public static readonly UPDATE_SHORTCUTS = `update${
        Preferences.KEY_SHORTCUTS
        }`
    public static readonly UPDATE_AUTO_UPDATE = `update${
        Preferences.KEY_IS_AUTO_UPDATE
        }`

    constructor() {
        super({
            state: {
                chainStatus: connex.thor.status,
                preferencesRevision: 0,
                activeViewport: null,
                preferences: {
                    [Preferences.KEY_NETWORKS]: [],
                    [Preferences.KEY_SHORTCUTS]: [],
                    [Preferences.KEY_IS_AUTO_UPDATE]: false
                }
            },
            getters: {
            },
            mutations: {
                [Store.UPDATE_CHAIN_STATUS](state) {
                    state.chainStatus = connex.thor.status
                },
                [Store.UPDATE_PREFERENCES_REVISION](state) {
                    state.preferencesRevision++
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

        this.addHook()
        this.defaultSettings()

        if (ENV.devMode) {
            DB.wallets.count().then(n => {
                if (n === 0) {
                    DB.wallets.put({
                        address: '0xf6e78a5584c06e2dec5c675d357f050a5402a730',
                        name: 'Foo',
                        keystore: JSON.parse(
                            // tslint:disable-next-line:max-line-length
                            '{"address":"f6e78a5584c06e2dec5c675d357f050a5402a730","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"ddbdf9ccf12446fb15a5252d27ff46ae"},"ciphertext":"637cc65de2515c4d9e52b60ffd944de79b5b2adedc322a8d713daf32c592ae53","kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"1449a3cbaf300a030a4f6e7e60dcce9367a3fee5ee9079d7a363c5972bdb14b6"},"mac":"cba0573d099c976213900d4751e8b96eb622c58dc0c2e9b37860db95aeb35081"},"id":"e4e54c43-3935-4541-8e73-66d3C289842F","version":3}'
                        )
                    })
                    DB.wallets.put({
                        address: '0x881abd9fe12319e9353f45ed47472cffb34e375e',
                        name: 'Bar',
                        keystore: JSON.parse(
                            // tslint:disable-next-line:max-line-length
                            '{"version":3,"id":"147a3e15-638a-473b-836d-5c14903acfa3","address":"881abd9fe12319e9353f45ed47472cffb34e375e","crypto":{"kdf":"scrypt","kdfparams":{"dklen":32,"salt":"6239b7ad3b52fb800f83d24e9ba0393df277a79d40e1c71f6e510e231b9aece9","n":262144,"r":8,"p":1},"cipher":"aes-128-ctr","ciphertext":"3bc78973893808f9d05004e95552dcbcc5c3af45cde3983dc7eec533b84858d3","cipherparams":{"iv":"67f1857ec6e19c0907b579535f724c84"},"mac":"7f7722bca47ce99cede34215952d37829bf7a4147d14be263c17ce8b85a58ac6"}}'
                        )
                    })
                    DB.wallets.put({
                        address: '0x40d9b870df290c582f71d48bb208c6fa275ac6be',
                        name: 'Baz',
                        keystore: JSON.parse(
                            // tslint:disable-next-line:max-line-length
                            '{"version":3,"id":"3efc9991-b02c-4615-bb66-87ddecbeac95","address":"40d9b870df290c582f71d48bb208c6fa275ac6be","crypto":{"kdf":"scrypt","kdfparams":{"dklen":32,"salt":"1b6ace1df4c3696cb47fb743186333a3e3860353f287f64f518e2fb024e65c3c","n":262144,"r":8,"p":1},"cipher":"aes-128-ctr","ciphertext":"f27d7546182e8be49f400150f92352babe165299e0ce08a81d4def441591d24e","cipherparams":{"iv":"4e7ab13269770caf71fc68a230ddc963"},"mac":"876edfd59def69b73baabfaa5d01f96cfa7ba38e60dc5c98fc637f815b3a1760"}}'
                        )
                    })
                }
            })
        }

        this.monitorChain()
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
    private defaultSettings() {
        DB.preferences
            .where('key')
            .equals(Preferences.KEY_IS_AUTO_UPDATE)
            .count()
            .then(n => {
                if (n === 0) {
                    DB.preferences.put({
                        key: Preferences.KEY_IS_AUTO_UPDATE,
                        value: false
                    })
                }
            })
    }
    private addHook() {
        let _this = this
        DB.preferences.hook('creating').subscribe(function () {
            _this.commit(Store.UPDATE_PREFERENCES_REVISION)
        })
        DB.preferences.hook('deleting').subscribe(function () {
            _this.commit(Store.UPDATE_PREFERENCES_REVISION)
        })
        DB.preferences.hook('updating').subscribe(function () {
            _this.commit(Store.UPDATE_PREFERENCES_REVISION)
        })
    }
}

export default Store
