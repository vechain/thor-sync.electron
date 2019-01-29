import * as NodeUrl from 'url'
import { EventEmitter } from 'events'
import { Cache } from './cache'
import { Bloom } from 'thor-devkit'
import { Net } from './net'
import * as compareVersions from 'compare-versions'
import { TxQueue } from './tx-queue'

class NotValidNode extends Error {
    constructor(cause: string) {
        if (cause) {
            super(`not a valid VeChain node [${cause}]`)
        } else {
            super(`not a valid VeChain node`)
        }
    }
}

export class Node {
    public static async discoverNode(url: string) {
        const resp = await Net.request({
            method: 'GET',
            url: NodeUrl.resolve(url, '/blocks/0')
        })
        if (resp.statusCode < 200 || resp.statusCode >= 300) {
            throw new NotValidNode(`${resp.statusCode} ${resp.statusMessage}`)
        }

        let genesis: any

        try {
            genesis = JSON.parse(resp.body.toString('utf8')) || {}
        } catch {
            genesis = {}
        }

        // TODO full validation
        if (genesis && !/^0x[0-9a-f]{64}$/i.test(genesis.id)) {
            throw new NotValidNode('malformed response')
        }

        const ver = (resp.headers['x-thorest-ver'] || [])[0] || '0.0.0'
        if (compareVersions(ver, '1.1.0') < 0) {
            throw new NotValidNode(`version too low(excepted >=1.1.0, got ${ver})`)
        }
        return genesis
    }


    public readonly cache = new Cache()
    public headBlock: Connex.Thor.Block | Beat
    public readonly txQueue: TxQueue
    public readonly net: Net

    private readonly emitter = new EventEmitter()

    private timer: any
    private stop = false


    constructor(readonly config: NodeConfig) {
        this.headBlock = config.genesis
        this.emitter.setMaxListeners(0)
        this.net = new Net(config)
        this.txQueue = new TxQueue(this.net)
        this.scheduleHttp(0)
    }

    public close() {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }
        this.stop = true
    }

    public nextTick() {
        return new Promise<void>(resolve => {
            this.emitter.once('next', () => {
                resolve()
            })
        })
    }

    public get genesis() { return this.config.genesis }
    public get head(): Connex.Thor.Status['head'] {
        return {
            id: this.headBlock.id,
            number: this.headBlock.number,
            timestamp: this.headBlock.timestamp,
            parentID: this.headBlock.parentID
        }
    }

    public get progress() {
        const nowTs = Date.now()
        const bestTs = this.headBlock.timestamp * 1000
        if (nowTs - bestTs < 30 * 1000) {
            return 1
        }
        const genesisTs = this.config.genesis.timestamp * 1000
        const p = (bestTs - genesisTs) / (nowTs - genesisTs)
        return p < 0 ? NaN : p
    }

    public beat(b: Beat) {
        if (b.obsolete) {
            return
        }
        if (b.id === this.headBlock.id) {
            return
        }
        this.headBlock = b

        this.cache.advance(this.head, new Bloom(b.k, Buffer.from(b.bloom.slice(2), 'hex')))
        this.emitter.emit('next')
        this.scheduleHttp(60 * 1000)
    }

    private scheduleHttp(afterMs: number) {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }

        if (this.stop) {
            return
        }

        this.timer = setTimeout(async () => {
            try {
                const best = await this.net.get<Connex.Thor.Block>('blocks/best')
                if (flag === this.timer) {
                    if (best.id !== this.headBlock.id) {
                        this.headBlock = best
                        this.cache.advance(this.head, undefined, best)

                        this.emitter.emit('next')
                    }
                    this.scheduleHttp(5 * 1000)
                }
            } catch (err) {
                if (flag === this.timer) {
                    this.scheduleHttp(20 * 1000)
                }
            }

        }, afterMs)
        const flag = this.timer
    }
}
