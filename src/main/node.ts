import Axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { Agent as HttpAgent } from 'http'
import { Agent as HttpsAgent } from 'https'
import * as NodeUrl from 'url'
import * as WebSocket from 'ws'
import * as QS from 'qs'
import { EventEmitter } from 'events'
import { sleep } from '@/common/sleep'

export class Agent {
    public readonly http: HttpAgent
    public readonly https: HttpsAgent

    constructor(opts: { maxSocket: number }) {
        this.http = new HttpAgent({ maxSockets: opts.maxSocket, keepAlive: true })
        this.https = new HttpsAgent({ maxSockets: opts.maxSocket, keepAlive: true })
    }

    public destroy() {
        this.http.destroy()
        this.https.destroy()
    }
}

export namespace Agent {
    export type Options = {
        maxSocket: number
    }
}

class Wire implements Thor.Wire {
    private readonly axios: AxiosInstance
    constructor(
        private readonly config: Thor.Node.Config,
        private readonly agent: Agent
    ) {
        this.axios = Axios.create({
            timeout: 10 * 1000,
            validateStatus: status => status >= 200 && status < 300,
            httpAgent: agent.http,
            httpsAgent: agent.https,
            headers: { 'x-genesis-id': config.genesis.id }
        })
    }

    public async get<T>(path: string, query?: object): Promise<T> {
        const url = this.resolve(path, query)
        try {
            const result = await this.axios.get<T>(url)
            this.log(result)
            return result.data
        } catch (err) {
            this.log(err)
            throw err
        }
    }

    public async post<T>(path: string, data: object, query?: object): Promise<T> {
        const url = this.resolve(path, query)
        try {
            const result = await this.axios.post<T>(url, data)
            this.log(result)
            return result.data
        } catch (err) {
            this.log(err)
            throw err
        }

    }

    public ws(path: string, query?: object) {
        const url = this.resolve(path, query)
        const parsed = NodeUrl.parse(url)
        parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
        const ws = new WebSocket(NodeUrl.format(parsed), {
            agent: parsed.protocol === 'wss:' ? this.agent.https : this.agent.http,
            headers: { 'x-genesis-id': this.config.genesis.id }
        })
        return {
            read() {
                return new Promise((resolve, reject) => {
                    if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
                        return reject(new Error('closing or closed'))
                    }
                    if ((ws as any)._socket) {
                        (ws as any)._socket.resume()
                    }

                    const timeout = setTimeout(() => {
                        reject(new Error('read timeout'))
                        ws.removeListener('error', onError)
                        ws.removeListener('close', onClose)
                        ws.removeListener('message', onMsg)
                    }, 60 * 1000)

                    const onMsg = (msg: WebSocket.Data) => {
                        if ((ws as any)._socket) {
                            (ws as any)._socket.pause()
                        }
                        resolve(msg)
                        ws.removeListener('error', onError)
                        ws.removeListener('close', onClose)
                        clearTimeout(timeout)
                    }
                    const onError = (err: Error) => {
                        reject(err)
                        ws.removeListener('message', onMsg)
                        ws.removeListener('close', onClose)
                        clearTimeout(timeout)
                    }
                    const onClose = () => {
                        reject(new Error('closed'))
                        ws.removeListener('message', onMsg)
                        ws.removeListener('error', onError)
                        clearTimeout(timeout)
                    }
                    ws.once('message', onMsg)
                        .once('error', onError)
                        .once('close', onClose)
                })
            },
            close() {
                ws.close()
            }
        }
    }

    private resolve(
        path: string,
        query?: object): string {
        let qs = QS.stringify(query)
        if (qs) {
            qs = '?' + qs
        }
        return NodeUrl.resolve(this.config.url, `${path}${qs}`)
    }

    private log(obj: AxiosResponse | AxiosError) {
        const msg = obj.config ? `${obj.config.method} ${obj.config.url}` : ''
        if (obj instanceof Error) {
            if (obj.response) {
                // tslint:disable-next-line:no-console
                console.warn(`${msg}\n  -> ${obj.response.status} ${obj.response.data}`)
            } else {
                // tslint:disable-next-line:no-console
                console.warn(`${msg}\n  -> ${obj.message}`)
            }
        } else {
            // tslint:disable-next-line:no-console
            console.log(`${msg}\n  -> ${obj.status}`)
        }
    }
}

export class Node implements Thor.Node {
    public readonly innerWire: Wire
    private beat: Beat
    private readonly emitter = new EventEmitter()
    private stop = false

    constructor(
        readonly config: Thor.Node.Config,
        readonly agent: Agent
    ) {
        this.beat = {
            number: config.genesis.number,
            id: config.genesis.id,
            parentID: config.genesis.parentID,
            timestamp: config.genesis.timestamp,
            bloom: '',
            k: 0
        }
        this.emitter.setMaxListeners(0)
        this.innerWire = new Wire(config, agent)
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

    public get status(): Connex.Thor.Status {
        return {
            progress: this.progress,
            head: {
                id: this.beat.id,
                number: this.beat.number,
                timestamp: this.beat.timestamp,
                parentID: this.beat.parentID,
            }
        }
    }

    public fork(wireAgent: Agent): Thor.Node {
        const _this = this
        return {
            get config() {
                return _this.config
            },

            get status() {
                return _this.status
            },
            nextTick: () => _this.nextTick(),
            createWire: () => new Wire(_this.config, wireAgent)
        }
    }

    public createWire() {
        return new Wire(this.config, this.agent)
    }

    private get progress() {
        const nowTs = Date.now()
        const bestTs = this.beat.timestamp * 1000
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
                    const beat = JSON.parse((await ws.read()).toString())
                    if (beat.id !== this.beat.id) {
                        this.beat = beat
                    }
                    this.emitter.emit('next')
                    continue
                } catch (err) {
                    // tslint:disable-next-line:no-console
                    console.warn('subscribe block:', err)
                    ws.close()
                    ws = undefined
                    if (!this.stop) {
                        await sleep(10 * 1000)
                    }
                }
            } else {
                const now = Date.now()
                if (now - this.beat.timestamp * 1000 < 30 * 1000) {
                    ws = this.innerWire.ws('subscriptions/beat')
                } else {
                    try {
                        const best = (await this.innerWire.get<Connex.Thor.Block | null>('blocks/best'))!
                        if (best.id !== this.beat.id) {
                            this.beat.number = best.number
                            this.beat.id = best.id
                            this.beat.parentID = best.parentID
                            this.beat.timestamp = best.timestamp
                            this.beat.bloom = ''
                            this.beat.k = 0

                            this.emitter.emit('next')
                            continue
                        }
                        if (!this.stop) {
                            await sleep(2 * 1000)
                        }
                    } catch (err) {
                        if (!this.stop) {
                            await sleep(10 * 1000)
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
    if (!resp.data) {
        throw new Error('invalid response: expected object')
    }
    if (!/^0x[0-9a-f]{64}$/i.test(resp.data.id)) {
        throw new Error('invalid response: id expected bytes32')
    }
    return resp.data
}


type Beat = {
    number: number
    id: string
    parentID: string
    timestamp: number

    bloom: string
    k: number
}
