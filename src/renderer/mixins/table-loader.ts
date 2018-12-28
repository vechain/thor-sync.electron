import { Vue, Component, Watch } from 'vue-property-decorator'
import { Table } from '../database'

@Component
export default class TableLoader<T, Key> extends Vue {
    public table!: Table<T, Key>
    public rows: T[] = []
    public loading = false

    private _unsubscribe !: () => void
    public filter = () => Promise.resolve<T[]>([])


    public created() {
        this._unsubscribe = this.table.subscribe(() => {
            this._query()
        }).unsubscribe
        this._query()
    }
    public destroyed() {
        this._unsubscribe()
    }

    @Watch('filter')
    private filterChanged() {
        this.rows = []
        this._query()
    }

    private async _query() {
        try {
            this.loading = true
            this.rows = await this.filter()
        } catch (err) {
            // tslint:disable-next-line:no-console
            console.warn(err)
        } finally {
            this.loading = false
        }
    }
}
