
import Thor = Connex.Thor
import { create as createBlockVisitor } from './thor/block-visitor'
import { create as createSubs } from './thor/subscription'
import { EventEmitter } from 'events'

export class Network implements NetworkInterface {
    public static async create(wire: WireInterface) {
        const genesis = await createBlockVisitor(wire, 0).get()
        return new Network(genesis!, wire)
    }

    private _best: Thor.Block
    private readonly emitter: EventEmitter

    constructor(private readonly _genesis: Thor.Block, private readonly wire: WireInterface) {
        this._best = _genesis
        this.emitter = new EventEmitter()
        this.emitter.setMaxListeners(2 ** 32 - 1)
        this.loop()
    }

    public get genesis() {
        return JSON.parse(JSON.stringify(this._genesis))
    }

    public get best() {
        return JSON.parse(JSON.stringify(this._best))
    }

    public nextTick() {
        return new Promise<void>(resolve => {
            this.emitter.once('next', () => {
                resolve()
            })
        })
    }

    private async loop() {
        let subs: Thor.Subscription<'block'> | undefined
        for (; ;) {
            if (subs) {
                try {
                    this._best = await subs.next()
                    this.emitter.emit('next')
                } catch (e) {
                    subs.unsubscribe()
                    subs = undefined
                    await sleep(10 * 1000)
                }
            } else {
                const now = Date.now()
                if (now - this.best.timestamp * 1000 < 30 * 1000) {
                    subs = createSubs(this.wire, 'block', {})
                } else {
                    try {
                        const best = await createBlockVisitor(this.wire, 'best').get()
                        if (best!.number !== this._best.number) {
                            this._best = best!
                            this.emitter.emit('next')
                        }
                        await sleep(2 * 1000)
                    } catch (e) {
                        await sleep(10 * 1000)
                    }
                }
            }
        }
    }
}

function sleep(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}
