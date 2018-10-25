declare interface Connex {
    txQueue: {
        send(id: string, raw: string): void
        status(id: string): 'absent' | 'sending' | 'sent' | 'failed'
    }
}
