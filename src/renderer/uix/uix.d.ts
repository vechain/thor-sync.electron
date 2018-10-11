import { } from 'electron'

type UIXMethods = {
    signTx(
        clientId: string [],
        clauses: Connex.Thor.Clause[],
        options?: Connex.Vendor.Options<'tx'>
    ): Promise<Connex.Vendor.Signed<'tx'>>
}

declare module 'electron' {
    interface App {
        uix: {
            [wcId: string]: UIXMethods
        }
    }
}
