import Thor = Connex.Thor

export function create(
    wire: WireInterface,
    id: string,
    head?: string
): Thor.TransactionVisitor {
    return {
        get id() { return id },
        get head() { return head },
        get() {
            return wire.get<(Thor.Transaction & { meta: Thor.Transaction.Meta }) | null>(
                `transactions/${encodeURIComponent(id)}`,
                { head }
            )
        },
        receipt() {
            return wire.get<(Thor.Receipt & { meta: Thor.Transaction.Meta }) | null>(
                `transactions/${encodeURIComponent(id)}/receipt`,
                { head }
            )
        }
    }
}
