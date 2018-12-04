
export function createTxVisitor(
    wire: Thor.Wire,
    id: string
): Connex.Thor.TransactionVisitor {

    let head: string | undefined

    return {
        get id() { return id },
        head(val) {
            head = val
            return this
        },
        get: () => {
            return wire.get<Connex.Thor.Transaction | null>(
                `transactions/${encodeURIComponent(id)}`,
                { head }
            )
        },
        getReceipt: () => {
            return wire.get<Connex.Thor.Receipt | null>(
                `transactions/${encodeURIComponent(id)}/receipt`,
                { head }
            )
        }
    }
}
