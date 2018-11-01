import { Vue, Component, Watch } from 'vue-property-decorator'
import { EventEmitter } from 'events'
import { Address } from '@/common/formatter'

@Component
export default class AccountLoader extends Vue {
    public account: Connex.Thor.Account | null = null
    // override it to set address
    get address() { return '' }

    private _untrack?: () => void

    public created() {
        this.track()
    }

    public destroyed() {
        if (this._untrack) {
            this._untrack()
            this._untrack = undefined
        }
    }

    @Watch('address')
    private track() {
        if (this._untrack) {
            this._untrack()
            this._untrack = undefined
        }
        this.account = null
        if (Address.isValid(this.address)) {
            this._untrack = tracker.track(this.address, acc => {
                if (this.account) {
                    Object.assign(this.account, acc)
                } else {
                    this.account = acc
                }
            }).untrack
        }
    }
}

class AccountTracker {
    private readonly tracking = new Map<string, {
        refCount: number
        updateTime: number
        account: Connex.Thor.Account | null
    }>()

    private emitter = new EventEmitter()

    constructor() {
        const ticker = connex.thor.ticker();
        (async () => {
            for (; ;) {
                await ticker.next()

                const tasks: Array<Promise<void>> = []
                // tslint:disable-next-line:forin
                this.tracking.forEach((obj, addr) => {
                    if (obj.refCount > 0) {
                        tasks.push(
                            connex.thor
                                .account(addr)
                                .get()
                                .then(acc => {
                                    obj.account = acc
                                    obj.updateTime = Date.now()
                                })
                                // tslint:disable-next-line:no-console
                                .catch(console.warn))
                    }
                })
                await Promise.all(tasks)
                this.emitter.emit('update')
            }
        })()
    }

    public track(addr: string, cb: (acc: Connex.Thor.Account) => void) {
        let obj = this.tracking.get(addr)
        if (!obj) {
            obj = {
                refCount: 0,
                updateTime: 0,
                account: null
            }
            this.tracking.set(addr, obj)
        }
        obj.refCount++

        if (obj.account) {
            cb(obj.account)
        }

        if (Date.now() > obj.updateTime + 30 * 1000) {
            connex.thor
                .account(addr)
                .get()
                .then(acc => {
                    obj!.account = acc
                    obj!.updateTime = Date.now()
                    cb(acc)
                })
                // tslint:disable-next-line:no-console
                .catch(console.warn)
        }

        const listener = () => {
            if (obj && obj.account) {
                cb(obj.account)

            }
        }

        this.emitter.addListener('update', listener)
        return {
            untrack: () => {
                obj!.refCount--
                this.emitter.removeListener('update', listener)
            }
        }
    }
}

const tracker = new AccountTracker()
