declare interface Connex {
    txQueue: {
        send(id: string, raw: string): void
        status(id: string): 'sending' | 'sent' | 'error' | undefined
    }
}
