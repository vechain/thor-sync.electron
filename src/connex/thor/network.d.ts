

declare interface Network {
    readonly url: string
    readonly genesisBlock: Connex.Thor.Block
    readonly bestBlock: Connex.Thor.Block
    nextTick(): Promise<void>

    withWireAgent(agent?: any): Network
    createWire(): Network.Wire
}

declare namespace Network {
    interface Wire {
        readonly url: string
        get<T>(path: string, query?: object): Promise<T>
        post<T>(path: string, data: object, query?: object): Promise<T>
        ws(path: string, query?: object): WebSocket
    }

    interface WebSocket {
        close(): void
        read(): Promise<string | Buffer | ArrayBuffer | Buffer[]>
    }
}
