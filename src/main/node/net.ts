import { net } from 'electron'
import * as QS from 'qs'
import * as NodeUrl from 'url'
import * as log from 'electron-log'
import env from '@/env'

export class Net {
    public static request(options: {
        method: 'GET' | 'POST',
        url: string,
        headers?: { [key: string]: string },
        body?: Buffer,
    }) {
        return new Promise<Response>((_resolve, _reject) => {
            const resolve = (r: Response) => {
                clearInterval(timer)
                log.debug(`net(${Date.now() - start}ms)`, r.statusCode, options.method, options.url)
                _resolve(r)
            }
            const reject = (err: any) => {
                clearInterval(timer)
                log.warn(`net(${Date.now() - start}ms)`, options.method, options.url,
                    `[${err.name}: ${err.message}]`)
                _reject(err)
            }

            let idles = 0
            const timer = setInterval(() => {
                idles++
                if (idles > 15) {
                    reject(new NetError('request timeout'))
                    req.abort()
                }
            }, 1 * 1000)

            const start = Date.now()

            const req = net.request({
                method: options.method,
                url: options.url,
                partition: `persist:${env.devMode ? 'dev' : 'pro'}`
            })
            if (options.headers) {
                for (const key in options.headers) {
                    if (options.headers.hasOwnProperty(key)) {
                        req.setHeader(key, options.headers[key])
                    }
                }
            }
            if (options.body) {
                req.write(options.body)
            }

            req.on('response', resp => {
                idles = 0
                const chunks: Buffer[] = []
                resp.on('data', chunk => {
                    idles = 0
                    chunks.push(chunk)
                }).on('end', () => {
                    const buf = Buffer.concat(chunks)
                    resolve({
                        statusCode: resp.statusCode,
                        statusMessage: resp.statusMessage,
                        headers: resp.headers,
                        body: buf
                    })
                }).on('error', (err: any) => {
                    reject(new NetError(`${err.name}:${err.message}`))
                }).on('aborted', () => {
                    reject(new NetError('aborted'))
                })
            }).end()
        })
    }

    constructor(private readonly config: NodeConfig) { }

    public get<T>(path: string, query?: object): Promise<T> {
        return this.request('GET', path, undefined, query)
    }

    public post<T>(path: string, data: object, query?: object): Promise<T> {
        return this.request('POST', path, data, query)
    }

    private async request<T>(method: 'GET' | 'POST', path: string, body?: object, query?: object) {
        const url = this.resolveUrl(path, query)
        const resp = await Net.request({
            method,
            url,
            headers: {
                'x-genesis-id': this.config.genesis.id,
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: body ? Buffer.from(JSON.stringify(body), 'utf8') : undefined
        })
        if (resp.statusCode < 200 || resp.statusCode >= 300) {
            throw new NetError(`${resp.statusCode} ${resp.statusMessage}`)
        }
        try {
            return JSON.parse(resp.body.toString('utf8')) as T
        } catch {
            throw new NetError('unable to parse response data')
        }
    }

    private resolveUrl(path: string, query?: object): string {
        let qs = QS.stringify(query)
        if (qs) {
            qs = '?' + qs
        }
        return NodeUrl.resolve(this.config.url, `${path}${qs}`)
    }
}

type Response = {
    headers: { [key: string]: string[] }
    statusCode: number
    statusMessage: string
    body: Buffer
}


export class NetError extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = NetError.name
    }
}

