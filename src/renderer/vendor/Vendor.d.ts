import { } from 'electron'

declare module 'electron' {
    interface App {
        vendor: {
            [clientId: string]: SignTx
        }
    }
}
