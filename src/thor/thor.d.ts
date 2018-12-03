

declare namespace Thor {
    interface Wire {
        get<T>(path: string, query?: object): Promise<T>
        post<T>(path: string, data: object, query?: object): Promise<T>
        ws(path: string, query?: object): WS
    }

    interface WS {
        close(): void
        read(): Promise<string | Buffer | ArrayBuffer | Buffer[]>
    }

    type SiteConfig = {
        name: string
        url: string
        genesis: Connex.Thor.Block
    }
}
