import Axios from 'axios'
import * as NodeUrl from 'url'
import { EventEmitter } from 'events'
import { sleep } from '@/common/sleep'
import { Cache } from './cache'
import { Bloom } from 'thor-devkit'
import { Wire } from './wire'
import { Agent } from './agent'
import * as compareVersions from 'compare-versions'
import { TxQueue } from './tx-queue'

export class Node {
    public static async discoverNode(url: string) {
        const resp = await Axios.get<Connex.Thor.Block>(NodeUrl.resolve(url, '/blocks/0'), {
            validateStatus: status => status >= 200 && status < 300,
        })
        const ver = resp.headers['x-thorest-ver'] || '0.0.0'
        if (compareVersions(ver, '1.1.0') < 0) {
            throw new Error('node version too low')
        }

        if (!resp.data) {
            throw new Error('invalid response: expected object')
        }
        if (!/^0x[0-9a-f]{64}$/i.test(resp.data.id)) {
            throw new Error('invalid response: id expected bytes32')
        }
        return resp.data
    }


    public readonly cache = new Cache()
    public headBlock: Connex.Thor.Block | BeatResponse
    public readonly txQueue: TxQueue

    private readonly emitter = new EventEmitter()
    private readonly wire: Wire
    private stop = false


    constructor(readonly config: NodeConfig) {
        this.headBlock = config.genesis
        this.emitter.setMaxListeners(0)
        this.wire = new Wire(config, new Agent({ maxSocket: 10 }))
        this.txQueue = new TxQueue(this.wire)
        this.loop()
    }

    public close() {
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

    private async loop() {
        let ws: ReturnType<Wire['ws']> | undefined
        while (!this.stop) {
            if (ws) {
                try {
                    const beat = JSON.parse((await ws.read()).toString()) as BeatResponse
                    if (beat.obsolete) {
                        continue
                    }

                    if (beat.id !== this.headBlock.id) {
                        this.headBlock = beat

                        this.cache.advance(this.head, new Bloom(beat.k, Buffer.from(beat.bloom.slice(2), 'hex')))
                        this.emitter.emit('next')
                    }
                } catch (err) {
                    // tslint:disable-next-line:no-console
                    console.warn('subscribe beat:', err)
                    ws.close()
                    ws = undefined
                    if (!this.stop) {
                        await sleep(10 * 1000)
                    }
                }
            } else {
                const now = Date.now()
                if (now - this.headBlock.timestamp * 1000 < 30 * 1000) {
                    ws = this.wire.ws('subscriptions/beat')
                } else {
                    try {
                        const best = (await this.wire.get<Connex.Thor.Block | null>('blocks/best'))!
                        if (best.id !== this.headBlock.id) {
                            this.headBlock = best
                            this.cache.advance(this.head, undefined, best)

                            this.emitter.emit('next')
                            continue
                        }
                        if (!this.stop) {
                            await sleep(5 * 1000)
                        }
                    } catch (err) {
                        if (!this.stop) {
                            await sleep(20 * 1000)
                        }
                    }
                }
            }
        }
    }
}

type BeatResponse = {
    number: number
    id: string
    parentID: string
    timestamp: number

    bloom: string
    k: number
    obsolete: boolean
}
