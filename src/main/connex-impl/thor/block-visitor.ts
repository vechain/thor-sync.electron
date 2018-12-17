import cloneDeep from 'lodash.clonedeep'

export function createBlockVisitor(
    wire: Thor.Wire,
    cache: Thor.Cache,
    revision: string | number
): Connex.Thor.BlockVisitor {
    return {
        get revision() { return revision },
        get: () => {
            return cache.getBlock(revision, () =>
                wire.get<Connex.Thor.Block | null>(
                    `blocks/${encodeURIComponent(revision + '')}`)
            ).then(b => cloneDeep(b))
        }
    }
}
