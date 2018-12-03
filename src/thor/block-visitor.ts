
export function createBlockVisitor(
    wire: Thor.Wire,
    revision: string | number
): Connex.Thor.BlockVisitor {
    return {
        get revision() { return revision },
        get: () => {
            return wire.get<Connex.Thor.Block | null>(
                `blocks/${encodeURIComponent(revision + '')}`)
        }
    }
}
