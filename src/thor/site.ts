
import { Agent } from 'http'
import Axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import * as NodeUrl from 'url'
import * as WebSocket from 'ws'
import * as QS from 'qs'
import { EventEmitter } from 'events'
import { sleep } from '@/common/sleep'


class Wire implements Thor.Wire {
    private readonly axios: AxiosInstance
    constructor(
        private readonly config: Thor.SiteConfig,
        private readonly agent?: Agent) {
        this.axios = Axios.create({
            validateStatus: status => status >= 200 && status < 300,
            httpAgent: agent,
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

    public ws(path: string, query?: object): Thor.WS {
        const url = this.resolve(path, query)
        const parsed = NodeUrl.parse(url)
        parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
        const ws = new WebSocket(NodeUrl.format(parsed), {
            agent: this.agent,
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

                    const onMsg = (msg: WebSocket.Data) => {
                        if ((ws as any)._socket) {
                            (ws as any)._socket.pause()
                        }
                        resolve(msg)
                        ws.removeListener('error', onError)
                        ws.removeListener('close', onClose)
                    }
                    const onError = (err: Error) => {
                        reject(err)
                        ws.removeListener('message', onMsg)
                        ws.removeListener('close', onClose)
                    }
                    const onClose = () => {
                        reject(new Error('closed'))
                        ws.removeListener('message', onMsg)
                        ws.removeListener('error', onError)
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
        const msg = `${obj.config.method} ${obj.config.url}`
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

export class Site {
    private bestBlock: Connex.Thor.Block
    private readonly emitter = new EventEmitter()
    private readonly agent: Agent
    private stop = false

    constructor(
        readonly config: Thor.SiteConfig,
        agent?: Agent
    ) {
        this.bestBlock = config.genesis
        this.emitter.setMaxListeners(2 ** 32 - 1)
        this.agent = agent || new Agent({ maxSockets: 20 })
        this.loop()
    }

    public shutdown() {
        if (this.stop) {
            return
        }
        this.stop = true
        this.agent.destroy()
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
                id: this.bestBlock.id,
                number: this.bestBlock.number,
                timestamp: this.bestBlock.timestamp
            }
        }
    }

    public withWireAgent(agent?: Agent) {
        const overriddenCreateWire = () => {
            return new Wire(this.config, agent)
        }
        const nameOfCreateWire = this.createWire.name

        return new Proxy(this, {
            get(target, key, receiver) {
                if (key === nameOfCreateWire) {
                    return overriddenCreateWire
                }
                return Reflect.get(target, key, receiver)
            }
        })
    }

    public createWire() {
        return new Wire(this.config, this.agent)
    }

    private get progress() {
        const nowTs = Date.now()
        const bestTs = this.bestBlock.timestamp * 1000
        if (nowTs - bestTs < 30 * 1000) {
            return 1
        }
        const genesisTs = this.config.genesis.timestamp * 1000
        const p = (bestTs - genesisTs) / (nowTs - genesisTs)
        return p < 0 ? NaN : p
    }

    private async loop() {
        const wire = new Wire(this.config, this.agent)
        let ws: Thor.WS | undefined
        while (!this.stop) {
            const lastProgress = this.progress
            if (ws) {
                try {
                    this.bestBlock = JSON.parse((await ws.read()).toString())
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
                if (now - this.bestBlock.timestamp * 1000 < 30 * 1000) {
                    ws = wire.ws('subscriptions/block')
                } else {
                    try {
                        const best = await wire.get<Connex.Thor.Block | null>('blocks/best')
                        if (best!.number !== this.bestBlock.number) {
                            this.bestBlock = best!
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

            if (this.progress !== lastProgress) {
                this.emitter.emit('next')
            }
        }
    }
}
