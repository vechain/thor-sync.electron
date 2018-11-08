import { Vue, Component, Watch } from 'vue-property-decorator'
import { Entities } from '../database'

@Component
export default class WalletsLoader extends Vue {
    public wallets: Entities.Wallet[] = []
    public loading = false

    private _unsubscribe !: () => void

    public filter = () => {
        return DB.wallets
            .orderBy('id')
            .toArray()
    }
    public created() {
        this._unsubscribe = DB.subscribe(DB.wallets.name, () => this.query()).unsubscribe
        this.query()
    }

    public destroyed() {
        this._unsubscribe()
    }


    @Watch('filter')
    private filterChanged() {
        this.wallets = []
        this.query()
    }

    private async query() {
        try {
            this.loading = true
            this.wallets = await this.filter()
        } catch (err) {
            // tslint:disable-next-line:no-console
            console.warn(err)
        } finally {
            this.loading = false
        }
    }
}
