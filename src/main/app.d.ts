import { App } from 'electron'
import { Backend } from './backend'

declare module 'electron' {
    interface App {
        readonly backend: Backend
    }
}

declare global {
    interface Window {
        readonly connex: Connex
    }
}
