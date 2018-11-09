import { Vue, Component, Watch } from 'vue-property-decorator'
import { Entities } from '../database'

@Component
export default class TxRecordsLoader extends Vue {
    public records: Entities.TxRecord[] = []
    public loading = false
    private _unsubscribe!: () => void

    public filter: () => Promise<Entities.TxRecord[]> = () => Promise.resolve([])
    public created() {
        this._unsubscribe = DB.subscribe(DB.txRecords.name, () => this.query()).unsubscribe
        this.query()
    }

    public destroyed() {
        this._unsubscribe()
    }

    @Watch('filter')
    private filterChanged() {
        this.records = []
        this.query()
    }

    private async query() {
        try {
            this.loading = true
            this.records = await this.filter()
        } catch (err) {
            // tslint:disable-next-line:no-console
            console.warn(err)
        } finally {
            this.loading = false
        }
    }
}
