

declare namespace Thor {
    interface Node {
        readonly config: Node.Config
        readonly status: Connex.Thor.Status
        nextTick(): Promise<void>
        createWire(): Wire
    }

    namespace Node {
        type Config = {
            name: string
            url: string
            genesis: Connex.Thor.Block
        }
    }

    interface Wire {
        get<T>(path: string, query?: object): Promise<T>
        post<T>(path: string, data: object, query?: object): Promise<T>
    }

    interface Cache {
        get<T>(key: string, loader : () => T): T
    }
}
