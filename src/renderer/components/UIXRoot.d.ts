
import { } from 'electron'

type UIXMethods = {
    signTx(origin: string, clauses: Connex.Thor.Clause[]): Promise<string>
}

declare module 'electron' {
    interface App {
        uix: {
            [wcId: string]: UIXMethods
        }
    }
}

declare global {
    interface Window {
        UIX: UIXMethods
    }
    const UIX: UIXMethods
}
