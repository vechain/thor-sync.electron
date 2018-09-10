import Thor = Connex.Thor

export function create(
    wire: WireInterface,
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
