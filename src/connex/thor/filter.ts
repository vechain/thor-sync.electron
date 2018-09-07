import Thor = Connex.Thor
import Endpoint from './endpoint'

export function create<T extends 'event' | 'transfer'>(
    ep: Endpoint,
    kind: T,
    criteriaSet: Array<Thor.Criteria<T>>
): Thor.Filter<T> {

    if (kind !== 'event' && kind !== 'transfer') {
        throw new Error('invalid filter kind')
    }
    const filterBody = {
        range: {
            unit: 'block',
            from: 0,
            to: 2 ** 32 - 1
        },
        options: {
            offset: 0,
            limit: 10
        },
        criteriaSet
    }
    const query = { order: 'asc' }

    const filter: Thor.Filter<T> = {
        get kind() { return kind },
        range(unit: 'block' | 'time', from: number, to: number) {
            filterBody.range = { unit, from, to }
            return filter
        },
        order(order: 'asc' | 'desc') {
            query.order = order
            return filter
        },
        offset(offset: number) {
            filterBody.options.offset = offset
            return filter
        },
        next(limit: number) {
            filterBody.options.limit = limit
            return ep.post<Array<Thor.Log<T>>>(`logs/${kind}`, filter, query)
        }
    }
    return filter
}
