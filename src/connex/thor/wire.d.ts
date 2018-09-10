
declare interface WireInterface {
    readonly agent?: any
    readonly genesisId: string
    get<T>(path: string, query?: object): Promise<T>
    post<T>(path: string, data: object, query?: object): Promise<T>
    resolve(path: string, query?: object): string
}
