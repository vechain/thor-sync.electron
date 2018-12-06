

declare namespace Thor {
    interface Site {
        readonly config: Site.Config
        readonly status: Connex.Thor.Status
        nextTick(): Promise<void>
        createWire(): Wire
    }

    namespace Site {
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
}
