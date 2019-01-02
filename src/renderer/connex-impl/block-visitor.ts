import cloneDeep from 'lodash.clonedeep'

export function createBlockVisitor(
    client: Client,
    revision: string | number
): Connex.Thor.BlockVisitor {
    return {
        get revision() { return revision },
        get: () => {
            return client.getBlock(revision)
                .then(cloneDeep)
        }
    }
}
