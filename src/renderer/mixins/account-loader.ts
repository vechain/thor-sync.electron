import { Vue, Component, Watch } from 'vue-property-decorator'
import { Address } from '@/common/formatter'
import Deferred from '@/common/deferred'

@Component
export default class AccountLoader extends Vue {
    public account: Connex.Thor.Account | null = null
    // override it to set address
    get address() { return '' }

    public created() {
        this.update()
    }

    @Watch('$store.state.chainStatus')
    @Watch('address')
    private update() {
        if (Address.isValid(this.address)) {
            const addr = this.address.toLowerCase()
            const cached = cache.get(addr)
            if (cached) {
                this.account = { ...cached.account }
                if (cached.headId === connex.thor.status.head.id) {
                    return
                }
            } else {
                this.account = null
            }

            fetcher.fetch(addr).then(acc => {
                cache.set(addr, acc, connex.thor.status.head.id)
                if ((this.address || '').toLowerCase() === addr) {
                    this.account = { ...acc }
                }
            })
                // tslint:disable-next-line:no-console
                .catch(console.warn)

        } else {
            this.account = null
        }
    }

}

class Fetcher {
    private readonly fetching = new Map<string, Array<Deferred<Connex.Thor.Account>>>()

    public fetch(addr: string) {
        const array = this.fetching.get(addr) || []
        this.fetching.set(addr, array)

        const deferred = new Deferred<Connex.Thor.Account>()
        array.push(deferred)

        if (array.length === 1) {
            (async () => {
                try {
                    const account = await connex.thor.account(addr).get()
                    array.forEach(d => d.resolve(account))
                } catch (err) {
                    array.forEach(d => d.reject(err))
                } finally {
                    this.fetching.delete(addr)
                }
            })()
        }
        return deferred
    }
}

class Cache {
    private readonly cache = new Map<string, {
        headId: string
        account: Connex.Thor.Account
    }>()

    public get(addr: string) {
        return this.cache.get(addr)
    }

    public set(addr: string, account: Connex.Thor.Account, headId: string) {
        this.cache.set(addr, {
            account,
            headId
        })
    }
}

const fetcher = new Fetcher()
const cache = new Cache()
