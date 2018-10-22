import Thor = Connex.Thor

export function createTxVisitor(
    wire: Thor.Site.Wire,
    id: string,
    head?: string
): Thor.TransactionVisitor {
    return {
        get id() { return id },
        get head() { return head },
        get() {
            return wire.get<(Thor.Transaction & Thor.Transaction.Meta) | null>(
                `transactions/${encodeURIComponent(id)}`,
                { head }
            )
        },
        getReceipt() {
            return wire.get<(Thor.Receipt & Thor.Transaction.Meta) | null>(
                `transactions/${encodeURIComponent(id)}/receipt`,
                { head }
            )
        }
    }
}
