declare namespace Connex{
    namespace Thor {
        interface Site {
            readonly url: string
            readonly genesis: Thor.Block
            readonly status: Thor.Status
            nextTick(): Promise<void>

            withWireAgent(agent?: any): Site
            createWire(): Site.Wire
        }
        namespace Site {
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
    }
}