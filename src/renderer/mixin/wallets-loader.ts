import { Vue, Component } from 'vue-property-decorator'
import { Entities } from '../database'

@Component
export default class WalletsLoader extends Vue {
    public wallets: Entities.Wallet[] = []
    public walletsLoading = false

    private _unsubscribe !: () => void

    public created() {
        this.loadWallets()
        this._unsubscribe = DB.subscribe(DB.wallets.name, () => {
            this.loadWallets()
        }).unsubscribe
    }

    public destroyed() {
        this._unsubscribe()
    }

    private async loadWallets() {
        try {
            this.walletsLoading = true
            this.wallets = await DB.wallets.toArray()
        } catch (err) {
            // tslint:disable-next-line:no-console
            console.warn(err)
        } finally {
            this.walletsLoading = false
        }
    }
}
