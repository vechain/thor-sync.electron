import { Agent as HttpAgent } from 'http'
import { Agent as HttpsAgent } from 'https'

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
