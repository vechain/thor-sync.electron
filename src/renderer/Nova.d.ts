import { } from 'electron'

declare module 'electron' {
    interface App {
        nova: {
            [client: string]: {
                newTab(): void
                closeTab(): void
            }
        }
    }
}
