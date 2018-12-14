import Axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import * as NodeUrl from 'url'
import * as WebSocket from 'ws'
import * as QS from 'qs'
import { Agent } from './agent'

export class Wire implements Thor.Wire {
    private readonly axios: AxiosInstance
    constructor(
        private readonly node: Thor.Node,
        private readonly config: NodeConfig,
        private readonly agent: Agent,
    ) {
        this.axios = Axios.create({
            timeout: 20 * 1000,
            validateStatus: status => status >= 200 && status < 300,
            httpAgent: agent.http,
            httpsAgent: agent.https,
            headers: { 'x-genesis-id': config.genesis.id }
        })
    }

    public get head() { return this.node.head }

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
