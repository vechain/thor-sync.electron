declare namespace SignTxDialog {
    type Data = {
        origin: string
        clauses: Connex.Thor.Clause[]
        callback(error?: Error, result?: string): void
    }
}
