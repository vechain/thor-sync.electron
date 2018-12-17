import cloneDeep from 'lodash.clonedeep'

export function createTxVisitor(
    wire: Thor.Wire,
    cache: Thor.Cache,
    id: string
): Connex.Thor.TransactionVisitor {
    return {
        get id() { return id },
        get: () => {
            return cache.getTx(id,
                () => wire.get<Connex.Thor.Transaction | null>(
                    `transactions/${encodeURIComponent(id)}`))
                .then(tx => cloneDeep(tx))
        },
        getReceipt: () => {
            return cache.getReceipt(id,
                () => wire.get<Connex.Thor.Receipt | null>(
                    `transactions/${encodeURIComponent(id)}/receipt`))
                .then(r => cloneDeep(r))
        }
    }
}
