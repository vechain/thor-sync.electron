import Thor = Connex.Thor

export function createBlockVisitor(
    wire: Thor.Site.Wire,
    revision: string | number
): Thor.BlockVisitor {
    return {
        get revision() { return revision },
        get() {
            return wire.get<(Thor.Block & { isTrunk: boolean }) | null>(
                `blocks/${encodeURIComponent(revision + '')}`)
        }
    }
}
