
import { request, NetError } from './net'
import * as log from 'electron-log'
import * as NodeURL from 'url'

class Item {
    private static readonly MAX_RETRIES = 5

    public sent = false

    private retries = 0
    private requesting = false
    private timer?: any

    constructor(
        readonly rawTx: string,
        readonly url: string) {
    }

    public send() {
        this.retries = 0
        this.sent = false
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = undefined
        }

        if (this.requesting) {
            return
        }

        this._send()
    }

    public get status() {
        if (this.sent) {
            return 'sent'
        }
        if (this.retries >= Item.MAX_RETRIES) {
            return 'error'
        }
        return 'sending'
    }

    private async _send() {
        try {
            this.requesting = true
            const resp = await request({
                method: 'POST',
                url: this.url,
                headers: { 'Content-Type': 'application/json' },
                body: Buffer.from(JSON.stringify({ raw: this.rawTx }))
            })
            if (resp.statusCode < 200 || resp.statusCode >= 300) {
                throw new NetError(`${resp.statusCode} ${resp.statusMessage}`)
            }
            const obj = JSON.parse(resp.body.toString('utf8'))
            log.debug('TxQueue:', `tx sent ${obj.id}`)
            this.sent = true
        } catch (err) {
            log.warn('TxQueue:', `tx send error ${err}`)
            this.retries++
            if (this.retries < Item.MAX_RETRIES) {
                this.timer = setTimeout(() => {
                    this.timer = undefined
                    this._send()
                }, 10 * 1000)
            }
        } finally {
            this.requesting = false
        }
    }
}

export class Txer {
    private readonly map = new Map<string, Item>()

    public enqueue(id: string, raw: string, baseUrl: string) {
        let item = this.map.get(id)
        if (!item) {
            item = new Item(raw, NodeURL.resolve(baseUrl, 'transactions'))
            this.map.set(id, item)
        }
        item.send()
    }

    public status(id: string) {
        const item = this.map.get(id)
        return item ? item.status : undefined
    }
}
