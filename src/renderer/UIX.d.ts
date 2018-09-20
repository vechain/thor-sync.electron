/** user interaction proxy methods */
declare interface UIXMethods {
    signTx(address: string, clauses: Connex.Thor.Clause[]): Promise<string>
}
