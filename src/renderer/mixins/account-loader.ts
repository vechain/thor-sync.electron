import { Vue, Component, Watch } from 'vue-property-decorator'

@Component
export default class AccountLoader extends Vue {
    public account: Connex.Thor.Account | null = null
    // override it to set address
    get address() { return '' }

    public created() {
        this._reload()
    }

    @Watch('$store.state.chainHead')
    private async _reload() {
        const addr = this.address
        if (addr) {
            try {
                const acc = await connex.thor.account(addr).get()
                if (addr === this.address) {
                    this.account = acc
                }
            } catch (err) {
                LOG.warn('AccountLoader:', `error ${err}`)
            }
        }
    }

    @Watch('address')
    private _addrChanged() {
        this.account = null
        this._reload()
    }
}
