declare namespace Thor {
    interface Node {
        readonly genesis: Connex.Thor.Block
        readonly head: Connex.Thor.Status['head']
        readonly progress: number
        nextTick(): Promise<void>
        createWire(): Wire
    }

    interface Wire {
        readonly head: Connex.Thor.Status['head']
        get<T>(path: string, query?: object): Promise<T>
        post<T>(path: string, data: object, query?: object): Promise<T>
    }

    interface Cache {
        getBlock(
            rev: string | number,
            fetch: () => Promise<Connex.Thor.Block | null>
        ): Promise<Connex.Thor.Block | null>

        getAccount(
            addr: string,
            rev: string,
            fetch: () => Promise<Connex.Thor.Account>
        ): Promise<Connex.Thor.Account>

        getTx(
            txId: string,
            fetch: () => Promise<Connex.Thor.Transaction | null>
        ): Promise<Connex.Thor.Transaction | null>

        getReceipt(
            txId: string,
            fetch: () => Promise<Connex.Thor.Receipt | null>
        ): Promise<Connex.Thor.Receipt | null>
    }
}
