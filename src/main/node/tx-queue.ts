import { Net } from './net'
import * as log from 'electron-log'

class Item {
    private static readonly MAX_RETRIES = 5

    public sent = false

    private retries = 0
    private requesting = false
    private timer?: any

    constructor(
        readonly rawTx: string,
        readonly net: Net) {
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
            const { id } = await this.net.post<{ id: string }>('transactions', { raw: this.rawTx })
            log.debug('TxQueue:', `tx sent ${id}`)
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

export class TxQueue {
    private readonly map = new Map<string, Item>()

    constructor(private readonly net: Net) { }

    public enqueue(id: string, raw: string) {
        let item = this.map.get(id)
        if (!item) {
            item = new Item(raw, this.net)
            this.map.set(id, item)
        }
        item.send()
    }

    public status(id: string) {
        const item = this.map.get(id)
        return item ? item.status : undefined
    }
}
