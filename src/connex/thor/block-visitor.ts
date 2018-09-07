import Thor = Connex.Thor
import Endpoint from './endpoint'

export function create(
    ep: Endpoint,
    revision: string | number
): Thor.BlockVisitor {
    return {
        get revision() { return revision },
        get() {
            return ep.get<Thor.Block & { isTrunk: boolean }>(
                `blocks/${encodeURIComponent(revision + '')}`)
        }
    }
}
