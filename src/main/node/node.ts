import Axios from 'axios'
import * as NodeUrl from 'url'
import { EventEmitter } from 'events'
import { sleep } from '@/common/sleep'
import { Cache } from './cache'
import { Bloom } from 'thor-devkit'
import { Wire } from './wire'
import { Agent } from './agent'
import * as compareVersions from 'compare-versions'

export class Node implements Thor.Node {
    public readonly innerWire: Wire
    public readonly cache = new Cache()
    public readonly head: Connex.Thor.Status['head']

    private readonly emitter = new EventEmitter()
    private stop = false


    constructor(
        readonly config: NodeConfig,
        readonly agent: Agent
    ) {
        this.head = {
            number: config.genesis.number,
            id: config.genesis.id,
            parentID: config.genesis.parentID,
            timestamp: config.genesis.timestamp,
        }
        this.emitter.setMaxListeners(0)
        this.innerWire = new Wire(this, config, agent)
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

    public get progress() {
        const nowTs = Date.now()
        const bestTs = this.head.timestamp * 1000
        if (nowTs - bestTs < 30 * 1000) {
            return 1
        }
        const genesisTs = this.config.genesis.timestamp * 1000
        const p = (bestTs - genesisTs) / (nowTs - genesisTs)
        return p < 0 ? NaN : p
    }

    public fork(wireAgent: Agent): Thor.Node {
        const _this = this
        return {
            get genesis() { return _this.genesis },
            get head() { return _this.head },
            get progress() { return _this.progress },
            nextTick: () => _this.nextTick(),
            createWire: () => new Wire(_this, _this.config, wireAgent)
        }
    }

    public createWire(): Thor.Wire {
        return new Wire(this, this.config, this.agent)
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

                    if (beat.id !== this.head.id) {
                        this.head.id = beat.id
                        this.head.number = beat.number
                        this.head.parentID = beat.parentID
                        this.head.timestamp = beat.timestamp

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
                if (now - this.head.timestamp * 1000 < 30 * 1000) {
                    ws = this.innerWire.ws('subscriptions/beat')
                } else {
                    try {
                        const best = (await this.innerWire.get<Connex.Thor.Block | null>('blocks/best'))!
                        if (best.id !== this.head.id) {
                            this.head.id = best.id
                            this.head.number = best.number
                            this.head.parentID = best.parentID
                            this.head.timestamp = best.timestamp
                            this.cache.advance(this.head)

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

export async function discoverNode(url: string) {
    const resp = await Axios.get<Connex.Thor.Block>(NodeUrl.resolve(url, '/blocks/0'), {
        validateStatus: status => status >= 200 && status < 300,
    })
    const ver = resp.headers['x-thorest-ver'] as string
    if (compareVersions(ver, '1.1.0') < 0) {
        throw new Error('version too low')
    }

    if (!resp.data) {
        throw new Error('invalid response: expected object')
    }
    if (!/^0x[0-9a-f]{64}$/i.test(resp.data.id)) {
        throw new Error('invalid response: id expected bytes32')
    }
    return resp.data
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
