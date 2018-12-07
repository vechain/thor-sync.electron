import { Vue, Component, Watch } from 'vue-property-decorator'

@Component
export default class TableLoader<T> extends Vue {
    public tableName!: string
    public rows: T[] = []
    public loading = false

    private _unsubscribe !: () => void
    public filter = () => Promise.resolve<T[]>([])


    public created() {
        if (!this.tableName) {
            throw new Error('TableLoader: table name not set')
        }
        this._unsubscribe = (() => {
            if (GDB.tables.some(t => t.name === this.tableName)) {
                return GDB.subscribe(this.tableName, () => this._query()).unsubscribe
            }
            if (BDB.tables.some(t => t.name === this.tableName)) {
                return BDB.subscribe(this.tableName, () => this._query()).unsubscribe
            }
            throw new Error(`unknown table ${this.tableName}`)
        })()
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
