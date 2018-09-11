
import { Agent } from 'http'
import Axios, { AxiosInstance } from 'axios'
import * as URL from 'url'
import * as QS from 'qs'
import * as WebSocket from 'ws'
import { EventEmitter } from 'events'

class WireImpl implements Network.Wire {
    private readonly axios: AxiosInstance
    constructor(
        readonly url: string,
        private readonly genesisId: string,
        private readonly agent?: Agent) {
        this.axios = Axios.create({
            validateStatus: status => status >= 200 && status < 300,
            httpAgent: agent,
            headers: { 'x-genesis-id': genesisId }
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

    public ws(path: string, query?: object): Network.WebSocket {
        const url = this.resolve(path, query)
        const parsed = URL.parse(url)
        parsed.protocol = parsed.protocol === 'https' ? 'wss' : 'ws'
        const ws = new WebSocket(URL.format(parsed), {
            agent: this.agent,
            headers: { 'x-genesis-id': this.genesisId }
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
        return URL.resolve(this.url, `${path}${qs}`)
    }
}

export class NetworkImpl implements Network {
    public bestBlock: Connex.Thor.Block
    private readonly emitter = new EventEmitter()
    private readonly wire: Network.Wire

    constructor(
        readonly url: string,
        readonly genesisBlock: Connex.Thor.Block,
        private readonly agent?: any
    ) {
        this.bestBlock = genesisBlock
        this.wire = new WireImpl(url, genesisBlock.id, agent)
        this.emitter.setMaxListeners(2 ** 32 - 1)
        this.loop()
    }

    public nextTick() {
        return new Promise<void>(resolve => {
            this.emitter.once('next', () => {
                resolve()
            })
        })
    }

    public withWireAgent(agent?: any): Network {
        const overriddenCreateWire = () => {
            return new WireImpl(this.url, this.genesisBlock.id, agent)
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
        return new WireImpl(this.url, this.genesisBlock.id, this.agent)
    }

    private async loop() {
        let ws: Network.WebSocket | undefined
        for (; ;) {
            if (ws) {
                try {
                    this.bestBlock = JSON.parse((await ws.read()).toString())
                    this.emitter.emit('next')
                } catch (e) {
                    ws.close()
                    ws = undefined
                    await sleep(10 * 1000)
                }
            } else {
                const now = Date.now()
                if (now - this.bestBlock.timestamp * 1000 < 30 * 1000) {
                    ws = this.wire.ws('subscriptions/block')
                } else {
                    try {
                        const best = await this.wire.get<Connex.Thor.Block | null>('blocks/best')
                        if (best!.number !== this.bestBlock.number) {
                            this.bestBlock = best!
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
