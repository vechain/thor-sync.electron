
class Item {
    private static readonly MAX_RETRIES = 5

    public sent = false

    private retries = 0
    private requesting = false
    private timer?: any

    constructor(
        readonly rawTx: string,
        readonly wire: Thor.Wire) {
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
            const { id } = await this.wire.post<{ id: string }>('transactions', { raw: this.rawTx })
            // tslint:disable-next-line:no-console
            console.log('tx sent: ' + id)
            this.sent = true
        } catch (err) {
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



class TxQueue {
    private readonly map = new Map<string, Item>()

    public enqueue(id: string, raw: string, wire: Thor.Wire) {
        let item = this.map.get(id)
        if (!item) {
            item = new Item(raw, wire)
            this.map.set(id, item)
        }
        item.send()
    }

    public status(id: string) {
        const item = this.map.get(id)
        return item ? item.status : undefined
    }
}

export default TxQueue
