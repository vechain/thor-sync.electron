type Item = {
    raw: string
    wire: Connex.Thor.Site.Wire
    sent: boolean
    retries: number
}

const MAX_RETRIES = 5

class TxQueue {
    private readonly map = new Map<string, Item>()

    public enqueue(id: string, raw: string, wire: Connex.Thor.Site.Wire) {
        const item = {
            raw,
            wire,
            sent: false,
            retries: 0,
        }

        this.map.set(id, item)
        this.send(item)
    }

    public status(id: string): 'sending' | 'sent' | 'error' | undefined {
        const item = this.map.get(id)
        if (item) {
            if (item.sent) {
                return 'sent'
            }
            if (item.retries >= MAX_RETRIES) {
                return 'error'
            }
            return 'sending'
        }
    }

    private send(item: Item) {
        item.wire.post<{ id: string }>('transactions', { raw: item.raw })
            .then(id => {
                // tslint:disable-next-line:no-console
                console.log('tx sent: ' + id)
                item.sent = true
            })
            .catch(() => {
                item.retries++
                if (item.retries < MAX_RETRIES) {
                    setTimeout(() => {
                        this.send(item)
                    }, item.retries * 10000)
                }
            })
    }
}

export default TxQueue
