declare interface Txer {
    send(id: string, raw: string): void
    status(id: string): 'sending' | 'sent' | 'error' | undefined
}
