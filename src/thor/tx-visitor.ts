
export function createTxVisitor(
    wire: Thor.Wire,
    id: string,
    options: { head?: string }
): Connex.Thor.TransactionVisitor {
    options = options || {}
    const head = options.head

    return {
        get id() { return id },
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
