import { Vue, Component, Watch } from 'vue-property-decorator'
import { Entities } from '../database'

@Component
export default class TxRecordsLoader extends Vue {
    public records: Entities.TxRecord[] = []
    public loading = false
    public limit = {
        offset: 0,
        count: 0
    }

    private _unsubscribe!: () => void
    public created() {
        this._unsubscribe = DB.subscribe(DB.txRecords.name, () => this.query()).unsubscribe
        this.query()
    }

    public destroyed() {
        this._unsubscribe()
    }

    @Watch('limit')
    private limitChanged() {
        this.records = []
        this.query()
    }

    private async query() {
        if (this.limit.count > 0) {
            this.loading = true
            try {
                this.records = await DB.txRecords
                    .orderBy('insertTime')
                    .reverse()
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
