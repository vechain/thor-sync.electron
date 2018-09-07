import Thor = Connex.Thor
import Endpoint from './endpoint'

export function create(
    ep: Endpoint,
    id: string,
    head?: string
): Thor.TransactionVisitor {
    return {
        get id() { return id },
        get head() { return head },
        get() {
            return ep.get<Thor.Transaction & { meta: Thor.Transaction.Meta }>(
                `transactions/${encodeURIComponent(id)}`,
                { head }
            )
        },
        receipt() {
            return ep.get<Thor.Receipt & { meta: Thor.Transaction.Meta }>(
                `transactions/${encodeURIComponent(id)}/receipt`,
                { head }
            )
        }
    }
}
