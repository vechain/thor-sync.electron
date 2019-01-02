import cloneDeep from 'lodash.clonedeep'

export function createTxVisitor(
    client: Client,
    id: string
): Connex.Thor.TransactionVisitor {
    return {
        get id() { return id },
        get: () => {
            return client.getTx(id)
                .then(cloneDeep)
        },
        getReceipt: () => {
            return client.getReceipt(id)
                .then(cloneDeep)
        }
    }
}
