
declare interface Connex {
    commitTx(raw: string): Promise<string>
}
