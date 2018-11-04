import { Vue, Component, Watch } from 'vue-property-decorator'
import { Entities } from '../database'

@Component
export default class WalletsLoader extends Vue {
    public wallets: Entities.Wallet[] = []

    public loading = false
    public limit = {
        offset: 0,
        count: 10
    }

    private _unsubscribe !: () => void
    public created() {
        this._unsubscribe = DB.subscribe(DB.wallets.name, () => this.query()).unsubscribe
        this.query()
    }

    public destroyed() {
        this._unsubscribe()
    }


    @Watch('limit')
    private limitChanged() {
        this.wallets = []
        this.query()
    }

    private async query() {
        if (this.limit.count > 0) {
            this.loading = true
            try {
                this.wallets = await DB.wallets
                    .orderBy('id')
                    .offset(this.limit.offset)
                    .limit(this.limit.count)
                    .toArray()
            } catch (err) {
                // tslint:disable-next-line:no-console
                console.warn(err)
            } finally {
                this.loading = false
            }
        }
    }
}
