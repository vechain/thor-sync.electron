import { } from 'electron'

declare module 'electron' {
    interface App {
        vendor: {
            [wcId: string]: SignTx
        }
    }
}
