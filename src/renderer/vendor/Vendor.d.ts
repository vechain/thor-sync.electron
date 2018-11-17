import { } from 'electron'

declare module 'electron' {
    interface App {
        vendor: {
            [windowId: number]: SignTx
        }
    }
}
