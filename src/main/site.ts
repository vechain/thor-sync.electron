import { Agent } from 'http'
import Axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import * as URL from 'url'
import * as QS from 'qs'
import * as WebSocket from 'ws'
import { EventEmitter } from 'events'
import { Lazy } from '@/common/deferred'

class Wire implements Connex.Thor.Site.Wire {
    private readonly axios: AxiosInstance
    constructor(
        private readonly config: Connex.Thor.Site.Config,
        private readonly agent?: Agent) {
        this.axios = Axios.create({
            validateStatus: status => status >= 200 && status < 300,
            httpAgent: agent,
            headers: { 'x-genesis-id': config.genesis.id }
        })
        this.axios.interceptors.response.use(response => {
            this.log(response)
            return response
        }, (err: AxiosError) => {
            this.log(err)
            return err
        })
    }

    public async get<T>(path: string, query?: object): Promise<T> {
        const url = this.resolve(path, query)
        const result = await this.axios.get<T>(url)
        return result.data
    }
    public async post<T>(path: string, data: object, query?: object): Promise<T> {
        const url = this.resolve(path, query)
        const result = await this.axios.post<T>(url, data)
        return result.data
    }

    public ws(path: string, query?: object): Connex.Thor.Site.WebSocket {
        const url = this.resolve(path, query)
        const parsed = URL.parse(url)
        parsed.protocol = parsed.protocol === 'https' ? 'wss' : 'ws'
        const ws = new WebSocket(URL.format(parsed), {
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
        return URL.resolve(this.config.url, `${path}${qs}`)
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
            console.log(`${msg}\n  -> ${obj.status} ${obj.data}`)
        }
    }
}

export class Site implements Connex.Thor.Site {
    private bestBlock: Connex.Thor.Block
    private readonly emitter = new EventEmitter()
    private readonly agent: Agent
    private stop = false

    constructor(
        readonly config: Connex.Thor.Site.Config,
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
        return new Lazy<void>(resolve => {
            this.emitter.once('next', () => {
                resolve()
            })
        })
    }

    public get status(): Connex.Thor.Status {
        const _this = this
        return {
            get progress() {
                const nowTs = Date.now()
                const bestTs = _this.bestBlock.timestamp * 1000
                if (nowTs - bestTs < 30 * 1000) {
                    return 1
                }
                const genesisTs = _this.config.genesis.timestamp * 1000
                const progress = (bestTs - genesisTs) / (nowTs - genesisTs)
                return progress < 0 ? NaN : progress
            },
            head: {
                id: _this.bestBlock.id,
                number: _this.bestBlock.number,
                timestamp: _this.bestBlock.timestamp
            }
        }
    }

    public withWireAgent(agent?: Agent): Connex.Thor.Site {
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

    private async loop() {
        const wire = new Wire(this.config, this.agent)
        let ws: Connex.Thor.Site.WebSocket | undefined
        while (!this.stop) {
            if (ws) {
                try {
                    this.bestBlock = JSON.parse((await ws.read()).toString())
                    this.emitter.emit('next')
                } catch (e) {
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
                    } catch (e) {
                        if (!this.stop) {
                            await sleep(10 * 1000)
                        }
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
