import Vuex from 'vuex'
import WalletStore from './wallets'

export default class RootStore extends Vuex.Store<{}> {
    constructor() {
        super({
            state: {},
            modules: {
                wallets: new WalletStore()
            }
        })
    }
}
