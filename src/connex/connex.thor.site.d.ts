declare namespace Connex {
    namespace Thor {
        interface Site {
            readonly config: Site.Config
            readonly status: Thor.Status
            nextTick(): Promise<void>

            withWireAgent(agent?: any): Site
            createWire(): Site.Wire
        }
        namespace Site {
            interface Wire {
                get<T>(path: string, query?: object): Promise<T>
                post<T>(path: string, data: object, query?: object): Promise<T>
                ws(path: string, query?: object): WebSocket
            }

            interface WebSocket {
                close(): void
                read(): Promise<string | Buffer | ArrayBuffer | Buffer[]>
            }

            type Config = {
                name: string
                url: string
                genesis: Connex.Thor.Block
            }
        }
    }
}