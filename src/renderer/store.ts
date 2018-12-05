import Vuex from 'vuex'
import { Entities } from './database'

namespace Store {
    export type Model = {
        chainStatus: Connex.Thor.Status
        shortcuts: Array<Entities.Preference<'shortcut'>>
    }
}

class Store extends Vuex.Store<Store.Model> {
    public static readonly UPDATE_CHAIN_STATUS = 'updateChainStatus'
    public static readonly UPDATE_SHORTCUTS = 'updateShortcuts'
    constructor() {
        super({
            state: {
                chainStatus: connex.thor.status,
                shortcuts: []
            },
            getters: {
            },
            mutations: {
                [Store.UPDATE_CHAIN_STATUS](state) {
                    state.chainStatus = connex.thor.status
                },
                [Store.UPDATE_SHORTCUTS](state, payload) {
                    state.shortcuts = payload
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
        const updateShortcuts = async () => {
            const shortcuts = await DB.preferences
                .where({ key: 'shortcut' })
                .toArray()
            this.commit(Store.UPDATE_SHORTCUTS, shortcuts)
        }

        await updateShortcuts()

        DB.subscribe(DB.preferences.name, updateShortcuts)
    }


}

export default Store
